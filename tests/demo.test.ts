import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DemoAdapter, demoCues } from '../packages/demo/adapter.ts';
import type { Command, PlaybackSnapshot } from '../packages/shared/playback.ts';
function harness(options: {loop?: boolean; initialSnapshot?: PlaybackSnapshot} = {}) {
  let time = 1000; let id = 0;
  const adapter = new DemoAdapter({...options,now:() => time});
  const command = (action: Command['action'] = 'goPlus'): Command => ({requestId:String(++id),sequenceRef:adapter.getSnapshot().sequence,action,expectedRevision:adapter.getSnapshot().revision});
  const go = (action: Command['action'] = 'goPlus') => {time+=500; return adapter.execute(command(action));};
  return {adapter,command,go,advance:() => {time+=500;}};
}
test('initial Current/Next and forward/backward transitions', () => {
  const h=harness(); assert.equal(h.adapter.getSnapshot().currentCueId,'opening');
  assert.deepEqual(h.go(),{accepted:true}); assert.equal(h.adapter.getSnapshot().currentCueId,'ballad');
  h.go('goMinus'); assert.equal(h.adapter.getSnapshot().currentCueId,'opening');
});
test('decimal cue is preserved and uses list order', () => {
  const h=harness();h.go();h.go();
  assert.equal(h.adapter.getSnapshot().currentCueId,'solo');
  assert.equal(demoCues.find(c=>c.id==='solo')?.number,'05.1');
  h.go();assert.equal(h.adapter.getSnapshot().currentCueId,'upbeat');
});
test('end stops and beginning cannot go backwards', () => {
  const h=harness();for(let i=0;i<6;i++) h.go();
  assert.equal(h.adapter.getSnapshot().nextCueId,null);assert.deepEqual(h.go(),{accepted:false,reason:'boundary'});
  for(let i=0;i<9;i++) h.go('goMinus');
  assert.equal(h.adapter.getSnapshot().currentCueId,'house');assert.deepEqual(h.go('goMinus'),{accepted:false,reason:'boundary'});
});
test('explicit demo loop returns to first cue', () => {
  const h=harness({loop:true});for(let i=0;i<7;i++) h.go();
  assert.equal(h.adapter.getSnapshot().currentCueId,'house');
});
test('lock rejects playback and reset preserves lock', () => {
  const h=harness();h.adapter.setLocked(true);
  assert.deepEqual(h.go(),{accepted:false,reason:'locked'});h.adapter.reset();
  assert.equal(h.adapter.getSnapshot().locked,true);assert.equal(h.adapter.getSnapshot().currentCueId,'opening');
});
test('duplicate requests, rapid clicks and competing clients do not advance twice', () => {
  const h=harness();const a=h.command();const b=h.command();
  assert.deepEqual(h.adapter.execute(a),{accepted:true});
  assert.deepEqual(h.adapter.execute(a),{accepted:false,reason:'duplicate'});
  assert.deepEqual(h.adapter.execute(b),{accepted:false,reason:'revision'});
  assert.deepEqual(h.adapter.execute(h.command()),{accepted:false,reason:'busy'});
  assert.equal(h.adapter.getSnapshot().currentCueId,'ballad');
});
test('other sequence and invalid actions are rejected', () => {
  const h=harness();const c=h.command();c.sequenceRef={...c.sequenceRef,id:'other'};
  assert.deepEqual(h.adapter.execute(c),{accepted:false,reason:'sequence'});
  assert.deepEqual(h.adapter.execute({...h.command(),action:'shell' as Command['action']}),{accepted:false,reason:'invalid'});
});
test('stale, offline, connecting and live snapshots fail closed in demo adapter', () => {
  for(const connectionState of ['STALE','OFFLINE','CONNECTING','ONLINE'] as const) {
    const snapshot={...new DemoAdapter().getSnapshot(),connectionState};
    const h=harness({initialSnapshot:snapshot});
    assert.deepEqual(h.go(),{accepted:false,reason:'unavailable'});
    assert.equal(h.adapter.getSnapshot().revision,snapshot.revision);
  }
});
test('off snapshot starts only at its explicit next cue', () => {
  const snapshot={...new DemoAdapter().getSnapshot(),currentCueId:null,nextCueId:'house',playbackState:'off' as const};
  const h=harness({initialSnapshot:snapshot});assert.deepEqual(h.go('goMinus'),{accepted:false,reason:'boundary'});
  h.go();assert.equal(h.adapter.getSnapshot().currentCueId,'house');
});
test('subscriptions share confirmed state and unsubscribe cleanly; reset advances revision', () => {
  const h=harness();let a=0;let b=0;
  const stop=h.adapter.subscribe(()=>a++);h.adapter.subscribe(()=>b++);
  h.go();stop();h.adapter.reset();assert.equal(a,1);assert.equal(b,2);
  assert.equal(h.adapter.getSnapshot().revision,2);assert.equal(h.adapter.getSnapshot().currentCueId,'opening');
});

test('sequence selection validates input, starts Off, and rejects old-target commands', () => {
  const h=harness();const old=h.command();const revision=h.adapter.getSnapshot().revision;
  for (const invalid of ['', '0', '-1', '2.5', '1e3', '1; Go+', '9007199254740992']) {
    assert.deepEqual(h.adapter.selectSequenceNumber(invalid,revision),{accepted:false,reason:'invalid'});
  }
  assert.equal(h.adapter.getSnapshot().revision,revision);
  assert.deepEqual(h.adapter.selectSequenceNumber('0042',revision),{accepted:true});
  const selected=h.adapter.getSnapshot();
  assert.equal(selected.sequence.number,'42');assert.equal(selected.currentCueId,null);
  assert.equal(selected.nextCueId,'house');assert.equal(selected.playbackState,'off');
  assert.deepEqual(h.adapter.execute(old),{accepted:false,reason:'sequence'});
  assert.deepEqual(h.go(),{accepted:true});assert.equal(h.adapter.getSnapshot().currentCueId,'house');
  h.adapter.reset();assert.equal(h.adapter.getSnapshot().sequence.number,'42');
});
test('sequence selection respects lock, status, revision and pending playback guard', () => {
  const h=harness();h.adapter.setLocked(true);
  assert.deepEqual(h.adapter.selectSequenceNumber('42',h.adapter.getSnapshot().revision),{accepted:false,reason:'locked'});
  h.adapter.setLocked(false);
  assert.deepEqual(h.adapter.selectSequenceNumber('42',0),{accepted:false,reason:'revision'});
  h.go();assert.deepEqual(h.adapter.selectSequenceNumber('42',h.adapter.getSnapshot().revision),{accepted:false,reason:'busy'});
  h.advance();const s=h.adapter.getSnapshot();
  assert.deepEqual(h.adapter.selectSequenceNumber('1',s.revision),{accepted:true});assert.equal(h.adapter.getSnapshot(),s);
  for (const connectionState of ['STALE','OFFLINE','CONNECTING','ONLINE'] as const) {
    const adapter=new DemoAdapter({initialSnapshot:{...s,connectionState}});
    assert.deepEqual(adapter.selectSequenceNumber('42',s.revision),{accepted:false,reason:'unavailable'});
  }
});
