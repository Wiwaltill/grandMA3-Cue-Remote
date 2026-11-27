import { contextBridge, ipcRenderer } from 'electron';
// One fixed method per action; no generic channel or shell access is exposed.
contextBridge.exposeInMainWorld('desktop', {
  getStatus: () => ipcRenderer.invoke('server:get'),
  start: (config: unknown) => ipcRenderer.invoke('server:start',config),
  stop: () => ipcRenderer.invoke('server:stop'),
  getLive: () => ipcRenderer.invoke('osc:get'),
  getAddresses: () => ipcRenderer.invoke('osc:addresses'),
  connectOsc: (config: unknown) => ipcRenderer.invoke('osc:connect',config),
  disconnectOsc: () => ipcRenderer.invoke('osc:disconnect'),
  openWeb: () => ipcRenderer.invoke('server:open-web'),
  onStatus: (listener: (status: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent,status: unknown) => listener(status);
    ipcRenderer.on('server:status',handler);
    return () => { ipcRenderer.removeListener('server:status',handler); };
  },
});
