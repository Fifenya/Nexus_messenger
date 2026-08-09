const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Отключаем аппаратное ускорение на Linux (частая проблема с WebGL)
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

let mainWindow;
let tray;

const isDev = !app.isPackaged;
const FRONTEND_PATH = isDev
  ? 'http://localhost:5173'
  : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Nexus',
    icon: path.join(__dirname, 'assets/icon.png'),
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false, // показываем после готовности, чтобы избежать "белого экрана"
  });

  mainWindow.loadURL(FRONTEND_PATH);

  // Открываем внешние ссылки в браузере по умолчанию
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Показать Nexus', click: () => mainWindow && mainWindow.show() },
    { label: 'Выход', click: () => app.quit() },
  ]);
  tray.setToolTip('Nexus Messenger');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow && mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Автообновления только в production
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Обработка обновлений
autoUpdater.on('update-available', () => {
  console.log('Доступно обновление Nexus');
});

autoUpdater.on('update-downloaded', () => {
  console.log('Обновление загружено, перезапускаем...');
  autoUpdater.quitAndInstall();
});
