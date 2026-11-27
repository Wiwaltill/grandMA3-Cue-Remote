import type { LiveState, OscConfig } from '../../../packages/shared/live.js';
export interface ServerConfig { port: number; allowLan: boolean }
export interface ServerStatus {
  phase: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  port: number | null;
  allowLan: boolean;
  urls: string[];
  liveUrls?: string[];
  error: 'port-in-use' | 'invalid-config' | 'missing-build' | 'start-failed' | null;
}
export interface DesktopApi {
  getStatus(): Promise<ServerStatus>;
  start(config: ServerConfig): Promise<ServerStatus>;
  stop(): Promise<ServerStatus>;
  openDemo(): Promise<void>;
  openLive(): Promise<void>;
  getLive(): Promise<LiveState>;
  getAddresses(): Promise<string[]>;
  connectOsc(config: OscConfig): Promise<LiveState>;
  disconnectOsc(): Promise<LiveState>;
  onStatus(listener: (status: ServerStatus) => void): () => void;
}
