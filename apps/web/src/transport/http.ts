import type { Command, CommandResult, PlaybackSnapshot, PlaybackTransport } from '../../../../packages/shared/playback.ts';
import type { LiveState } from '../../../../packages/shared/live.ts';
export class HttpTransport implements PlaybackTransport {
  private state: PlaybackSnapshot={sequence:{id:'unconfigured',dataPool:'1',number:'1',name:'—'},cues:[],currentCueId:null,nextCueId:null,connectionState:'OFFLINE',playbackState:'off',revision:0,timestamp:0,locked:true};
  private listeners=new Set<()=>void>();
  private timer: ReturnType<typeof setInterval> | null=null;
  private polling=false;
  private token: string;
  private lastReceived=0;
  constructor(token: string) {this.token=token;}
  getSnapshot=()=>this.state;
  private publish(state: PlaybackSnapshot){this.state=state;this.listeners.forEach(fn=>fn());}
  private async request(path: string,body?: unknown) {
    const response=await fetch(path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${this.token}`,...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(2500),cache:'no-store'});
    if(!response.ok)throw new Error('Request rejected');return response.json();
  }
  private offline=()=>this.publish({...this.state,connectionState:'OFFLINE',locked:true});
  private refresh=async()=>{
    if(this.polling){if(Date.now()-this.lastReceived>3000)this.offline();return;}
    this.polling=true;
    try{const live: LiveState=await this.request('/api/state');this.lastReceived=Date.now();this.publish({...live.snapshot,commandState:live.commandState});}
    catch{this.offline();}finally{this.polling=false;}
  };
  subscribe=(listener:()=>void)=>{
    this.listeners.add(listener);if(!this.timer){void this.refresh();this.timer=setInterval(()=>void this.refresh(),250);}
    return()=>{this.listeners.delete(listener);if(!this.listeners.size && this.timer){clearInterval(this.timer);this.timer=null;}};
  };
  execute=async(command: Command): Promise<CommandResult>=>{
    if(Date.now()-this.lastReceived>3000){this.offline();return {accepted:false,reason:'unavailable'};}
    this.publish({...this.state,commandState:'pending'});
    try{const result: CommandResult=await this.request('/api/commands',command);await this.refresh();return result;}
    catch{this.offline();return {accepted:false,reason:'unavailable'};}
  };
  setLocked=async(locked: boolean)=>{try{await this.request('/api/lock',{locked});await this.refresh();}catch{this.offline();}};
  selectSequenceNumber=async(number: string,expectedRevision: number): Promise<CommandResult>=>{try{const result=await this.request('/api/sequence',{number,expectedRevision});await this.refresh();return result;}catch{this.offline();return {accepted:false,reason:'unavailable'};}};
  resync=async()=>{try{await this.request('/api/resync',{});await this.refresh();}catch{this.offline();}};
}
