const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tpAPI', {
  loadData:       ()               => ipcRenderer.invoke('load-data'),
  saveData:       (data)           => ipcRenderer.invoke('save-data', data),
  savePDF:        (filename, b64)  => ipcRenderer.invoke('save-pdf', { filename, pdfBase64: b64 }),
  openDataFolder: ()               => ipcRenderer.invoke('open-data-folder'),
  getDataPath:    ()               => ipcRenderer.invoke('get-data-path'),
});
