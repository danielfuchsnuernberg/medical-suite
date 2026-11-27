// The program window (Electron). The screens run with no access to the computer (sandbox, no Node),
// and the window never navigates away from the program's own files.
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

if (!app.requestSingleInstanceLock()) { app.quit(); }

function createWindow() {
  const win = new BrowserWindow({
    width: 1240, height: 820, minWidth: 360, minHeight: 560,
    title: "REACH Medical Suite",
    backgroundColor: "#F4F4F6",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.once("ready-to-show", () => win.show());
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  return win;
}

app.on("second-instance", () => {
  const [w] = BrowserWindow.getAllWindows();
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
