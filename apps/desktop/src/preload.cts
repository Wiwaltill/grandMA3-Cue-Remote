import { contextBridge, ipcRenderer } from 'electron';
// One fixed method per action; no generic channel or shell access is exposed.
contextBridge.exposeInMainWorld('desktop', {
  getStatus: () => ipcRenderer.invoke('server:get'),
  start: (config: unknown) => ipcRenderer.invoke('server:start',config),
  stop: () => ipcRenderer.invoke('server:stop'),
  openDemo: () => ipcRenderer.invoke('server:open'),
  onStatus: (listener: (status: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent,status: unknown) => listener(status);
    ipcRenderer.on('server:status',handler);
    return () => { ipcRenderer.removeListener('server:status',handler); };
  },
});
