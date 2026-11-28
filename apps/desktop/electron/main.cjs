// The program window (Electron). The screens run with no access to the computer (sandbox, no Node),
// and the window never navigates away from the program's own files.
const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

// Test mode (program tests only): MD_TEST=1 gives the screens a stand-in server and test controls.
// It is never set when Danny or the nurses start the program.
const TEST = process.env.MD_TEST === "1";
// A separate data folder (used by program tests, so they never touch the data of a program someone has open).
if (process.env.MD_USER_DATA) app.setPath("userData", process.env.MD_USER_DATA);

if (!app.requestSingleInstanceLock()) { app.quit(); }

function createWindow() {
  const win = new BrowserWindow({
    width: 1240, height: 820, minWidth: 360, minHeight: 560,
    title: "REACH Medical Suite",   // until the page loads; then the name from Settings (B61) via document.title
    backgroundColor: "#F4F4F6",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      additionalArguments: TEST ? ["--md-test", ...(process.env.MD_TEST_OFFLINE === "1" ? ["--md-test-offline"] : []), ...(process.env.MD_TEST_EMPTY === "1" ? ["--md-test-empty"] : [])] : [],
    },
  });
  win.once("ready-to-show", () => win.show());
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  // Saving a file the program made (F7 CSV): the computer asks where, with its own Save window.
  // In test mode it goes into the test data folder instead, so tests can read it back.
  win.webContents.session.on("will-download", (_e, item) => {
    if (TEST) { const dir = path.join(app.getPath("userData"), "downloads"); require("fs").mkdirSync(dir, { recursive: true }); item.setSavePath(path.join(dir, item.getFilename())); }
  });
  // F10.2: closing the program with counts typed but not saved asks first (the screen marks that it has some).
  win.webContents.on("will-prevent-unload", (e) => {
    const choice = dialog.showMessageBoxSync(win, { type: "question", buttons: ["Keep counting", "Close and throw them away"], defaultId: 0, cancelId: 0,
      message: "Counts not saved yet", detail: "You typed counts that aren't saved yet. Keep counting, then press Save counts." });
    if (choice === 1) e.preventDefault();   // close anyway
  });
  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  return win;
}

// F13.1: backups on this computer (until the server keeps them): the program's backups folder, the last 30 nightly ones kept.
// Only names the program makes are accepted, so nothing outside the folder can be read or written.
const BACKUP_NAME = /^medical-suite-backup-\d{4}-\d{2}-\d{2}(-before-restore-\d{6}(-\d{1,3})?)?\.json$/;   // B30: -2, -3 … never overwrite
const NIGHTLY = /^medical-suite-backup-\d{4}-\d{2}-\d{2}\.json$/;
const backupDir = () => { const d = path.join(app.getPath("userData"), "backups"); fs.mkdirSync(d, { recursive: true }); return d; };
ipcMain.handle("backups:list", () => fs.readdirSync(backupDir()).filter(n => BACKUP_NAME.test(n)).sort().reverse().map(name => ({ name, size: fs.statSync(path.join(backupDir(), name)).size })));
ipcMain.handle("backups:save", (_e, name, text) => {
  if (!BACKUP_NAME.test(String(name)) || typeof text !== "string") throw new Error("Not a backup name.");
  const tmp = path.join(backupDir(), name + ".part");
  fs.writeFileSync(tmp, text); fs.renameSync(tmp, path.join(backupDir(), name));          // never a half-written backup
  const nightly = fs.readdirSync(backupDir()).filter(n => NIGHTLY.test(n)).sort().reverse();
  for (const n of nightly.slice(30)) fs.unlinkSync(path.join(backupDir(), n));
});
ipcMain.handle("backups:read", (_e, name) => {
  if (!BACKUP_NAME.test(String(name))) throw new Error("Not a backup name.");
  return fs.readFileSync(path.join(backupDir(), name), "utf8");
});

app.on("second-instance", () => {
  const [w] = BrowserWindow.getAllWindows();
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
