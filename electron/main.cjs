const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// URL опубликованного лаунчера. Если ещё не опубликован — fallback на preview.
const LAUNCHER_URL =
  process.env.LAUNCHER_URL ||
  'https://id-preview--16669cf3-880b-4775-8390-015a4bd28f59.lovable.app';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0a0b',
    title: 'Pixiestape Launcher',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(LAUNCHER_URL);

  // Внешние ссылки открываем в системном браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    const current = new URL(LAUNCHER_URL);
    if (target.host !== current.host) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Если страница не загрузилась (нет интернета) — показываем сообщение
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    if (code === -3) return; // отменённая навигация
    mainWindow.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(`
        <html><head><title>Pixiestape Launcher</title>
        <style>
          body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
               background:#0a0a0b;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px;}
          h1{color:#dc2626;margin:0 0 12px;font-size:28px;}
          p{color:#a1a1aa;margin:6px 0;}
          button{margin-top:20px;padding:10px 24px;border:0;border-radius:999px;
                 background:#dc2626;color:#fff;font-weight:600;cursor:pointer;font-size:14px;}
        </style></head>
        <body><div>
          <h1>Не удалось подключиться</h1>
          <p>Проверьте интернет-соединение.</p>
          <p style="opacity:.6;font-size:12px;">${desc}</p>
          <button onclick="location.href='${LAUNCHER_URL}'">Повторить</button>
        </div></body></html>`)
    );
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
