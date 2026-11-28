import { test } from 'node:test';
import { request } from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RemoteServer, isServerConfig } from '../apps/desktop/src/server.ts';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(),'cue-server-'));
  await mkdir(join(root,'assets'));
  await writeFile(join(root,'index.html'),'<!doctype html><title>Remote</title>');
  await writeFile(join(root,'legacy-csp.json'),'[]');
  await writeFile(join(root,'assets','remote-test.js'),'export const remote = true;');
  return {root,cleanup:()=>rm(root,{recursive:true,force:true})};
}
test('server config accepts only explicit valid port and LAN scope',() => {
  for (const value of [null,{}, {port:80,allowLan:false},{port:65536,allowLan:false},{port:4173.5,allowLan:false},{port:'4173',allowLan:false},{port:4173,allowLan:'yes'}]) assert.equal(isServerConfig(value),false);
  assert.equal(isServerConfig({port:0,allowLan:false}),true);
  assert.equal(isServerConfig({port:4173,allowLan:true}),true);
});
test('server starts only on request, serves built web app, stops and restarts',async () => {
  const f = await fixture(); const changes: string[] = [];
  const server = new RemoteServer(f.root,status=>changes.push(status.phase));
  try {
    assert.equal(server.getStatus().phase,'stopped');
    const running = await server.start({port:0,allowLan:false});
    assert.equal(running.phase,'running');assert.equal(running.allowLan,false);assert.equal(running.urls.length,1);
    const response = await fetch(running.urls[0]);
    assert.equal(response.status,200);assert.match(await response.text(),/<title>Remote/);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.match(response.headers.get('content-security-policy')!,/connect-src 'none'/);
    const asset = await fetch(`${running.urls[0]}/assets/remote-test.js`);
    assert.equal(asset.status,200);assert.match(asset.headers.get('content-type')!,/javascript/);
    const head = await fetch(running.urls[0],{method:'HEAD'});assert.equal(await head.text(),'');
    assert.equal((await server.stop()).phase,'stopped');
    await assert.rejects(fetch(running.urls[0]));
    assert.equal((await server.start({port:0,allowLan:false})).phase,'running');
    assert.deepEqual(changes.slice(0,4),['starting','running','stopping','stopped']);
  } finally {await server.stop();await f.cleanup();}
});
test('server rejects repository paths, desktop files and all mutating HTTP requests',async () => {
  const f=await fixture();const server=new RemoteServer(f.root);
  try {
    const {urls}=await server.start({port:0,allowLan:false});
    for (const path of ['/package.json','/apps/desktop/index.html','/assets/../package.json','/%2e%2e/package.json','/assets/%2e%2e/index.html','/assets/missing.js']) {
      const status = await new Promise<number | undefined>((resolve,reject) => {
        const req = request(urls[0],{path},response => {response.resume();resolve(response.statusCode);});
        req.on('error',reject);req.end();
      });
      assert.equal(status,404,path);
    }
    assert.equal((await fetch(urls[0],{method:'POST',body:'stop'})).status,405);
    assert.equal(server.getStatus().phase,'running');
  } finally {await server.stop();await f.cleanup();}
});
test('port collision is reported, never takes over the existing server, and allows retry',async () => {
  const f=await fixture();const a=new RemoteServer(f.root);const b=new RemoteServer(f.root);
  try {
    const first=await a.start({port:0,allowLan:false});
    const failure=await b.start({port:first.port,allowLan:false});
    assert.equal(failure.phase,'error');assert.equal(failure.error,'port-in-use');assert.deepEqual(failure.urls,[]);
    assert.equal((await fetch(first.urls[0])).status,200);
    assert.equal((await b.start({port:0,allowLan:false})).phase,'running');
  } finally {await a.stop();await b.stop();await f.cleanup();}
});
test('duplicate start and stop actions are safe',async () => {
  const f=await fixture();const server=new RemoteServer(f.root);
  try {
    const [first,second]=await Promise.all([server.start({port:0,allowLan:false}),server.start({port:0,allowLan:true})]);
    assert.equal(first.phase,'running');assert.equal(second.phase,'starting');
    const repeated=await server.start({port:0,allowLan:true});
    assert.equal(repeated.port,first.port);assert.equal(repeated.allowLan,false);
    await Promise.all([server.stop(),server.stop()]);assert.equal(server.getStatus().phase,'stopped');
    assert.equal((await server.stop()).phase,'stopped');
  } finally {await server.stop();await f.cleanup();}
});
test('missing build and malformed config are shown as errors without listening',async () => {
  const server=new RemoteServer(join(tmpdir(),'cue-remote-no-such-build'));
  assert.equal((await server.start({port:80,allowLan:false})).error,'invalid-config');
  assert.equal((await server.start({port:0,allowLan:false})).error,'missing-build');
  assert.deepEqual(server.getStatus().urls,[]);
  assert.equal((await server.stop()).phase,'stopped');
});

test('legacy loader CSP uses build hashes without enabling arbitrary inline scripts or eval',async()=>{
  const f=await fixture();const server=new RemoteServer(f.root);const hash='A'.repeat(43)+'=';
  try{
    await writeFile(join(f.root,'legacy-csp.json'),JSON.stringify([hash]));
    const state=await server.start({port:0,allowLan:false});const response=await fetch(state.urls[0]);
    const policy=response.headers.get('content-security-policy')!;
    assert.ok(policy.includes(`'sha256-${hash}'`));assert.ok(!policy.includes('unsafe-inline'));assert.ok(!policy.includes('unsafe-eval'));
    assert.equal((await fetch(state.urls[0]+'/legacy-csp.json')).status,404);
    await server.stop();await writeFile(join(f.root,'legacy-csp.json'),'["unsafe-inline"]');
    assert.equal((await server.start({port:0,allowLan:false})).error,'missing-build');
  }finally{await server.stop();await f.cleanup();}
});

test('live HTTP API requires operator token, rejects cross-origin mutations and exposes no configuration or shell',async()=>{
  const {OscBridge}=await import('../apps/desktop/src/bridge.ts');
  const f=await fixture();const bridge=new OscBridge();const server=new RemoteServer(f.root,()=>{},bridge);
  try {
    const state=await server.start({port:0,allowLan:false});const url=state.urls[0];
    const session=(await fetch(url)).headers.get('set-cookie')!.split(';')[0];
    const token=session.slice(session.indexOf('=')+1);const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
    assert.equal((await fetch(url+'/api/state')).status,401);
    const response=await fetch(url+'/api/state',{headers});assert.equal(response.status,200);
    assert.equal((await response.json()).snapshot.connectionState,'OFFLINE');
    assert.equal((await fetch(url+'/api/commands',{method:'POST',headers:{...headers,Origin:'http://untrusted.test'},body:'{}'})).status,403);
    const invalid=await fetch(url+'/api/commands',{method:'POST',headers,body:JSON.stringify({action:'shell',command:'Off Sequence Thru'})});
    assert.deepEqual(await invalid.json(),{accepted:false,reason:'invalid'});
    assert.equal((await fetch(url+'/api/target',{method:'POST',headers:{...headers,Origin:'http://untrusted.test'},body:'{}'})).status,403);
    const invalidTarget=await fetch(url+'/api/target',{method:'POST',headers,body:JSON.stringify({dataPool:'1; Off',number:'2',expectedRevision:0})});
    assert.deepEqual(await invalidTarget.json(),{accepted:false,reason:'invalid'});
    assert.equal((await fetch(url+'/api/target',{method:'POST',headers,body:JSON.stringify({dataPool:1,number:'2',expectedRevision:0})})).status,400);
    const removedPause=await fetch(url+'/api/commands',{method:'POST',headers,body:JSON.stringify({action:'pause',requestId:'removed-pause'})});assert.deepEqual(await removedPause.json(),{accepted:false,reason:'invalid'});
    assert.equal((await fetch(url+'/api/connect',{method:'POST',headers,body:'{}'})).status,400);
    assert.equal((await fetch(url+'/api/sequence',{method:'POST',headers,body:'null'})).status,400);
    assert.equal((await fetch(url+'/api/lock',{method:'POST',headers,body:JSON.stringify({locked:false})})).status,200);
    assert.equal(bridge.getState().snapshot.locked,true);
    await server.stop();const restarted=await server.start({port:0,allowLan:false});
    assert.notEqual((await fetch(restarted.urls[0])).headers.get('set-cookie')!.split(';')[0],session);
    assert.equal((await fetch(restarted.urls[0]+'/api/state',{headers})).status,401);
  }finally{await server.stop();bridge.disconnect();await f.cleanup();}
});

test('plain IP and port establish an HttpOnly browser session for multiple clients without a URL secret',async()=>{
  const {OscBridge}=await import('../apps/desktop/src/bridge.ts');
  const f=await fixture();const bridge=new OscBridge();const server=new RemoteServer(f.root,()=>{},bridge);
  try{
    const state=await server.start({port:0,allowLan:false});const url=state.urls[0];
    assert.deepEqual(state.accessUrls,state.urls);assert.equal(new URL(state.accessUrls![0]).hash,'');
    const page=await fetch(url);const cookie=page.headers.get('set-cookie')!;
    assert.match(cookie,/^cue-remote-\d+=[a-f0-9]{64}; HttpOnly; SameSite=Strict; Path=\/$/);
    const headers={Cookie:cookie.split(';')[0]};
    assert.equal((await fetch(url+'/api/state')).status,401);
    assert.equal((await fetch(url+'/api/state',{headers})).status,200);
    assert.equal((await fetch(url+'/?page=settings')).headers.get('set-cookie'),cookie);
    const jsonHeaders={...headers,'Content-Type':'application/json'};
    assert.equal((await fetch(url+'/api/lock',{method:'POST',headers:jsonHeaders,body:'{"locked":false}'})).status,403);
    assert.equal((await fetch(url+'/api/lock',{method:'POST',headers:{...jsonHeaders,'X-Cue-Remote':'1'},body:'{"locked":false}'})).status,200);
    assert.equal((await fetch(url+'/api/lock',{method:'POST',headers:{...jsonHeaders,'X-Cue-Remote':'1',Origin:'http://untrusted.test'},body:'{"locked":false}'})).status,403);
    const response=await fetch(url+'/api/lock',{method:'POST',headers:{...jsonHeaders,Origin:url},body:'{"locked":false}'});
    assert.equal(response.status,200);assert.equal((await response.json()).snapshot.locked,true);
    assert.equal((await fetch(url+'/assets/remote-test.js')).headers.get('set-cookie'),null);
    assert.equal((await fetch(url,{method:'HEAD'})).headers.get('set-cookie'),null);
  }finally{await server.stop();bridge.disconnect();await f.cleanup();}
});

test('shortcut reopens on the same port after restart and replaces the expired session without unlocking',async()=>{
  const {OscBridge}=await import('../apps/desktop/src/bridge.ts');
  const f=await fixture();const bridge=new OscBridge();const server=new RemoteServer(f.root,()=>{},bridge);
  try{
    const first=await server.start({port:0,allowLan:false});const url=first.urls[0];
    const cookie=(await fetch(url)).headers.get('set-cookie')!.split(';')[0];
    await server.stop();const second=await server.start({port:first.port,allowLan:false});
    assert.equal(second.urls[0],url);
    assert.equal((await fetch(url+'/api/state',{headers:{Cookie:cookie}})).status,401);
    const renewed=(await fetch(url,{headers:{Cookie:cookie}})).headers.get('set-cookie')!.split(';')[0];
    assert.notEqual(renewed,cookie);
    const response=await fetch(url+'/api/state',{headers:{Cookie:renewed}});
    assert.equal(response.status,200);assert.equal((await response.json()).snapshot.locked,true);
  }finally{await server.stop();bridge.disconnect();await f.cleanup();}
});

test('browser sessions reject foreign origins, embedded bootstrap and unexpected Host headers',async()=>{
  const {OscBridge}=await import('../apps/desktop/src/bridge.ts');
  const f=await fixture();const bridge=new OscBridge();const server=new RemoteServer(f.root,()=>{},bridge);
  try{
    const {urls}=await server.start({port:0,allowLan:false});const url=urls[0];
    const cookie=(await fetch(url)).headers.get('set-cookie')!.split(';')[0];
    const foreignHeaders: Record<string,string>[]=[{Origin:'http://untrusted.test'},{'Sec-Fetch-Site':'cross-site'},{'Sec-Fetch-Site':'same-site'}];
    for(const extra of foreignHeaders){
      assert.equal((await fetch(url,{headers:extra})).headers.get('set-cookie'),null);
      assert.equal((await fetch(url+'/api/state',{headers:{Cookie:cookie,...extra}})).status,403);
      assert.equal((await fetch(url+'/api/lock',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json',Origin:url,...extra},body:'{"locked":false}'})).status,403);
    }
    assert.equal((await fetch(url,{headers:{'Sec-Fetch-Dest':'iframe'}})).headers.get('set-cookie'),null);
    const status=await new Promise<number|undefined>((resolve,reject)=>{
      const req=request(url,{headers:{Host:'untrusted.test'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();
    });assert.equal(status,421);
    assert.equal(bridge.getState().snapshot.locked,true);
  }finally{await server.stop();bridge.disconnect();await f.cleanup();}
});
