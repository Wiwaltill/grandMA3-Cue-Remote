export interface SequenceRef { id: string; dataPool: string; number: string; name: string }
export interface Cue { id: string; number: string; name: string; fade?: number; delay?: number }
export type ConnectionState = 'DEMO' | 'CONNECTING' | 'ONLINE' | 'STALE' | 'OFFLINE';
export interface PlaybackSnapshot {
  sequence: SequenceRef; cues: readonly Cue[]; currentCueId: string | null;
  nextCueId: string | null; playbackState: 'running' | 'off';
  connectionState: ConnectionState; revision: number; timestamp: number; locked: boolean;
}
export interface Command { requestId: string; sequenceRef: SequenceRef; action: 'goPlus' | 'goMinus'; expectedRevision: number }
export type CommandResult = { accepted: true } | { accepted: false; reason: 'duplicate' | 'locked' | 'unavailable' | 'revision' | 'sequence' | 'boundary' | 'busy' | 'invalid' };
// A future transport must publish confirmed snapshots; sending a command is not confirmation.
export interface PlaybackTransport {
  getSnapshot(): PlaybackSnapshot;
  subscribe(listener: () => void): () => void;
  execute(command: Command): CommandResult;
  setLocked(locked: boolean): void;
}
