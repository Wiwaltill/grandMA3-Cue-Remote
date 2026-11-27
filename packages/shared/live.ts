import type { PlaybackSnapshot } from './playback.js';
export interface OscConfig { host: string; port: number; prefix: string; replyHost: string; dataPool: string; sequenceNumber: string; feedbackPort?: number; feedbackPrefix?: string }
export interface LiveState { snapshot: PlaybackSnapshot; commandState: 'idle' | 'pending' | 'unknown'; error: 'timeout' | 'invalid-config' | 'invalid-snapshot' | 'send-failed' | null; version: string | null }
