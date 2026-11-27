import dgram, { type Socket } from 'node:dgram';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import type { Command, CommandResult, Cue, PlaybackSnapshot } from '../../../packages/shared/playback.js';
import type { LiveState, OscConfig } from '../../../packages/shared/live.js';
import { parseSequenceNumber } from '../../../packages/shared/sequence.ts';
import { encodeOscCommand, isOscConfig, playbackCommand, snapshotQuery } from './osc.ts';
export function localAddresses(): string[] {
  return [...new Set(['127.0.0.1',...Object.values(networkInterfaces()).flatMap(entries=>(entries??[]).filter(a=>a.family==='IPv4').map(a=>a.address))])];
}
function emptySnapshot(revision=0): PlaybackSnapshot {
  return {sequence:{id:'unconfigured',dataPool:'1',number:'1',name:'—'},cues:[],currentCueId:null,nextCueId:null,nextCueKnown:false,playbackState:'off',connectionState:'OFFLINE',revision,timestamp:0,locked:true,commandState:'idle'};
}
export function parseFeedback(value: unknown,config: OscConfig): {cues: Cue[];name: string;current: string | null;next: string | null;running: boolean;version: string} | null {
  if (!value || typeof value!=='object') return null;
  const raw=value as Record<string,unknown>;
  if (raw.error || raw.dataPool!==config.dataPool || raw.number!==config.sequenceNumber || raw.version!=='2.5.1.1' || typeof raw.name!=='string' || raw.name.length>512 || typeof raw.running!=='boolean' || typeof raw.current!=='string' || typeof raw.loaded!=='string' || !Array.isArray(raw.cues) || raw.cues.length>500) return null;
  const cues: Cue[]=[];const numbers=new Set<string>();
  for (const item of raw.cues) {
    if (!item || typeof item!=='object' || typeof item.number!=='string' || !/^\d+(\.\d+)?$/.test(item.number) || item.number.length>32 || numbers.has(item.number) || typeof item.name!=='string' || item.name.length>512 || (item.fade!==undefined && (typeof item.fade!=='number' || !Number.isFinite(item.fade) || item.fade<0))) return null;
    numbers.add(item.number);cues.push({id:`${config.dataPool}/${config.sequenceNumber}/${item.number}`,number:item.number,name:item.name,...(item.fade===undefined?{}:{fade:item.fade})});
  }
  const currentNumber=raw.current.trim(),loadedNumber=raw.loaded.trim();
  const current=raw.running?cues.find(c=>c.number===currentNumber)?.id ?? null:null;
  if (raw.running && !current) return null;
  const next=cues.find(c=>c.number===loadedNumber)?.id ?? null;
  return {cues,name:raw.name,current,next,running:raw.running,version:raw.version};
}
export class OscBridge {
  private socket: Socket | null=null;
  private config: OscConfig | null=null;
  private state: LiveState={snapshot:emptySnapshot(),commandState:'idle',error:null,version:null};
  private timer: ReturnType<typeof setInterval> | null=null;
  private nonce: string | null=null;
  private queriedAt=0;
  private receivedAt=0;
  private pendingAt=0;
  private beforeCommand='';
  private requests=new Set<string>();
  private listeners=new Set<()=>void>();
  constructor(privateOptions: {now?:()=>number;pollMs?:number;timeoutMs?:number}={}) {this.options=privateOptions;}
  private options: {now?:()=>number;pollMs?:number;timeoutMs?:number};
  private now=()=> (this.options.now??Date.now)();
  getState=(): LiveState=>structuredClone(this.state);
  getConfig=()=>this.config?{...this.config}:null;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  private publish(update: Partial<PlaybackSnapshot>,error=this.state.error) {
    const previous=this.state.snapshot;
    const next={...previous,...update,commandState:this.state.commandState};
    const semantic=(s: PlaybackSnapshot)=>JSON.stringify({...s,timestamp:0,revision:0});
    next.revision=previous.revision+(semantic(previous)===semantic(next)?0:1);
    this.state={...this.state,error,snapshot:next};
    this.listeners.forEach(fn=>fn());
  }
  async connect(config: unknown): Promise<LiveState> {
    if (!isOscConfig(config) || !localAddresses().includes(config.replyHost)) {this.publish({locked:true},'invalid-config');return this.getState();}
    this.disconnect();this.config={...config};this.state.commandState='idle';
    this.publish({...emptySnapshot(),revision:this.state.snapshot.revision,sequence:{id:`${config.dataPool}/${config.sequenceNumber}`,dataPool:config.dataPool,number:config.sequenceNumber,name:'—'},connectionState:'CONNECTING'},null);
    const socket=dgram.createSocket('udp4');this.socket=socket;
    socket.on('message',(message,info)=>{
      if (this.socket!==socket || info.address!==this.config?.host || message.length>60000) return;
      let raw: Record<string,unknown>;try {raw=JSON.parse(message.toString());} catch {return;}
      if (!raw || raw.nonce!==this.nonce || this.now()-this.queriedAt>this.timeout()) return;
      this.nonce=null;
      const parsed=parseFeedback(raw,this.config!);
      if (!parsed) {this.publish({connectionState:'STALE',locked:true},'invalid-snapshot');return;}
      this.receivedAt=this.now();this.state.version=parsed.version;
      const fingerprint=JSON.stringify([parsed.current,parsed.running]);
      if (this.state.commandState==='pending' && fingerprint!==this.beforeCommand) this.state.commandState='idle';
      const unknown=this.state.commandState==='unknown';
      this.publish({cues:parsed.cues,sequence:{...this.state.snapshot.sequence,name:parsed.name},currentCueId:parsed.current,nextCueId:parsed.next,nextCueKnown:parsed.next!==null,playbackState:parsed.running?'running':'off',timestamp:this.receivedAt,connectionState:unknown?'STALE':'ONLINE',...(unknown?{locked:true}:{})},unknown?'timeout':null);
    });
    socket.on('error',()=>{if(this.socket===socket) this.publish({connectionState:'OFFLINE',locked:true},'send-failed');});
    try {await new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.bind(0,'0.0.0.0',()=>{socket.removeListener('error',reject);resolve();});});}
    catch {this.disconnect();this.publish({},'send-failed');return this.getState();}
    if (this.socket!==socket) return this.getState();
    this.query();
    this.timer=setInterval(()=>this.tick(),this.options.pollMs??1000);
    return this.getState();
  }
  private timeout=()=>this.options.timeoutMs??3000;
  private tick() {
    if (this.state.commandState==='pending' && this.now()-this.pendingAt>this.timeout()) {this.state.commandState='unknown';this.publish({connectionState:'STALE',locked:true},'timeout');}
    if (this.now()-(this.receivedAt || this.queriedAt)>this.timeout() && this.state.snapshot.connectionState!=='OFFLINE') this.publish({connectionState:'STALE',locked:true},'timeout');
    if (!this.nonce || this.now()-this.queriedAt>this.timeout()) this.query();
  }
  private query() {
    const socket=this.socket,config=this.config;
    if (!socket || !config) return;
    const address=socket.address();if(typeof address==='string') return;
    this.nonce=randomBytes(16).toString('hex');this.queriedAt=this.now();
    socket.send(encodeOscCommand(config.prefix,snapshotQuery(config,address.port,this.nonce)),config.port,config.host,error=>{if(error && this.socket===socket)this.publish({connectionState:'OFFLINE',locked:true},'send-failed');});
  }
  resync=(): LiveState=>{if(this.socket){this.state.commandState='idle';this.receivedAt=0;this.publish({connectionState:'CONNECTING',locked:true},null);this.query();}return this.getState();};
  disconnect=(): LiveState=>{
    if(this.timer)clearInterval(this.timer);this.timer=null;
    const socket=this.socket;this.socket=null;try{socket?.close();}catch{/* already closed */}
    this.config=null;this.nonce=null;this.receivedAt=0;this.state.commandState='idle';
    this.publish({connectionState:'OFFLINE',locked:true},null);return this.getState();
  };
  setLocked=(locked: boolean)=>{if(locked || (this.state.snapshot.connectionState==='ONLINE' && this.state.commandState==='idle' && this.now()-this.receivedAt<=this.timeout()))this.publish({locked});};
  selectSequenceNumber=async(number: string,expectedRevision: number): Promise<CommandResult>=>{
    if(parseSequenceNumber(number)!==number)return {accepted:false,reason:'invalid'};
    if(!this.config || this.state.snapshot.connectionState!=='ONLINE')return {accepted:false,reason:'unavailable'};
    if(this.state.snapshot.locked)return {accepted:false,reason:'locked'};
    if(expectedRevision!==this.state.snapshot.revision)return {accepted:false,reason:'revision'};
    if(this.state.commandState!=='idle')return {accepted:false,reason:'busy'};
    await this.connect({...this.config,sequenceNumber:number});return {accepted:true};
  };
  execute=async(command: Command): Promise<CommandResult>=>{
    const s=this.state.snapshot;
    if (!command || typeof command.requestId!=='string' || !/^[a-zA-Z0-9-]{1,80}$/.test(command.requestId) || !['goPlus','goMinus'].includes(command.action))return {accepted:false,reason:'invalid'};
    if(this.requests.has(command.requestId))return {accepted:false,reason:'duplicate'};
    if(!this.socket || !this.config || s.connectionState!=='ONLINE' || this.now()-this.receivedAt>this.timeout())return {accepted:false,reason:'unavailable'};
    if(s.locked)return {accepted:false,reason:'locked'};
    if(command.sequenceRef?.id!==s.sequence.id || command.sequenceRef?.dataPool!==s.sequence.dataPool || command.sequenceRef?.number!==s.sequence.number)return {accepted:false,reason:'sequence'};
    if(command.expectedRevision!==s.revision)return {accepted:false,reason:'revision'};
    if(this.state.commandState!=='idle')return {accepted:false,reason:'busy'};
    this.requests.add(command.requestId);if(this.requests.size>512)this.requests.delete(this.requests.values().next().value!);
    this.beforeCommand=JSON.stringify([s.currentCueId,s.playbackState==='running']);this.pendingAt=this.now();this.state.commandState='pending';this.publish({});
    const socket=this.socket;
    const packet=encodeOscCommand(this.config.prefix,playbackCommand(this.config,command.action));
    await new Promise<void>(resolve=>socket.send(packet,this.config!.port,this.config!.host,error=>{if(error && this.socket===socket){this.state.commandState='unknown';this.publish({connectionState:'OFFLINE',locked:true},'send-failed');}resolve();}));
    // UDP send completion is deliberately NOT a playback acknowledgement.
    return {accepted:true};
  };
}
