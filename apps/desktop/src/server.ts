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
// This serves only the built demo. It implements no playback or administration HTTP API.
export class DemoServer {
  private server: Server | null = null;
  private status: ServerStatus = {phase:'stopped',port:null,allowLan:false,urls:[],error:null};
  constructor(privateRoot: string, onChange: (status: ServerStatus) => void = () => {}) {
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
    this.update({phase:'starting',port:null,allowLan:config.allowLan,urls:[],error:null});
    try { await stat(join(this.root,'index.html')); }
    catch { return this.update({phase:'error',error:'missing-build'}); }
    const server = createServer(async (request,response) => {
      response.setHeader('X-Content-Type-Options','nosniff');
      response.setHeader('Cache-Control','no-store');
      response.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
      if (request.method !== 'GET' && request.method !== 'HEAD') {
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
      const urls = [`http://127.0.0.1:${port}`];
      if (config.allowLan) {
        for (const addresses of Object.values(networkInterfaces())) {
          for (const address of addresses ?? []) {
            if (address.family === 'IPv4' && !address.internal) urls.push(`http://${address.address}:${port}`);
          }
        }
      }
      return this.update({phase:'running',port,urls});
    } catch (error) {
      this.server = null;
      return this.update({phase:'error',port:null,urls:[],error:(error as NodeJS.ErrnoException).code === 'EADDRINUSE'?'port-in-use':'start-failed'});
    }
  }
  async stop(): Promise<ServerStatus> {
    if (this.status.phase === 'starting' || this.status.phase === 'stopping') return this.getStatus();
    const server = this.server;
    if (!server) return this.update({phase:'stopped',port:null,urls:[],error:null});
    this.update({phase:'stopping'});
    await new Promise<void>(resolve => {
      server.close(() => resolve()); server.closeAllConnections();
    });
    this.server = null;
    return this.update({phase:'stopped',port:null,urls:[],error:null});
  }
}
