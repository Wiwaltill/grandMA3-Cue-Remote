import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson } from '../apps/web/src/transport/request.ts';

function fixture() {
  const calls: unknown[][]=[];
  const request={status:200,responseText:'{"confirmed":true}',timeout:0,
    open:(...args: unknown[])=>calls.push(['open',...args]),
    setRequestHeader:(...args: unknown[])=>calls.push(['header',...args]),
    send:(...args: unknown[])=>calls.push(['send',...args]),
    onload:()=>{},onerror:()=>{},ontimeout:()=>{},onabort:()=>{}};
  return {request,calls,create:()=>request as unknown as XMLHttpRequest};
}
test('Safari-compatible request uses same-origin XHR and a bounded timeout without Fetch or AbortSignal',async()=>{
  const f=fixture();const pending=requestJson('/api/state',undefined,f.create);
  assert.equal(f.request.timeout,2500);assert.deepEqual(f.calls,[['open','GET','/api/state',true],['send',null]]);
  f.request.onload();assert.deepEqual(await pending,{confirmed:true});
});
test('command sends JSON once and never retries after timeout',async()=>{
  const f=fixture();const pending=requestJson('/api/commands',{action:'goPlus'},f.create);
  assert.deepEqual(f.calls,[['open','POST','/api/commands',true],['header','Content-Type','application/json'],['header','X-Cue-Remote','1'],['send','{"action":"goPlus"}']]);
  f.request.ontimeout();await assert.rejects(pending,/timed out/);
  assert.equal(f.calls.filter(call=>call[0]==='send').length,1);
});
test('rejected session and malformed JSON cannot become successful status',async()=>{
  for(const status of [401,403,500]){
    const f=fixture();f.request.status=status;const pending=requestJson('/api/state',undefined,f.create);
    f.request.onload();await assert.rejects(pending,/rejected/);
  }
  const f=fixture();f.request.responseText='<html>';const pending=requestJson('/api/state',undefined,f.create);
  f.request.onload();await assert.rejects(pending,/Invalid response/);
});
test('network failure and abort reject without resending',async()=>{
  for(const event of ['onerror','onabort'] as const){
    const f=fixture();const pending=requestJson('/api/commands',{action:'goMinus'},f.create);
    f.request[event]();await assert.rejects(pending);
    assert.equal(f.calls.filter(call=>call[0]==='send').length,1);
  }
});
