import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DesktopApi, ServerStatus } from './contracts.ts';
import { desktopText as t } from './text.ts';
import './styles.css';
declare global { interface Window { desktop?: DesktopApi } }
function Launcher() {
  const [status,setStatus] = useState<ServerStatus | null>(null);
  const [port,setPort] = useState('4173');
  const [allowLan,setAllowLan] = useState(false);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState('');
  const api = window.desktop;
  useEffect(() => {
    if (!api) return;
    let active = true;
    const unsubscribe = api.onStatus(value => { if (active) setStatus(value); });
    void api.getStatus().then(value => { if (active) setStatus(value); }).catch(() => { if (active) setError(t.ipcError); });
    return () => {active = false;unsubscribe();};
  },[api]);
  const phase = status?.phase ?? 'stopped';
  const busy = pending || phase === 'starting' || phase === 'stopping';
  const running = phase === 'running';
  const validPort = /^\d+$/.test(port) && (Number(port) === 0 || Number(port) >= 1024 && Number(port) <= 65535);
  async function action(callback: () => Promise<unknown>) {
    if (pending) return;
    setPending(true);setError('');
    try { await callback(); } catch { setError(t.ipcError); }
    finally {setPending(false);}
  }
  return <main className="launcher">
    <header><span className="logo">MA3</span><div><h1>{t.title}</h1><span className="eyebrow">{t.label}</span></div><span className="demo-badge">{t.demo}</span></header>
    <p className="intro">{t.intro}</p>
    <section className={`server-state ${phase}`} aria-live="polite"><span className="eyebrow">{t.status}</span><h2><i/>{t[phase]}</h2><p>{running?t.runningHint:t.stoppedHint}</p></section>
    <fieldset disabled={!api || !status || busy || running}><div className="port-field"><label htmlFor="port">{t.port}</label><input id="port" type="number" min="0" max="65535" step="1" value={port} aria-invalid={!validPort} aria-describedby="port-hint" onChange={event=>setPort(event.target.value)}/></div><p id="port-hint" className="hint">{t.portHint}</p>
      <label className="lan-option"><input type="checkbox" checked={allowLan} onChange={event=>setAllowLan(event.target.checked)}/><strong>{t.lan}</strong></label><p className="hint lan-hint">{t.lanHint}</p>
    </fieldset>
    <div role="status" className="feedback">{!api?t.standalone:error || (status?.error?t.errors[status.error]:!validPort?t.errors['invalid-config']:'')}</div>
    <div className="actions"><button className={running?'stop':'start'} disabled={!api || !status || busy || (!running && !validPort)} onClick={()=>void action(()=>running?api!.stop():api!.start({port:Number(port),allowLan}))}>{phase==='starting'?t.starting:phase==='stopping'?t.stopping:running?t.stop:t.start}</button><button className="open" disabled={!running || busy} onClick={()=>void action(()=>api!.openDemo())}>{t.open}<span aria-hidden="true">↗</span></button></div>
    {running && <section className="addresses"><div className="eyebrow">{t.addresses}</div>{status?.urls.map((url,index)=><div className="address" key={url}><span>{index===0?t.localAddress:t.lanAddress}</span><code>{url}</code></div>)}</section>}
    <footer><span className={status?.allowLan && running?'network':''}>◈ {status?.allowLan && running?t.network:t.local}</span><p>{t.notice}</p><p>{t.quitHint}</p></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Launcher/></StrictMode>);
