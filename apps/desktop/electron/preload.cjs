// Only two plain facts are handed to the screens: which platform, and whether this is a program test.
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("md", { platform: process.platform, test: process.argv.includes("--md-test"), testOffline: process.argv.includes("--md-test-offline") });
