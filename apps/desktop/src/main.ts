import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DemoServer } from './server.js';

let window: BrowserWindow | null = null;
let demoServer: DemoServer;
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();
else {
  app.on('second-instance',() => { if (window?.isMinimized()) window.restore(); window?.show(); window?.focus(); });
  void app.whenReady().then(async () => {
    const root = app.getAppPath();
    const launcherPath = join(root,'dist/apps/desktop/index.html');
    const launcherUrl = pathToFileURL(launcherPath).href;
    demoServer = new DemoServer(join(root,'dist'),status => {
      if (window && !window.isDestroyed()) window.webContents.send('server:status',status);
    });
    const authorized = (event: Electron.IpcMainInvokeEvent) => {
      if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || event.senderFrame.url !== launcherUrl) throw new Error('Unauthorized IPC');
    };
    ipcMain.handle('server:get',event => { authorized(event); return demoServer.getStatus(); });
    ipcMain.handle('server:start',(event,config: unknown) => { authorized(event); return demoServer.start(config); });
    ipcMain.handle('server:stop',event => { authorized(event); return demoServer.stop(); });
    ipcMain.handle('server:open',async event => {
      authorized(event);
      const status = demoServer.getStatus();
      if (status.phase === 'running' && status.port) await shell.openExternal(`http://127.0.0.1:${status.port}`);
    });
    const createWindow = async () => {
      window = new BrowserWindow({width:760,height:780,minWidth:620,minHeight:680,title:'MA3 Cue Remote · Server',backgroundColor:'#101416',webPreferences:{preload:join(root,'dist-desktop/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
      window.webContents.setWindowOpenHandler(() => ({action:'deny'}));
      window.webContents.on('will-navigate',event => event.preventDefault());
      window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback) => callback(false));
      window.on('closed',() => { window = null; });
      await window.loadFile(launcherPath);
    };
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {label:'MA3 Cue Remote',submenu:[{role:'about'},{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},{role:'quit'}]},
      {label:'Bearbeiten',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
      {label:'Fenster',submenu:[{role:'minimize'},{role:'close'}]},
    ]));
    await createWindow();
    app.on('activate',() => { if (!window) void createWindow(); });
  });
  // Server is in this process: closing the app cannot leave an orphaned child server.
  app.on('window-all-closed',() => app.quit());
  let quitting = false;
  app.on('before-quit',event => {
    if (quitting || !demoServer) return;
    event.preventDefault(); quitting = true;
    void demoServer.stop().finally(() => app.quit());
  });
}
