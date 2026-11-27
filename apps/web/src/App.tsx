import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PlaybackTransport } from '../../../packages/shared/playback.ts';
import { parseSequenceNumber } from '../../../packages/shared/sequence.ts';
import { FadeProgress } from './FadeProgress.tsx';
import { timingLabel, timingDetails, triggerLabel, followHint, text as t } from './text.ts';
export function App({transport, onResync}: {transport: PlaybackTransport; onResync: () => Promise<void>}) {
  const state = useSyncExternalStore(transport.subscribe, transport.getSnapshot);
  const [settings,setSettings]=useState(new URLSearchParams(location.search).get('page')==='settings');
  function navigate(value: boolean){history.pushState(null,'',value?'?page=settings':location.pathname);setSettings(value);}
  useEffect(()=>{const pop=()=>setSettings(new URLSearchParams(location.search).get('page')==='settings');addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop);},[]);
  const [poolDraft,setPoolDraft]=useState(state.sequence.dataPool);
  useEffect(()=>setPoolDraft(state.sequence.dataPool),[state.sequence.dataPool]);
  const [following, setFollowing] = useState(true);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState('');
  const [sequenceDraft, setSequenceDraft] = useState(state.sequence.number);
  const previousSequence = useRef(state.sequence.number);
  useEffect(() => {
    const previous=previousSequence.current;
    setSequenceDraft(draft => draft===previous?state.sequence.number:draft);
    previousSequence.current=state.sequence.number;
  },[state.sequence.number]);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const index = state.cues.findIndex(c => c.id === state.currentCueId);
  const current = state.cues[index];
  const next = state.cues.find(c => c.id === state.nextCueId);
  const available = state.connectionState === 'ONLINE';
  const fading=available && !!state.fadePreview && state.fadePreview.elapsedMs<state.fadePreview.durationMs;
  const blocked = state.locked || !available || cooldown || (state.commandState!==undefined && state.commandState!=='idle');
  const sequenceNumber = parseSequenceNumber(sequenceDraft);
  const poolNumber=parseSequenceNumber(poolDraft);
  const sequencePending = sequenceNumber !== state.sequence.number || poolNumber!==state.sequence.dataPool;
  const selectionBlocked=state.connectionState==='OFFLINE' || cooldown || state.commandState!=='idle';
  const playbackBlocked = blocked || sequencePending;
  useEffect(() => {
    if (following && !settings) rowRef.current?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }, [state.currentCueId, following,settings]);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function execute(action: 'goPlus' | 'goMinus') {
    const result = await transport.execute({requestId:Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join(''),sequenceRef:state.sequence,action,expectedRevision:state.revision});
    if (!result.accepted) { setError(t.error); return; }
    setError(''); setCooldown(true);
    timer.current = setTimeout(() => setCooldown(false),450);
  }
  return <div className={`app ${settings?'settings-view':'playback-view'}`}>
    <header className="header">
      <div className="brand"><span className="brand-mark">{t.brand}</span><div><h1>{t.title}</h1><span className="eyebrow">{t.subtitle}</span></div></div>
      <div className="sequence"><span className="eyebrow">{t.dataPool} {state.sequence.dataPool} · {t.sequence} {state.sequence.number.padStart(2,'0')}</span><strong>{state.sequence.name}</strong></div>
      <div className="header-actions"><button className="settings-link" aria-label={settings?t.back:t.settings} onClick={()=>navigate(!settings)}>{settings?'←':'⚙'}<span>{settings?t.back:t.settings}</span></button><span className="badge"><i />{state.connectionState}</span><button className={`lock ${state.locked ? 'is-locked' : ''}`} aria-label={state.locked?t.unlock:t.lock} aria-pressed={state.locked} onClick={() => transport.setLocked(!state.locked)}><span aria-hidden="true">{state.locked?'▣':'▢'}</span> {state.locked?t.locked:t.unlocked}</button></div>
    </header>
    {settings ? <main className="settings-page">
      <h2>{t.settings}</h2><p className="settings-description">{t.settingsDescription}</p>
      <section className="sequence-picker" aria-label={t.targetSettings}>
      <form onSubmit={async event=>{
        event.preventDefault();if(selectionBlocked || !sequenceNumber || !poolNumber)return;
        const result=await transport.selectTarget(poolNumber,sequenceNumber,state.revision);
        if(!result.accepted){setError(t.error);return;}
        const selected=transport.getSnapshot().sequence;
        setSequenceDraft(selected.number);setPoolDraft(selected.dataPool);setError('');setFollowing(true);
      }}>
        <label htmlFor="data-pool">{t.dataPoolNumber}<input id="data-pool" inputMode="numeric" maxLength={16} value={poolDraft} disabled={selectionBlocked} aria-invalid={!poolNumber} onChange={e=>setPoolDraft(e.target.value)}/></label>
        <label htmlFor="sequence-number">{t.sequenceNumber}<input id="sequence-number" inputMode="numeric" maxLength={16} value={sequenceDraft} disabled={selectionBlocked} aria-invalid={!sequenceNumber} onChange={e=>setSequenceDraft(e.target.value)}/></label>
        <button type="submit" disabled={selectionBlocked || !poolNumber || !sequenceNumber || !sequencePending}>{t.applySequence}</button>
        {sequencePending && <button type="button" className="discard-sequence" onClick={()=>{setSequenceDraft(state.sequence.number);setPoolDraft(state.sequence.dataPool);setError('');}}>{t.discardSequence}</button>}
      </form>
      <p className={!poolNumber || !sequenceNumber?'warning':''}>{!poolNumber || !sequenceNumber?t.targetInvalid:t.sequenceHint}</p>
      </section><p role="status">{error || (!available?t.unavailable:'')}</p>
      <button className="settings-resync" onClick={()=>void onResync()}>{t.resync}</button>
      <p className="settings-description">{t.fadeEstimate}</p><p className="settings-description">{t.connectionNotice} · {t.version}</p>
    </main> : <>
    <main>
      <section className="cue-cards" aria-label={`${t.current} / ${t.next}`} aria-live="polite">
        <article className="cue-card current"><div className="card-label"><span><i />{t.current}</span><span aria-hidden="true">●</span></div><div className="cue-detail"><strong className="cue-number">{current?.number ?? '—'}</strong><div><h2>{current?.name ?? (available?t.off:t.unknown)}</h2><span className="fade" title={timingDetails(current)}>{t.total} <b>{timingLabel(current)}</b></span><small className="timing-detail">{timingDetails(current)}</small>{triggerLabel(current) && <span className="trigger-badge">{triggerLabel(current)}</span>}</div></div><FadeProgress preview={state.fadePreview} available={available}/></article>
        <article className="cue-card next"><div className="card-label"><span><i />{t.next}</span><span aria-hidden="true">↗</span></div><div className="cue-detail"><strong className="cue-number">{next?.number ?? '—'}</strong><div><h2>{next?.name ?? (state.cues.length?t.end:t.emptyList)}</h2><span className="fade" title={timingDetails(next)}>{t.total} <b>{timingLabel(next)}</b></span><small className="timing-detail">{timingDetails(next)}</small>{triggerLabel(next) && <span className="trigger-badge">{triggerLabel(next)}</span>}</div></div>{next?.trigger==='Follow' && available && <p className="follow-notice">{state.playbackState==='running'?followHint(next):t.followOff}</p>}</article>
      </section>
      <section className="workspace">
        <div className="list-panel"><div className="panel-title"><h2>{t.list} <span>{state.cues.length.toString().padStart(2,'0')}</span></h2><button className={`follow ${following?'active':''}`} aria-pressed={following} onClick={() => setFollowing(!following)}>{following?'◎':'↧'} {following?t.following:t.follow}</button></div>
          <div className="table-scroll" tabIndex={0} aria-label={t.list} onWheel={() => setFollowing(false)} onTouchMove={() => setFollowing(false)} onKeyDown={event => { if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(event.key)) setFollowing(false); }}>
            <table><thead><tr><th>{t.number}</th><th>{t.name}</th><th>{t.timing}</th><th>{t.status}</th></tr></thead><tbody>{state.cues.map((cue,i) => {
              const isCurrent = cue.id === state.currentCueId; const isNext = cue.id === state.nextCueId;
              return <tr key={cue.id} ref={isCurrent?rowRef:undefined} className={isCurrent?'row-current':isNext?'row-next':i<index?'row-past':''} aria-current={isCurrent?'step':undefined}><td><span className="row-marker" aria-hidden="true">{isCurrent?'▶':isNext?'↗':''}</span>{cue.number}</td><td>{cue.name}{triggerLabel(cue) && <span className="trigger-badge row-trigger">{triggerLabel(cue)}</span>}{isCurrent && <FadeProgress preview={state.fadePreview} available={available} compact/>}</td><td title={timingDetails(cue)}>{timingLabel(cue)}<small className="timing-detail">{cue.individualFade || cue.individualDelay?`${t.individual} · `:''}D {cue.individualDelay || cue.delay || 0}s</small></td><td><span className="row-status">{isCurrent?t.current:isNext?t.next:'—'}</span></td></tr>;
            })}</tbody></table>
          </div><div className="list-bottom"><span><i className="green-dot" />{following?t.following:t.manual}</span><span>{t.footer}</span></div>
        </div>
        <aside className="control-panel"><div className="progress-section"><div className="eyebrow">{t.position}</div><div className="position"><strong>{String(index+1).padStart(2,'0')}</strong><span>/ {String(state.cues.length).padStart(2,'0')}</span></div><progress aria-label={t.position} value={index+1} max={state.cues.length}/><p>{current?.name ?? (available?t.off:t.unknown)}</p></div>
          <div className="controls"><p className={`control-status ${state.locked?'warning':''}`} role="status">{state.commandState==='unknown'?t.unknownResult:!available?t.unavailable:state.locked?t.lockReason:state.commandState==='pending'?t.pending:sequencePending?t.sequencePending:error || (cooldown?t.cooldown:state.playbackState==='off'?t.offReady:t.ready)}</p>
            <button className={`go-plus ${fading?'is-fading':''}`} title={fading?t.fadeEstimate:undefined} disabled={playbackBlocked} onClick={() => execute('goPlus')}><span className="go-label">{t.goPlus}<span aria-hidden="true">→</span></span><span className="go-target">{fading && <span className="fade-indicator">{t.fadeRunning} · </span>}{next?`${next.number} · ${next.name}`:t.noNext}</span></button>

            <div className="secondary-controls"><button className="go-minus" disabled={playbackBlocked} onClick={() => execute('goMinus')}><span aria-hidden="true">←</span><strong>{t.goMinus}</strong><span>{t.previous}</span></button></div>
            <button className="resync" onClick={() => void onResync()}>{t.resync}</button>
          </div>
        </aside>
      </section>
    </main>
    </>}
  </div>;
}
