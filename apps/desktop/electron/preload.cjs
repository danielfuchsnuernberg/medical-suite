// What the screens get: which platform, whether this is a program test, and the backups folder (F13.1; main.cjs checks every name).
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("md", { platform: process.platform, test: process.argv.includes("--md-test"), testOffline: process.argv.includes("--md-test-offline"), testEmpty: process.argv.includes("--md-test-empty"),
  // F13.1: the backups folder on this computer (main.cjs checks every name)
  backups: { list: () => ipcRenderer.invoke("backups:list"), save: (name, text) => ipcRenderer.invoke("backups:save", name, text), read: (name) => ipcRenderer.invoke("backups:read", name) } });
