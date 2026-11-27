// The program window (Electron). The screens run with no access to the computer (sandbox, no Node),
// and the window never navigates away from the program's own files.
const { app, BrowserWindow, shell, dialog } = require("electron");
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
    title: "REACH Medical Suite",
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

app.on("second-instance", () => {
  const [w] = BrowserWindow.getAllWindows();
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
