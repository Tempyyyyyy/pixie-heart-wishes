const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  launchMinecraft: (opts) => ipcRenderer.invoke('launch-minecraft', opts),
  installMrpack: (opts) => ipcRenderer.invoke('install-mrpack', opts),
  downloadMod: (opts) => ipcRenderer.invoke('download-mod', opts),
  onLaunchLog: (cb) => {
    const listener = (_e, msg) => cb(msg);
    ipcRenderer.on('launch-log', listener);
    return () => ipcRenderer.removeListener('launch-log', listener);
  },
  onSessionEnded: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('mc-session-ended', listener);
    return () => ipcRenderer.removeListener('mc-session-ended', listener);
  },
});
