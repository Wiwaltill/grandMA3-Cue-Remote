import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoAdapter } from '../../../packages/demo/adapter.ts';
import { App } from './App.tsx';
import './styles.css';
const adapter = new DemoAdapter();
createRoot(document.getElementById('root')!).render(<StrictMode><App transport={adapter} onReset={adapter.reset}/></StrictMode>);
