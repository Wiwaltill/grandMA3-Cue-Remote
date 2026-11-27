import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceFade, fadePercent, type FadePreview } from '../packages/shared/fade.ts';
const preview: FadePreview={cueId:'cue-1',durationMs:4000,elapsedMs:1000};
test('calculated fade clamps completion and handles zero-duration cues',()=>{
  assert.equal(fadePercent(advanceFade(preview,1000)),50);
  assert.equal(fadePercent(advanceFade(preview,10000)),100);
  assert.equal(fadePercent({...preview,durationMs:0,elapsedMs:0}),100);
});
test('negative elapsed deltas cannot rewind a fade',()=>{
  assert.equal(advanceFade(preview,-2000).elapsedMs,1000);
  assert.equal(preview.elapsedMs,1000,'calculation does not mutate source snapshot');
});
