const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  launchMinecraft: (opts) => ipcRenderer.invoke('launch-minecraft', opts),
  installMrpack: (opts) => ipcRenderer.invoke('install-mrpack', opts),
  installLocalMrpack: (opts) => ipcRenderer.invoke('install-local-mrpack', opts),
  downloadMod: (opts) => ipcRenderer.invoke('download-mod', opts),
  uploadModFile: (opts) => ipcRenderer.invoke('upload-mod-file', opts),
  pickFile: (opts) => ipcRenderer.invoke('pick-file', opts),
  loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
  stopMinecraft: (instanceId) => ipcRenderer.invoke('stop-minecraft', instanceId),
  onLaunchLog: (cb) => {
    const listener = (_e, msg) => cb(msg);
    ipcRenderer.on('launch-log', listener);
    return () => ipcRenderer.removeListener('launch-log', listener);
  },
  onSessionStarted: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('mc-session-started', listener);
    return () => ipcRenderer.removeListener('mc-session-started', listener);
  },
  onSessionEnded: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('mc-session-ended', listener);
    return () => ipcRenderer.removeListener('mc-session-ended', listener);
  },
});
