import { test } from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import type { AddressInfo } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { OscBridge, parseFeedback } from '../apps/desktop/src/bridge.ts';
import { encodeOscCommand, isOscConfig, playbackCommand } from '../apps/desktop/src/osc.ts';
import type { OscConfig } from '../packages/shared/live.ts';
import type { Command } from '../packages/shared/playback.ts';
const config: OscConfig={host:'127.0.0.1',replyHost:'127.0.0.1',port:8000,prefix:'',dataPool:'1',sequenceNumber:'1'};
function decode(packet: Buffer) {
  let offset=0;const string=()=>{const end=packet.indexOf(0,offset);const text=packet.toString('utf8',offset,end);offset=Math.ceil((end+1)/4)*4;return text;};
  return {address:string(),types:string(),command:string()};
}
async function until(predicate:()=>boolean) {const start=Date.now();while(!predicate()){if(Date.now()-start>2500)throw new Error('Condition timed out');await delay(10);}}
const feedback=(number='1')=>({dataPool:'1',number,version:'2.5.1.1',name:'Test sequence',running:false,current:'',loaded:'',cues:[{number:'1',name:'Opening',fade:2,delay:0,duration:2},{number:'1.5',name:'Solo',trigger:'Follow',triggerTime:2,fade:1,delay:0,duration:1},{number:'2',name:'Finale'}]});
async function setup(options: {now?:()=>number;timeoutMs?:number}={}) {
  const socket=dgram.createSocket('udp4');await new Promise<void>(r=>socket.bind(0,'127.0.0.1',r));
  const address=socket.address();assert.notEqual(typeof address,'string');
  const counters={go:0,query:0};const control={reply:true,advance:true,spoof:false,timing:'normal'};let current='',running=false;
  socket.on('message',packet=>{
    const {command}=decode(packet);
    if(command.startsWith('Lua ')) {
      counters.query++;
      if(!control.reply)return;
      const port=Number(command.match(/j\.encode\(t\),'127\.0\.0\.1',(\d+)/)?.[1]);
      const nonce=command.match(/nonce='([a-f0-9]{32})'/)?.[1];
      const number=command.match(/number='(\d+)'/)?.[1] ?? '1';
      if(port && nonce)socket.send(JSON.stringify({...feedback(number),cues:feedback(number).cues.map(c=>c.number==='1.5' && control.timing!=='normal'?{...c,fade:0,delay:0,individualFade:3,individualDelay:30,...(control.timing==='complex'?{duration:33}:{duration:undefined})}:c),dataPool:command.match(/dataPool='(\d+)'/)?.[1] ?? '1',current,running,nonce:control.spoof?'0'.repeat(32):nonce}),port,'127.0.0.1');
    } else {
      counters.go++;if(control.advance){running=true;current='1.5';}
    }
  });
  const bridge=new OscBridge({pollMs:30,timeoutMs:300,...options});
  const target={...config,port:(address as AddressInfo).port};
  try{await bridge.connect(target);await until(()=>bridge.getState().snapshot.connectionState==='ONLINE');}
  catch(error){bridge.disconnect();socket.close();throw error;}
  const command=(id='test-1'): Command=>{const s=bridge.getState().snapshot;return {requestId:id,sequenceRef:s.sequence,action:'goPlus',expectedRevision:s.revision};};
  return {bridge,target,counters,control,command,setPlayback:(number: string | null)=>{current=number??'';running=number!==null;},cleanup:()=>{bridge.disconnect();socket.close();}};
}
test('OSC string command encoding uses address, string type, UTF-8 and four-byte padding',()=>{
  const packet=encodeOscCommand('gma3','Go+ DataPool 2 Sequence 42');
  assert.deepEqual(decode(packet),{address:'/gma3/cmd',types:',s',command:'Go+ DataPool 2 Sequence 42'});
  assert.equal(packet.length%4,0);assert.equal(decode(encodeOscCommand('','Ä')).command,'Ä');
  assert.equal(playbackCommand({...config,dataPool:'2',sequenceNumber:'42'},'goMinus'),'Go- DataPool 2 Sequence 42');
});
test('OSC configuration rejects injection, multicast, invalid ports and noncanonical targets',()=>{
  assert.equal(isOscConfig(config),true);
  for(const value of [null,{...config,sequenceNumber:'1; Off Sequence Thru'},{...config,sequenceNumber:'0'},{...config,prefix:'foo/cmd'},{...config,host:'224.0.0.1'},{...config,port:1.5},{...config,port:65536},{...config,dataPool:'01'}])assert.equal(isOscConfig(value),false);
});
test('real UDP round trip publishes authoritative cues, Off and the next list entry; no automatic GO',async()=>{
  const f=await setup();try {
    const s=f.bridge.getState().snapshot;assert.equal(s.locked,true);assert.equal(s.playbackState,'off');assert.equal(s.nextCueId,'1/1/1');assert.equal(s.cues[1].number,'1.5');assert.equal(f.counters.go,0);
    await until(()=>f.counters.query>=3);assert.equal(f.bridge.getState().snapshot.revision,s.revision,'unchanged heartbeat must not invalidate command revision');
    assert.deepEqual(await f.bridge.execute(f.command()),{accepted:false,reason:'locked'});
    f.bridge.setLocked(false);const first=f.command();const competing=f.command('test-2');
    assert.deepEqual(await f.bridge.execute(first),{accepted:true});
    assert.equal(f.bridge.getState().snapshot.currentCueId,null,'no optimistic playback');
    assert.deepEqual(await f.bridge.execute(first),{accepted:false,reason:'duplicate'});
    assert.equal((await f.bridge.execute(competing)).accepted,false);
    await until(()=>f.bridge.getState().commandState==='idle');
    assert.equal(f.bridge.getState().snapshot.currentCueId,'1/1/1.5');assert.equal(f.counters.go,1);
  }finally{f.cleanup();}
});
test('unknown command result locks controls without retry until explicit full resync',async()=>{
  const f=await setup();try {
    f.control.advance=false;f.bridge.setLocked(false);await f.bridge.execute(f.command());
    await until(()=>f.bridge.getState().commandState==='unknown');
    assert.equal(f.bridge.getState().snapshot.locked,true);assert.equal(f.bridge.getState().snapshot.connectionState,'STALE');
    await delay(80);assert.equal(f.counters.go,1);assert.equal(f.bridge.getState().commandState,'unknown');
    f.bridge.resync();await until(()=>f.bridge.getState().snapshot.connectionState==='ONLINE');
    assert.equal(f.bridge.getState().snapshot.locked,true);assert.equal(f.bridge.getState().commandState,'idle');assert.equal(f.counters.go,1);
  }finally{f.cleanup();}
});
test('loss of feedback and forged nonce fail closed; recovered state requires unlock',async()=>{
  const f=await setup();try {
    f.bridge.setLocked(false);f.control.spoof=true;
    await until(()=>f.bridge.getState().snapshot.connectionState==='STALE');
    assert.equal(f.bridge.getState().snapshot.locked,true);assert.equal((await f.bridge.execute(f.command())).accepted,false);
    f.control.spoof=false;await until(()=>f.bridge.getState().snapshot.connectionState==='ONLINE');
    assert.equal(f.bridge.getState().snapshot.locked,true);assert.equal(f.counters.go,0);
  }finally{f.cleanup();}
});
test('sequence selection resynchronizes without GO and old target/revision are rejected',async()=>{
  const f=await setup();try {
    f.bridge.setLocked(false);const old=f.command();
    assert.deepEqual(await f.bridge.execute({...old,sequenceRef:{...old.sequenceRef,number:'9'}}),{accepted:false,reason:'sequence'});
    assert.deepEqual(await f.bridge.selectSequenceNumber('2',old.expectedRevision),{accepted:true});
    await until(()=>f.bridge.getState().snapshot.connectionState==='ONLINE');
    assert.equal(f.bridge.getState().snapshot.sequence.number,'2');assert.equal(f.bridge.getState().snapshot.locked,false);assert.equal(f.counters.go,0);
    f.bridge.setLocked(false);assert.deepEqual(await f.bridge.execute(old),{accepted:false,reason:'sequence'});
  }finally{f.cleanup();}
});
test('feedback validates target, version, cue IDs, decimals and running state',()=>{
  assert.ok(parseFeedback(feedback(),config));
  for(const raw of [{...feedback(),number:'2'},{...feedback(),version:'2.4'},{...feedback(),running:true,current:'99'},{...feedback(),cues:[{number:'1',name:'A',fade:-1}]},{...feedback(),cues:[{number:'1',name:'A'},{number:'1',name:'B'}]}])assert.equal(parseFeedback(raw,config),null);
  const result=parseFeedback({...feedback(),running:true,current:'1.5',loaded:'2'},config);
  assert.equal(result?.current,'1/1/1.5');assert.equal(result?.next,'1/1/2');
});

test('Next follows list order through Off, decimal cues and list end, ignoring loaded destinations',()=>{
  const base=feedback();
  assert.equal(parseFeedback({...base,current:'2',loaded:'2'},config)?.next,'1/1/1');
  assert.equal(parseFeedback({...base,running:true,current:'1',loaded:'2'},config)?.next,'1/1/1.5');
  assert.equal(parseFeedback({...base,running:true,current:'1.5',loaded:'1'},config)?.next,'1/1/2');
  assert.equal(parseFeedback({...base,running:true,current:'2',loaded:'1'},config)?.next,null);
  assert.equal(parseFeedback({...base,cues:[]},config)?.next,null);
});

test('target selection preserves manual lock and validates both target numbers',async()=>{
  const f=await setup();try{
    const revision=f.bridge.getState().snapshot.revision;
    assert.deepEqual(await f.bridge.selectTarget('0','2',revision),{accepted:false,reason:'invalid'});
    assert.deepEqual(await f.bridge.selectTarget('2; Off','2',revision),{accepted:false,reason:'invalid'});
    assert.deepEqual(await f.bridge.selectTarget('2','2',revision-1),{accepted:false,reason:'revision'});
    assert.deepEqual(await f.bridge.selectTarget('2','3',revision),{accepted:true});
    assert.equal(f.bridge.getState().snapshot.connectionState,'CONNECTING');
    assert.equal(f.bridge.getState().snapshot.locked,true);
    await until(()=>f.bridge.getState().snapshot.connectionState==='ONLINE');
    assert.equal(f.bridge.getState().snapshot.sequence.dataPool,'2');
    assert.equal(f.bridge.getState().snapshot.sequence.number,'3');
    assert.equal(f.bridge.getState().snapshot.locked,true);
    assert.equal(f.counters.go,0);
  }finally{f.cleanup();}
});
test('failed target synchronization or explicit lock cancels automatic unlock',async()=>{
  const f=await setup();try{
    f.bridge.setLocked(false);f.control.reply=false;
    await f.bridge.selectTarget('2','4',f.bridge.getState().snapshot.revision);
    assert.equal((await f.bridge.execute(f.command())).accepted,false);
    await until(()=>f.bridge.getState().snapshot.connectionState==='STALE');
    f.control.reply=true;await until(()=>f.bridge.getState().snapshot.connectionState==='ONLINE');
    assert.equal(f.bridge.getState().snapshot.locked,true);
    f.bridge.setLocked(false);
    await f.bridge.selectTarget('1','2',f.bridge.getState().snapshot.revision);
    f.bridge.setLocked(true);
    await until(()=>f.bridge.getState().snapshot.connectionState==='ONLINE');
    assert.equal(f.bridge.getState().snapshot.locked,true);assert.equal(f.counters.go,0);
  }finally{f.cleanup();}
});

test('MA duration retains delay and cooked individual timing instead of using cue fade alone',()=>{
  const raw={...feedback(),running:true,current:'5',cues:[{number:'5',name:'Timing cue',fade:0,delay:0,individualFade:3,individualDelay:30,duration:33}]};
  const cue=parseFeedback(raw,config)?.cues[0];assert.equal(cue?.duration,33);assert.equal(cue?.fade,0);assert.equal(cue?.individualDelay,30);
  for(const key of ['delay','duration','individualFade','individualDelay'])for(const value of [-1,Infinity,'33'])assert.equal(parseFeedback({...raw,cues:[{...raw.cues[0],[key]:value}]},config),null);
});

test('transition preview and GO warning duration include MA individual delays; missing duration is not replaced by fade',async()=>{
  let now=10000;const f=await setup({now:()=>now,timeoutMs:60000});try{
    f.control.timing='complex';f.bridge.setLocked(false);await f.bridge.execute(f.command('complex-timing'));
    await until(()=>f.bridge.getState().commandState==='idle');
    assert.equal(f.bridge.getState().snapshot.fadePreview?.durationMs,33000);
    now+=32000;assert.equal(f.bridge.getState().snapshot.fadePreview?.elapsedMs,32000,'warning must still be active after the three-second individual fade');
    now+=1000;assert.equal(f.bridge.getState().snapshot.fadePreview?.elapsedMs,33000);
    f.bridge.resync();await until(()=>f.bridge.getState().snapshot.connectionState==='ONLINE');assert.equal(f.bridge.getState().snapshot.fadePreview,undefined);
  }finally{f.cleanup();}
  const g=await setup();try{
    g.control.timing='unknown';g.bridge.setLocked(false);await g.bridge.execute(g.command('unknown-duration'));
    await until(()=>g.bridge.getState().commandState==='idle');assert.equal(g.bridge.getState().snapshot.fadePreview,undefined);
  }finally{g.cleanup();}
});

test('Follow metadata and console-driven transitions update Current and Next without sending GO',async()=>{
  const f=await setup();try{
    let s=f.bridge.getState().snapshot;assert.equal(s.cues[1].trigger,'Follow');assert.equal(s.cues[1].triggerTime,2);
    f.setPlayback('1');await until(()=>f.bridge.getState().snapshot.currentCueId==='1/1/1');
    s=f.bridge.getState().snapshot;assert.equal(s.nextCueId,'1/1/1.5');
    await delay(90);assert.equal(f.bridge.getState().snapshot.currentCueId,'1/1/1');assert.equal(f.counters.go,0,'Follow metadata must never schedule a local GO');
    f.setPlayback('1.5');await until(()=>f.bridge.getState().snapshot.currentCueId==='1/1/1.5');
    s=f.bridge.getState().snapshot;assert.equal(s.nextCueId,'1/1/2');assert.equal(s.cues.find(c=>c.id===s.currentCueId)?.trigger,'Follow');
    f.setPlayback('2');await until(()=>f.bridge.getState().snapshot.currentCueId==='1/1/2');assert.equal(f.bridge.getState().snapshot.nextCueId,null);
    f.setPlayback(null);await until(()=>f.bridge.getState().snapshot.playbackState==='off');assert.equal(f.counters.go,0);
  }finally{f.cleanup();}
});
test('Follow times validate zero and reject malformed feedback; unknown triggers remain unknown',()=>{
  const raw={...feedback(),cues:[{number:'1',name:'Cue',trigger:'Follow',triggerTime:0}]};
  assert.equal(parseFeedback(raw,config)?.cues[0].triggerTime,0);
  for(const triggerTime of [-1,Infinity,'2'])assert.equal(parseFeedback({...raw,cues:[{...raw.cues[0],triggerTime}]},config),null);
  assert.equal(parseFeedback({...raw,cues:[{...raw.cues[0],trigger:'FutureMode'}]},config)?.cues[0].trigger,'Unknown');
});

test('removed Pause commands are rejected and never sent to MA',async()=>{
  const f=await setup();try{f.bridge.setLocked(false);assert.deepEqual(await f.bridge.execute({...f.command('removed-pause'),action:'pause'} as unknown as Command),{accepted:false,reason:'invalid'});assert.equal(f.counters.go,0);}finally{f.cleanup();}
});
