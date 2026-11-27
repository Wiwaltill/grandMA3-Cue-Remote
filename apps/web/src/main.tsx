import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { text as t } from './text.ts';
import { HttpTransport } from './transport/http.ts';
import { App } from './App.tsx';
import './styles.css';
document.title=t.pageTitle;
try{sessionStorage.removeItem('cue-remote-token');}catch{/* private browsing can disable storage */}
const transport=new HttpTransport();
history.replaceState(null,'',location.pathname+location.search);
createRoot(document.getElementById('root')!).render(<StrictMode><App transport={transport} onResync={transport.resync}/></StrictMode>);
