import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Command, PlaybackTransport } from '../../../packages/shared/playback.ts';
import { parseSequenceNumber } from '../../../packages/shared/sequence.ts';
import { FadeProgress } from './FadeProgress.tsx';
import dialogPolyfill from 'dialog-polyfill';
import { scrollCueIntoView } from './compatibility.ts';
import { timingLabel, timingDetails, triggerLabel, followHint, text as t } from './text.ts';
export function App({transport, onResync}: {transport: PlaybackTransport; onResync: () => Promise<void>}) {
  const state = useSyncExternalStore(transport.subscribe, transport.getSnapshot);
  const [settings,setSettings]=useState(new URLSearchParams(location.search).get('page')==='settings');
  function navigate(value: boolean){history.pushState(null,'',value?'?page=settings':location.pathname);setSettings(value);}
  useEffect(()=>{const pop=()=>setSettings(new URLSearchParams(location.search).get('page')==='settings');addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop);},[]);
  const [poolDraft,setPoolDraft]=useState(state.sequence.dataPool);
  useEffect(()=>setPoolDraft(state.sequence.dataPool),[state.sequence.dataPool]);
  const [cueAction,setCueAction]=useState<{action:'load' | 'goto';sequenceId:string;revision:number} | null>(null);
  const [cueChoice,setCueChoice]=useState('');
  const cueDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=cueDialog.current;if(!dialog)return;dialogPolyfill.registerDialog(dialog);if(cueAction && !dialog.open)dialog.showModal();else if(!cueAction && dialog.open)dialog.close();},[cueAction]);
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
  const loaded=state.connectionState==='ONLINE'?state.cues.find(c=>c.id===state.loadedCueId):undefined;
  const goTarget=loaded??next;
  const available = state.connectionState === 'ONLINE';
  const fading=available && !!state.fadePreview && state.fadePreview.elapsedMs<state.fadePreview.durationMs;
  const blocked = state.locked || !available || cooldown || (state.commandState!==undefined && state.commandState!=='idle');
  const sequenceNumber = parseSequenceNumber(sequenceDraft);
  const poolNumber=parseSequenceNumber(poolDraft);
  const sequencePending = sequenceNumber !== state.sequence.number || poolNumber!==state.sequence.dataPool;
  const selectionBlocked=state.connectionState==='OFFLINE' || cooldown || state.commandState!=='idle';
  const playbackBlocked = blocked || sequencePending;
  useEffect(() => {
    if (following && !settings && rowRef.current) scrollCueIntoView(rowRef.current);
  }, [state.currentCueId, following,settings]);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function execute(action: Command['action'],cueId?: string,revision=state.revision) {
    const result = await transport.execute({requestId:Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join(''),sequenceRef:state.sequence,action,...(cueId?{cueId}:{}),expectedRevision:revision});
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
        <article className="cue-card next"><div className="card-label"><span><i />{t.next}</span><span aria-hidden="true">↗</span></div><div className="cue-detail"><strong className="cue-number">{next?.number ?? '—'}</strong><div><h2>{next?.name ?? (state.cues.length?t.end:t.emptyList)}</h2><span className="fade" title={timingDetails(next)}>{t.total} <b>{timingLabel(next)}</b></span><small className="timing-detail">{timingDetails(next)}</small>{triggerLabel(next) && <span className="trigger-badge">{triggerLabel(next)}</span>}</div></div>{next?.trigger==='Follow' && available && <p className="follow-notice">{state.playbackState==='running'?followHint(next):t.followOff}</p>}{loaded && <div className="loaded-notice" role="status"><span>{t.loaded}</span><strong>{loaded.number} · {loaded.name}</strong></div>}{available && state.loadedCueId===undefined && <p className="load-unknown">{t.loadUnknown}</p>}</article>
      </section>
      <section className="workspace">
        <div className="list-panel"><div className="panel-title"><h2>{t.list} <span>{state.cues.length.toString().padStart(2,'0')}</span></h2><button className={`follow ${following?'active':''}`} aria-pressed={following} onClick={() => setFollowing(!following)}>{following?'◎':'↧'} {following?t.following:t.follow}</button></div>
          <div className="table-scroll" tabIndex={0} aria-label={t.list} onWheel={() => setFollowing(false)} onTouchMove={() => setFollowing(false)} onKeyDown={event => { if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(event.key)) setFollowing(false); }}>
            <table><thead><tr><th>{t.number}</th><th>{t.name}</th><th>{t.timing}</th><th>{t.status}</th></tr></thead><tbody>{state.cues.map((cue,i) => {
              const isLoaded=available && cue.id===state.loadedCueId; const isCurrent = cue.id === state.currentCueId; const isNext = cue.id === state.nextCueId;
              return <tr key={cue.id} ref={isCurrent?rowRef:undefined} className={isCurrent?'row-current':isNext?'row-next':i<index?'row-past':''} aria-current={isCurrent?'step':undefined}><td><span className="row-marker" aria-hidden="true">{isCurrent?'▶':isNext?'↗':''}</span>{cue.number}</td><td>{cue.name}{isLoaded && <span className="loaded-tag">{t.loaded}</span>}{triggerLabel(cue) && <span className="trigger-badge row-trigger">{triggerLabel(cue)}</span>}{isCurrent && <FadeProgress preview={state.fadePreview} available={available} compact/>}</td><td title={timingDetails(cue)}>{timingLabel(cue)}<small className="timing-detail">{cue.individualFade || cue.individualDelay?`${t.individual} · `:''}D {cue.individualDelay || cue.delay || 0}s</small></td><td><span className="row-status">{isCurrent?t.current:isNext?t.next:'—'}</span></td></tr>;
            })}</tbody></table>
          </div><div className="list-bottom"><span><i className="green-dot" />{following?t.following:t.manual}</span><span>{t.footer}</span></div>
        </div>
        <aside className="control-panel"><div className="progress-section"><div className="eyebrow">{t.position}</div><div className="position"><strong>{String(index+1).padStart(2,'0')}</strong><span>/ {String(state.cues.length).padStart(2,'0')}</span></div><progress aria-label={t.position} value={index+1} max={state.cues.length}/><p>{current?.name ?? (available?t.off:t.unknown)}</p></div>
          <div className="controls"><p className={`control-status ${state.locked?'warning':''}`} role="status">{state.commandState==='unknown'?t.unknownResult:!available?t.unavailable:state.locked?t.lockReason:state.commandState==='pending'?t.pending:sequencePending?t.sequencePending:error || (state.cueCommandReceipt?`${t.maConfirmed} ${state.cueCommandReceipt.action==='load'?t.load:t.goto} · ${state.cues.find(c=>c.id===state.cueCommandReceipt?.cueId)?.number??'—'}`:cooldown?t.cooldown:state.playbackState==='off'?t.offReady:t.ready)}</p>
            <button className={`go-plus ${fading?'is-fading':''}`} title={fading?t.fadeEstimate:undefined} disabled={playbackBlocked} onClick={() => execute('goPlus')}><span className="go-label">{t.goPlus}<span aria-hidden="true">→</span></span><span className="go-target">{fading && <span className="fade-indicator">{t.fadeRunning} · </span>}{loaded && `${t.loaded}: `}{goTarget?`${goTarget.number} · ${goTarget.name}`:t.noNext}</span></button>

            <div className="secondary-controls"><button className="go-minus" disabled={playbackBlocked} onClick={() => execute('goMinus')}><span aria-hidden="true">←</span><strong>{t.goMinus}</strong><span>{t.previous}</span></button></div>
            <div className="cue-actions">{(['load','goto'] as const).map(action=><button key={action} disabled={playbackBlocked || !state.cues.length} onClick={()=>{setCueChoice(next?.id??current?.id??state.cues[0]?.id??'');setCueAction({action,sequenceId:state.sequence.id,revision:state.revision});}}>{t[action]}{action==='load' && loaded && <span className="load-button-status"> · {loaded.number}</span>}<span aria-hidden="true">{action==='load'?' ↥':' ↗'}</span></button>)}</div>
            <button className="resync" onClick={() => void onResync()}>{t.resync}</button>
          </div>
        </aside>
      </section>
    </main>
    </>}
    <dialog role="dialog" aria-modal={cueAction?true:undefined} ref={cueDialog} onCancel={()=>setCueAction(null)} aria-labelledby="cue-action-title">
      <form onSubmit={event=>{event.preventDefault();if(!cueAction || playbackBlocked || cueAction.sequenceId!==state.sequence.id || cueAction.revision!==state.revision || !state.cues.some(c=>c.id===cueChoice))return;void execute(cueAction.action,cueChoice,cueAction.revision);setCueAction(null);}}>
        <h2 id="cue-action-title">{cueAction?t[cueAction.action]:''}</h2><p>{cueAction?.action==='load'?t.loadHint:t.gotoHint}</p>
        <label htmlFor="target-cue">{t.targetCue}</label><select id="target-cue" value={cueChoice} onChange={e=>setCueChoice(e.target.value)}>{state.cues.map(c=><option key={c.id} value={c.id}>{c.number} · {c.name}</option>)}</select>
        {cueAction && cueAction.revision!==state.revision && <p role="status">{t.selectionChanged}</p>}
        <div className="dialog-actions"><button type="button" onClick={()=>setCueAction(null)}>{t.cancel}</button><button className={cueAction?.action==='goto'?'goto-confirm':''} type="submit" disabled={playbackBlocked || !cueChoice || cueAction?.sequenceId!==state.sequence.id || cueAction?.revision!==state.revision}>{cueAction?t[cueAction.action]:''}</button></div>
      </form>
    </dialog>
  </div>;
}
