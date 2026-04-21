const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const dataDir = path.join(os.homedir(), 'Documents', 'TradePilot');
const dataFile = path.join(dataDir, 'data.json');
const pdfDir = path.join(dataDir, 'PDFs');

function ensureDirs() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
}

let mainWindow;

function refocus() {
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.focus();
    }
  }, 150);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "TradePilot",
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    },
    backgroundColor: '#f8f8f6'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setMenuBarVisibility(false);

  // Fix focus on load
  mainWindow.webContents.on('did-finish-load', refocus);

  // Fix focus lost when resizing, maximizing, fullscreen toggling
  mainWindow.on('enter-full-screen', refocus);
  mainWindow.on('leave-full-screen', refocus);
  mainWindow.on('maximize', refocus);
  mainWindow.on('unmaximize', refocus);
  mainWindow.on('restore', refocus);
  mainWindow.on('focus', refocus);
  mainWindow.on('resize', refocus);
}

app.whenReady().then(() => {
  ensureDirs();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('load-data', () => {
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8');
      return { ok: true, data: JSON.parse(raw) };
    }
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('save-data', (event, data) => {
  try {
    ensureDirs();
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
    return { ok: true, path: dataFile };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('save-pdf', async (event, { filename, pdfBase64 }) => {
  try {
    ensureDirs();
    const defaultPath = path.join(pdfDir, filename);
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      title: 'Save PDF'
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    const buf = Buffer.from(pdfBase64, 'base64');
    fs.writeFileSync(filePath, buf);
    shell.showItemInFolder(filePath);
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('open-data-folder', () => {
  shell.openPath(dataDir);
  return { ok: true };
});

ipcMain.handle('get-data-path', () => {
  return { path: dataFile };
});
