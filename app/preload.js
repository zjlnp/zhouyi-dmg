const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zhouyiAPI', {
  getHexagram: (id) => ipcRenderer.invoke('get-hexagram', id),
  getAllHexagrams: () => ipcRenderer.invoke('get-all-hexagrams'),
  getBagua: () => ipcRenderer.invoke('get-bagua'),
  getZhuxiRules: () => ipcRenderer.invoke('get-zhuxi-rules'),
  divinate: (lines) => ipcRenderer.invoke('divinate', lines),
  clearCache: () => ipcRenderer.invoke('clear-cache')
});
