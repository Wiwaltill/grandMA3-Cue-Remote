import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { OscBridge } from './bridge.js';
import type { Command } from '../../../packages/shared/playback.js';
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import type { ServerConfig, ServerStatus } from './contracts.js';

const mime: Record<string,string> = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
export function isServerConfig(value: unknown): value is ServerConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as ServerConfig;
  return typeof config.allowLan === 'boolean' && Number.isInteger(config.port) && (config.port === 0 || config.port >= 1024 && config.port <= 65535);
}
// Serves the remote UI and a narrowly scoped, authenticated playback API.
export class RemoteServer {
  private server: Server | null = null;
  private token = randomBytes(32).toString('hex');
  private bridge: OscBridge | undefined;
  private status: ServerStatus = {phase:'stopped',port:null,allowLan:false,urls:[],error:null};
  constructor(privateRoot: string, onChange: (status: ServerStatus) => void = () => {}, bridge?: OscBridge) {
    this.bridge = bridge;
    this.root = privateRoot; this.onChange = onChange;
  }
  private readonly root: string;
  private readonly onChange: (status: ServerStatus) => void;
  getStatus(): ServerStatus { return {...this.status,urls:[...this.status.urls]}; }
  private update(update: Partial<ServerStatus>) {
    this.status = {...this.status,...update}; this.onChange(this.getStatus());
    return this.getStatus();
  }
  async start(config: unknown): Promise<ServerStatus> {
    if (['running','starting','stopping'].includes(this.status.phase)) return this.getStatus();
    if (!isServerConfig(config)) return this.update({phase:'error',error:'invalid-config'});
    this.token=randomBytes(32).toString('hex');this.bridge?.setLocked(true);
    this.update({phase:'starting',port:null,allowLan:config.allowLan,urls:[],error:null});
    let scriptHashes: string[]=[];
    try {
      await stat(join(this.root,'index.html'));
      const hashes: unknown=JSON.parse(await readFile(join(this.root,'legacy-csp.json'),'utf8'));
      if(!Array.isArray(hashes) || hashes.length>16 || !hashes.every(hash=>typeof hash==='string' && /^[A-Za-z0-9+/]{43}=$/.test(hash)))throw new Error('Invalid CSP manifest');
      scriptHashes=hashes.map(hash=>`'sha256-${hash}'`);
    }
    catch { return this.update({phase:'error',error:'missing-build'}); }
    const allowedHosts=new Set<string>();
    let cookieName='';
    const server = createServer(async (request,response) => {
      response.setHeader('X-Content-Type-Options','nosniff');
      response.setHeader('Cache-Control','no-store');
      response.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' ${scriptHashes.join(' ')}; style-src 'self'; img-src 'self' data:; connect-src ${this.bridge ? "'self'" : "'none'"}; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`);
      if(!allowedHosts.has(request.headers.host ?? '')){response.writeHead(421);response.end();return;}
      const origin=`http://${request.headers.host}`;
      const sameOrigin=(!request.headers.origin || request.headers.origin===origin) && (!request.headers['sec-fetch-site'] || request.headers['sec-fetch-site']==='same-origin' || request.headers['sec-fetch-site']==='none');
      const apiPath=request.url?.split('?')[0] ?? '';
      if (this.bridge && apiPath.startsWith('/api/')) {
        const json=(code: number,value: unknown) => {response.writeHead(code,{'Content-Type':'application/json'});response.end(JSON.stringify(value));};
        const matches=(value: string)=>Buffer.byteLength(value)===Buffer.byteLength(this.token) && timingSafeEqual(Buffer.from(value),Buffer.from(this.token));
        const bearer=request.headers.authorization?.startsWith('Bearer ')?request.headers.authorization.slice(7):'';
        const cookies=(request.headers.cookie??'').split(';').map(value=>value.trim());
        const cookie=cookies.find(value=>value.startsWith(`${cookieName}=`))?.slice(cookieName.length+1)??'';
        const bearerValid=matches(bearer);
        if (!bearerValid && !matches(cookie)) {json(401,{error:'unauthorized'});return;}
        // Old WebKit may omit Origin on same-origin XHR. A custom header still
        // prevents cross-site forms; foreign XHR preflights receive no CORS grant.
        if (!sameOrigin || (!bearerValid && request.method==='POST' && request.headers.origin!==origin && request.headers['x-cue-remote']!=='1')) {json(403,{error:'origin'});return;}
        if (apiPath==='/api/state' && request.method==='GET') {json(200,this.bridge.getState());return;}
        if (request.method!=='POST') {json(405,{error:'method'});return;}
        if (request.headers['content-type']!=='application/json') {json(415,{error:'content-type'});return;}
        let body='';try{for await(const chunk of request){body+=chunk.toString();if(Buffer.byteLength(body)>4096){json(413,{error:'size'});return;}}}catch{if(!response.destroyed)json(400,{error:'aborted'});return;}
        let data: Record<string,unknown>;try {data=JSON.parse(body);if(!data || typeof data!=='object')throw new Error();}catch{json(400,{error:'json'});return;}
        if(apiPath==='/api/commands'){json(200,await this.bridge.execute(data as unknown as Command));return;}
        if(apiPath==='/api/target' && typeof data.dataPool==='string' && typeof data.number==='string' && Number.isInteger(data.expectedRevision)){json(200,await this.bridge.selectTarget(data.dataPool,data.number,data.expectedRevision as number));return;}
        if(apiPath==='/api/sequence' && typeof data.number==='string' && Number.isInteger(data.expectedRevision)){json(200,await this.bridge.selectSequenceNumber(data.number,data.expectedRevision as number));return;}
        if(apiPath==='/api/lock' && typeof data.locked==='boolean'){this.bridge.setLocked(data.locked);json(200,this.bridge.getState());return;}
        if(apiPath==='/api/resync'){json(200,this.bridge.resync());return;}
        json(400,{error:'invalid-action'});return;
      }
      if (request.method !== 'GET'  && request.method !== 'HEAD') {
        response.writeHead(405,{'Allow':'GET, HEAD'}); response.end(); return;
      }
      // Strict allowlist: desktop files, traversal and arbitrary repo files are never served.
      const path = request.url?.split('?')[0] ?? '';
      if (path !== '/' && path !== '/index.html' && !/^\/assets\/[a-zA-Z0-9_-]+\.(js|css|svg|png|ico)$/.test(path)) {
        response.writeHead(404); response.end(); return;
      }
      const file = path === '/' ? 'index.html' : path.slice(1);
      try {
        const data = await readFile(join(this.root,file));
        const extension = file.slice(file.lastIndexOf('.'));
        // Navigating to IP:port establishes the browser session without a secret URL.
        // LAN access is explicitly granted in the native UI; the API still checks session and origin.
        if(this.bridge && file==='index.html' && request.method==='GET' && sameOrigin && (!request.headers['sec-fetch-dest'] || request.headers['sec-fetch-dest']==='document'))response.setHeader('Set-Cookie',`${cookieName}=${this.token}; HttpOnly; SameSite=Strict; Path=/`);
        response.writeHead(200,{'Content-Type':mime[extension] ?? 'application/octet-stream','Content-Length':data.length});
        response.end(request.method === 'HEAD' ? undefined : data);
      } catch { response.writeHead(404); response.end(); }
    });
    this.server = server;
    try {
      await new Promise<void>((resolve,reject) => {
        server.once('error',reject);
        server.listen(config.port,config.allowLan?'0.0.0.0':'127.0.0.1',() => {
          server.removeListener('error',reject); resolve();
        });
      });
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('No TCP address');
      const port = address.port;
      cookieName=`cue-remote-${port}`;
      const urls = [`http://127.0.0.1:${port}`];
      if (config.allowLan) {
        for (const addresses of Object.values(networkInterfaces())) {
          for (const address of addresses ?? []) {
            if (address.family === 'IPv4' && !address.internal) urls.push(`http://${address.address}:${port}`);
          }
        }
      }
      for(const url of urls)allowedHosts.add(new URL(url).host);
      allowedHosts.add(`localhost:${port}`);
      return this.update({phase:'running',port,urls,...(this.bridge?{accessUrls:[...urls]}:{})});
    } catch (error) {
      this.server = null;
      return this.update({phase:'error',port:null,urls:[],error:(error as NodeJS.ErrnoException).code === 'EADDRINUSE'?'port-in-use':'start-failed'});
    }
  }
  async stop(): Promise<ServerStatus> {
    if (this.status.phase === 'starting' || this.status.phase === 'stopping') return this.getStatus();
    const server = this.server;this.bridge?.setLocked(true);
    if (!server) return this.update({phase:'stopped',port:null,urls:[],accessUrls:[],error:null});
    this.update({phase:'stopping'});
    await new Promise<void>(resolve => {
      server.close(() => resolve()); server.closeAllConnections();
    });
    this.server = null;
    return this.update({phase:'stopped',port:null,urls:[],accessUrls:[],error:null});
  }
}
