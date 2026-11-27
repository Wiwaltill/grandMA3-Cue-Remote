import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PlaybackTransport } from '../../../packages/shared/playback.ts';
import { parseSequenceNumber } from '../../../packages/shared/sequence.ts';
import { fadeLabel, text as t } from './text.ts';
export function App({transport, onReset}: {transport: PlaybackTransport; onReset: () => void}) {
  const state = useSyncExternalStore(transport.subscribe, transport.getSnapshot);
  const [following, setFollowing] = useState(true);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState('');
  const [sequenceDraft, setSequenceDraft] = useState(state.sequence.number);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const index = state.cues.findIndex(c => c.id === state.currentCueId);
  const current = state.cues[index];
  const next = state.cues.find(c => c.id === state.nextCueId);
  const available = state.connectionState === 'DEMO';
  const blocked = state.locked || !available || cooldown;
  const sequenceNumber = parseSequenceNumber(sequenceDraft);
  const sequencePending = sequenceNumber !== state.sequence.number;
  const playbackBlocked = blocked || sequencePending;
  useEffect(() => {
    if (following) rowRef.current?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }, [state.currentCueId, following]);
  useEffect(() => () => clearTimeout(timer.current), []);
  function execute(action: 'goPlus' | 'goMinus') {
    const result = transport.execute({requestId:crypto.randomUUID(),sequenceRef:state.sequence,action,expectedRevision:state.revision});
    if (!result.accepted) { setError(t.error); return; }
    setError(''); setCooldown(true);
    timer.current = setTimeout(() => setCooldown(false),450);
  }
  return <div className="app">
    <header className="header">
      <div className="brand"><span className="brand-mark">{t.brand}</span><div><h1>{t.title}</h1><span className="eyebrow">{t.subtitle}</span></div></div>
      <div className="sequence"><span className="eyebrow">{t.sequence} {state.sequence.number.padStart(2,'0')}</span><strong>{state.sequence.name}</strong></div>
      <div className="header-actions"><span className="badge"><i />{state.connectionState}</span><button className={`lock ${state.locked ? 'is-locked' : ''}`} aria-label={state.locked?t.unlock:t.lock} aria-pressed={state.locked} onClick={() => transport.setLocked(!state.locked)}><span aria-hidden="true">{state.locked?'▣':'▢'}</span> {state.locked?t.locked:t.unlocked}</button></div>
    </header>
    <div className="demo-banner"><span className="demo-icon" aria-hidden="true">◈</span>{t.demoNotice}<span className="version">{t.version}</span></div>
    <section className="sequence-picker" aria-label={t.sequenceNumber}>
      <form onSubmit={event => {
        event.preventDefault();
        if (blocked || !sequenceNumber) return;
        const result = transport.selectSequenceNumber(sequenceNumber,state.revision);
        if (!result.accepted) {setError(t.error);return;}
        setSequenceDraft(transport.getSnapshot().sequence.number);setError('');setFollowing(true);
      }}>
        <label htmlFor="sequence-number">{t.sequenceNumber}</label>
        <input id="sequence-number" type="text" inputMode="numeric" maxLength={16} value={sequenceDraft} disabled={blocked} aria-invalid={!sequenceNumber} aria-describedby="sequence-hint" onChange={event => {setSequenceDraft(event.target.value);setError('');}}/>
        <button type="submit" disabled={blocked || !sequenceNumber || !sequencePending}>{t.applySequence}</button>
        {sequencePending && <button type="button" className="discard-sequence" onClick={() => {setSequenceDraft(state.sequence.number);setError('');}}>{t.discardSequence}</button>}
      </form>
      <p id="sequence-hint" role="status" className={!sequenceNumber?'warning':''}>{!sequenceNumber?t.sequenceInvalid:t.sequenceHint}</p>
    </section>
    <main>
      <section className="cue-cards" aria-label={`${t.current} / ${t.next}`} aria-live="polite">
        <article className="cue-card current"><div className="card-label"><span><i />{t.current}</span><span aria-hidden="true">●</span></div><div className="cue-detail"><strong className="cue-number">{current?.number ?? '—'}</strong><div><h2>{current?.name ?? t.off}</h2><span className="fade">{t.fade} <b>{fadeLabel(current?.fade)}</b></span></div></div></article>
        <article className="cue-card next"><div className="card-label"><span><i />{t.next}</span><span aria-hidden="true">↗</span></div><div className="cue-detail"><strong className="cue-number">{next?.number ?? '—'}</strong><div><h2>{next?.name ?? t.end}</h2><span className="fade">{t.fade} <b>{fadeLabel(next?.fade)}</b></span></div></div></article>
      </section>
      <section className="workspace">
        <div className="list-panel"><div className="panel-title"><h2>{t.list} <span>{state.cues.length.toString().padStart(2,'0')}</span></h2><button className={`follow ${following?'active':''}`} aria-pressed={following} onClick={() => setFollowing(!following)}>{following?'◎':'↧'} {following?t.following:t.follow}</button></div>
          <div className="table-scroll" tabIndex={0} aria-label={t.list} onWheel={() => setFollowing(false)} onTouchMove={() => setFollowing(false)} onKeyDown={event => { if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(event.key)) setFollowing(false); }}>
            <table><thead><tr><th>{t.number}</th><th>{t.name}</th><th>{t.fade.toUpperCase()}</th><th>{t.status}</th></tr></thead><tbody>{state.cues.map((cue,i) => {
              const isCurrent = cue.id === state.currentCueId; const isNext = cue.id === state.nextCueId;
              return <tr key={cue.id} ref={isCurrent?rowRef:undefined} className={isCurrent?'row-current':isNext?'row-next':i<index?'row-past':''} aria-current={isCurrent?'step':undefined}><td><span className="row-marker" aria-hidden="true">{isCurrent?'▶':isNext?'↗':''}</span>{cue.number}</td><td>{cue.name}</td><td>{fadeLabel(cue.fade)}</td><td><span className="row-status">{isCurrent?t.current:isNext?t.next:'—'}</span></td></tr>;
            })}</tbody></table>
          </div><div className="list-bottom"><span><i className="green-dot" />{following?t.following:t.manual}</span><span>{t.footer}</span></div>
        </div>
        <aside className="control-panel"><div className="progress-section"><div className="eyebrow">{t.position}</div><div className="position"><strong>{String(index+1).padStart(2,'0')}</strong><span>/ {String(state.cues.length).padStart(2,'0')}</span></div><progress aria-label={t.position} value={index+1} max={state.cues.length}/><p>{current?.name ?? t.off}</p></div>
          <div className="controls"><p className={`control-status ${state.locked?'warning':''}`} role="status">{state.locked?t.lockReason:!available?t.unavailable:sequencePending?t.sequencePending:error || (cooldown?t.cooldown:state.playbackState==='off'?t.sequenceOff:t.ready)}</p>
            <button className="go-plus" disabled={playbackBlocked || !next} onClick={() => execute('goPlus')}><span className="go-label">{t.goPlus}<span aria-hidden="true">→</span></span><span className="go-target">{next?`${next.number} · ${next.name}`:t.noNext}</span></button>
            <button className="go-minus" disabled={playbackBlocked || index<=0} onClick={() => execute('goMinus')}><span aria-hidden="true">←</span><strong>{t.goMinus}</strong><span>{t.previous}</span></button>
            <button className="reset" disabled={playbackBlocked} title={t.resetTitle} onClick={() => dialogRef.current?.showModal()}><span aria-hidden="true">↺</span> {t.reset}</button>
          </div>
        </aside>
      </section>
    </main>
    <dialog ref={dialogRef}><h2>{t.reset}</h2><p>{t.resetConfirm}</p><form method="dialog"><button autoFocus>{t.cancel}</button><button onClick={() => { if (!playbackBlocked) {onReset(); setError(''); setFollowing(true);} }}>{t.confirm}</button></form></dialog>
  </div>;
}
