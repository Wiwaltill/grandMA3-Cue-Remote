import type { FadePreview } from './fade.js';
export interface SequenceRef { id: string; dataPool: string; number: string; name: string }
export interface Cue { id: string; number: string; name: string; fade?: number; delay?: number; individualFade?: number; individualDelay?: number; duration?: number; trigger?: 'Go' | 'Follow' | 'Time' | 'Sound' | 'BPM' | 'Unknown'; triggerTime?: number }
export type ConnectionState = 'CONNECTING' | 'ONLINE' | 'STALE' | 'OFFLINE';
export interface PlaybackSnapshot {
  sequence: SequenceRef; cues: readonly Cue[]; currentCueId: string | null;
  nextCueId: string | null; playbackState: 'running' | 'off';
  connectionState: ConnectionState; revision: number; timestamp: number; locked: boolean;
  fadePreview?: FadePreview;
  commandState?: 'idle' | 'pending' | 'unknown';
}
export interface Command { requestId: string; sequenceRef: SequenceRef; action: 'goPlus' | 'goMinus'; expectedRevision: number }
export type CommandResult = { accepted: true } | { accepted: false; reason: 'duplicate' | 'locked' | 'unavailable' | 'revision' | 'sequence' | 'boundary' | 'busy' | 'invalid' };
// A future transport must publish confirmed snapshots; sending a command is not confirmation.
export interface PlaybackTransport {
  getSnapshot(): PlaybackSnapshot;
  subscribe(listener: () => void): () => void;
  execute(command: Command): CommandResult | Promise<CommandResult>;
  setLocked(locked: boolean): void | Promise<void>;
  selectTarget(dataPool: string, number: string, expectedRevision: number): CommandResult | Promise<CommandResult>;
  selectSequenceNumber(number: string, expectedRevision: number): CommandResult | Promise<CommandResult>;
}
