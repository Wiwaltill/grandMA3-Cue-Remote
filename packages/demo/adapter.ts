import type { Command, CommandResult, Cue, PlaybackSnapshot, PlaybackTransport } from '../shared/playback.ts';
export const demoCues: readonly Cue[] = [
  {id:'house',number:'01',name:'Einlass',fade:3},
  {id:'welcome',number:'02',name:'Begrüßung',fade:2},
  {id:'intro',number:'03',name:'Intro',fade:0.5},
  {id:'opening',number:'04',name:'Song 01 – Opening',fade:2},
  {id:'ballad',number:'05',name:'Song 02 – Ballade',fade:4},
  {id:'solo',number:'05.1',name:'Ballade – Solo',fade:1.5},
  {id:'upbeat',number:'06',name:'Song 03 – Upbeat',fade:0.5},
  {id:'talk',number:'07',name:'Moderation',fade:2},
  {id:'finale',number:'08',name:'Finale',fade:3},
  {id:'applause',number:'09',name:'Applaus',fade:4},
];
interface DemoOptions { loop?: boolean; now?: () => number; initialSnapshot?: PlaybackSnapshot }
export class DemoAdapter implements PlaybackTransport {
  private listeners = new Set<() => void>();
  private requests = new Set<string>();
  private lastCommand = -Infinity;
  private snapshot: PlaybackSnapshot;
  private options: DemoOptions;
  constructor(options: DemoOptions = {}) {
    this.options = options;
    this.snapshot = this.options.initialSnapshot ?? this.initial(0);
  }
  private now = () => (this.options.now ?? Date.now)();
  private initial(revision: number): PlaybackSnapshot {
    return {sequence:{id:'demo-concert',dataPool:'demo',number:'1',name:'Konzert · Abendshow'},cues:demoCues,currentCueId:'opening',nextCueId:'ballad',playbackState:'running',connectionState:'DEMO',revision,timestamp:this.now(),locked:false};
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(update: Partial<PlaybackSnapshot>) {
    this.snapshot = {...this.snapshot,...update,revision:this.snapshot.revision+1,timestamp:this.now()};
    this.listeners.forEach(listener => listener());
  }
  setLocked = (locked: boolean) => this.publish({locked});
  reset = () => {
    const locked = this.snapshot.locked;
    this.snapshot = {...this.initial(this.snapshot.revision+1),locked};
    this.requests.clear(); this.lastCommand = -Infinity;
    this.listeners.forEach(listener => listener());
  };
  execute = (command: Command): CommandResult => {
    const s = this.snapshot;
    const reject = (reason: Exclude<CommandResult,{accepted:true}>['reason']): CommandResult => ({accepted:false,reason});
    if (!command.requestId || !['goPlus','goMinus'].includes(command.action)) return reject('invalid');
    if (this.requests.has(command.requestId)) return reject('duplicate');
    if (s.locked) return reject('locked');
    if (s.connectionState !== 'DEMO') return reject('unavailable');
    if (command.sequenceRef.id !== s.sequence.id || command.sequenceRef.dataPool !== s.sequence.dataPool || command.sequenceRef.number !== s.sequence.number) return reject('sequence');
    if (command.expectedRevision !== s.revision) return reject('revision');
    if (this.now()-this.lastCommand < 450) return reject('busy');
    const index = s.cues.findIndex(c => c.id === s.currentCueId);
    const target = command.action === 'goPlus' ? s.nextCueId : (s.cues[index-1]?.id ?? null);
    if (!target) return reject('boundary');
    const nextIndex = s.cues.findIndex(c => c.id === target)+1;
    this.requests.add(command.requestId);
    // Bound memory; expectedRevision still rejects old requests after eviction.
    if (this.requests.size > 256) this.requests.delete(this.requests.values().next().value!);
    this.lastCommand = this.now();
    this.publish({currentCueId:target,nextCueId:s.cues[nextIndex]?.id ?? (this.options.loop ? s.cues[0].id : null),playbackState:'running'});
    return {accepted:true};
  };
}
