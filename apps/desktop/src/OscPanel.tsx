import { useEffect, useState } from 'react';
import type { LiveState, OscConfig } from '../../../packages/shared/live.ts';
import type { DesktopApi } from './contracts.ts';
import { desktopText } from './text.ts';
const t=desktopText.osc;
export function OscPanel({api}: {api?: DesktopApi}) {
  const [addresses,setAddresses]=useState<string[]>(['127.0.0.1']);
  const [config,setConfig]=useState<OscConfig>({host:'127.0.0.1',replyHost:'127.0.0.1',port:8000,prefix:'',dataPool:'1',sequenceNumber:'1'});
  const [live,setLive]=useState<LiveState | null>(null);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!api)return;let active=true;
    void api.getAddresses().then(values=>{if(active){setAddresses(values);const ip=values.find(ip=>ip!=='127.0.0.1')??'127.0.0.1';setConfig(c=>({...c,host:ip,replyHost:ip}));}}).catch(()=>{if(active)setError(desktopText.ipcError);});
    const refresh=()=>{void api.getLive().then(state=>{if(active)setLive(state);}).catch(()=>{if(active)setError(desktopText.ipcError);});};refresh();
    const timer=setInterval(refresh,500);return()=>{active=false;clearInterval(timer);};
  },[api]);
  const phase=live?.snapshot.connectionState ?? 'OFFLINE';
  const connected=phase!=='OFFLINE';
  const label=phase==='ONLINE'?t.online:phase==='CONNECTING'?t.connecting:phase==='STALE'?t.stale:t.offline;
  async function change() {
    if(!api || pending)return;setPending(true);setError('');
    try{setLive(connected?await api.disconnectOsc():await api.connectOsc(config));}catch{setError(desktopText.ipcError);}finally{setPending(false);}
  }
  function field(key: keyof OscConfig,value: string) {setConfig(c=>({...c,[key]:key==='port'?Number(value):value}));}
  return <section className="osc-panel"><h2>{t.title}</h2><p className="hint">{t.intro}</p>
    <div className={`osc-status ${phase.toLowerCase()}`} role="status">{label}{live?.version?` · ${live.version}`:''}{live?.commandState==='pending'?` · ${t.pending}`:live?.commandState==='unknown'?` · ${t.unknown}`:''}</div>
    <fieldset className="osc-fields" disabled={!api || pending || connected}>
      <label>{t.host}<input value={config.host} inputMode="decimal" onChange={e=>field('host',e.target.value)}/></label>
      <label>{t.reply}<select value={config.replyHost} onChange={e=>field('replyHost',e.target.value)}>{addresses.map(ip=><option key={ip}>{ip}</option>)}</select></label>
      <label>{t.port}<input type="number" min={1024} max={65535} value={config.port} onChange={e=>field('port',e.target.value)}/></label>
      <label>{t.prefix}<input value={config.prefix} maxLength={32} onChange={e=>field('prefix',e.target.value)}/></label>
      <label>{t.pool}<input value={config.dataPool} inputMode="numeric" maxLength={16} onChange={e=>field('dataPool',e.target.value)}/></label>
      <label>{t.sequence}<input value={config.sequenceNumber} inputMode="numeric" maxLength={16} onChange={e=>field('sequenceNumber',e.target.value)}/></label>
    </fieldset>
    <p className="hint">{t.setup}</p><p className="hint">{t.next}</p>
    <p className="osc-error" role="status">{error || (live?.error?t.errors[live.error]:'')}</p>
    <button className={connected?'stop':'start'} disabled={!api || pending} onClick={()=>void change()}>{connected?t.disconnect:t.connect}</button>
  </section>;
}
