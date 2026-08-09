const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexusDesktop', {
  platform: process.platform,
  isElectron: true,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onNotification: (callback) => {
    ipcRenderer.on('show-notification', (event, data) => callback(data));
  },
});
