"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", {
      ...preload.electronAPI,
      ipcRenderer: {
        ...preload.electronAPI.ipcRenderer,
        invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args)
      }
    });
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
  }
} else {
  window.electron = {
    ...preload.electronAPI,
    ipcRenderer: {
      ...preload.electronAPI.ipcRenderer,
      invoke: electron.ipcRenderer.invoke.bind(electron.ipcRenderer)
    }
  };
  window.api = api;
}
