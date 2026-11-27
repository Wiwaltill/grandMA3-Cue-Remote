import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceFade, fadePercent, type FadePreview } from '../packages/shared/fade.ts';
const preview: FadePreview={cueId:'cue-1',durationMs:4000,elapsedMs:1000,paused:false};
test('calculated fade clamps completion and handles zero-duration cues',()=>{
  assert.equal(fadePercent(advanceFade(preview,1000)),50);
  assert.equal(fadePercent(advanceFade(preview,10000)),100);
  assert.equal(fadePercent({...preview,durationMs:0,elapsedMs:0}),100);
});
test('paused fade does not advance and negative elapsed deltas cannot rewind it',()=>{
  assert.equal(advanceFade({...preview,paused:true},2000).elapsedMs,1000);
  assert.equal(advanceFade(preview,-2000).elapsedMs,1000);
  assert.equal(preview.elapsedMs,1000,'calculation does not mutate source snapshot');
});
