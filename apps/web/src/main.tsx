import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { text as t } from './text.ts';
import { HttpTransport } from './transport/http.ts';
import { App } from './App.tsx';
import './styles.css';
document.title=t.pageTitle;
let token=location.hash.slice(1);
try{token=token || sessionStorage.getItem('cue-remote-token') || '';if(token)sessionStorage.setItem('cue-remote-token',token);}catch{/* private browsing can disable storage */}
const transport=new HttpTransport(token);
history.replaceState(null,'',location.pathname);
createRoot(document.getElementById('root')!).render(<StrictMode><App transport={transport} onResync={transport.resync}/></StrictMode>);
