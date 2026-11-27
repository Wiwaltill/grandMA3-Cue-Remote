import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoAdapter } from '../../../packages/demo/adapter.ts';
import { text as t } from './text.ts';
import { HttpTransport } from './transport/http.ts';
import { App } from './App.tsx';
import './styles.css';
const live=new URLSearchParams(location.search).get('mode')==='live';
if(live)document.title=t.livePageTitle;
let token=location.hash.slice(1);
if(live){try{token=token || sessionStorage.getItem('cue-remote-token') || '';if(token)sessionStorage.setItem('cue-remote-token',token);}catch{/* private browsing can disable storage */}}
const transport=live?new HttpTransport(token):new DemoAdapter();
if(live)history.replaceState(null,'',location.pathname+location.search);
createRoot(document.getElementById('root')!).render(<StrictMode><App transport={transport} onReset={transport instanceof DemoAdapter?transport.reset:undefined} onResync={transport instanceof HttpTransport?transport.resync:undefined}/></StrictMode>);
