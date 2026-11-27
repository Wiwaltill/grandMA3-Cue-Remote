import { useEffect, useState } from 'react';
import { advanceFade, fadePercent, type FadePreview } from '../../../packages/shared/fade.ts';
import { text as t, fadeRemainingLabel } from './text.ts';
export function FadeProgress({preview,available,compact=false}: {preview?: FadePreview;available: boolean;compact?: boolean}) {
  const [clock,setClock]=useState<{preview?: FadePreview;elapsed: number}>({elapsed:0});
  useEffect(()=>{
    setClock({preview,elapsed:0});
    if(!preview || !available || preview.paused || preview.elapsedMs>=preview.durationMs || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const start=performance.now();let frame=0;
    const tick=()=>{const delta=performance.now()-start;setClock({preview,elapsed:delta});if(preview.elapsedMs+delta<preview.durationMs)frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[preview,available]);
  if(!preview || !available)return compact?null:<div className="fade-preview" aria-live="off" title={t.fadeEstimate}><p>{available?t.fadeWaiting:t.fadeUnavailable}</p></div>;
  const value=advanceFade(preview,clock.preview===preview?clock.elapsed:0);const percent=fadePercent(value);
  const bar=<progress className="fade-progress" value={percent} max={100} aria-label={t.fadePreview}/>;
  if(compact)return <div className="row-fade" aria-live="off">{bar}</div>;
  return <div className="fade-preview" aria-live="off" title={t.fadeEstimate}><div className="fade-preview-heading"><span className="eyebrow">{t.fadePreview}</span><strong>{Math.round(percent)} %</strong></div>{bar}<p>{preview.paused?t.fadePaused:percent>=100?t.fadeComplete:fadeRemainingLabel(value.durationMs-value.elapsedMs,value.durationMs)}</p></div>;
}
