// Nothing from the computer is handed to the screens yet. The store door (F3) will add a narrow bridge here.
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("md", { platform: process.platform });
