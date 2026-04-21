const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const https = require('https');

// URL опубликованного лаунчера. Если ещё не опубликован — fallback на preview.
const LAUNCHER_URL =
  process.env.LAUNCHER_URL ||
  'https://pixie-heart-wishes.lovable.app';

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
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
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

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    if (code === -3) return;
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

// ========== Minecraft launcher (тестовая интеграция, vanilla offline) ==========

const MC_DIR = path.join(app.getPath('userData'), 'minecraft');

function log(msg) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('launch-log', msg);
  }
  console.log('[mc]', msg);
}

function downloadJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadJson(res.headers.location));
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs.unlinkSync(dest);
        return resolve(downloadFile(res.headers.location, dest));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => { fs.unlink(dest, () => reject(err)); });
  });
}

function checkJava() {
  return new Promise((resolve) => {
    exec('java -version', (err, _stdout, stderr) => {
      if (err) return resolve(null);
      const m = (stderr || '').match(/version "([^"]+)"/);
      resolve(m ? m[1] : 'unknown');
    });
  });
}

ipcMain.handle('launch-minecraft', async (_e, opts = {}) => {
  const username = (opts.username || 'PixieTester').replace(/[^A-Za-z0-9_]/g, '').slice(0, 16) || 'PixieTester';
  const targetVersion = opts.version || '1.20.1';

  try {
    log(`▶ Запуск Minecraft ${targetVersion} для ${username}`);

    const javaVer = await checkJava();
    if (!javaVer) {
      const msg = 'Java не найдена. Установите Java 17+ (https://adoptium.net) и перезапустите.';
      log('✖ ' + msg);
      return { ok: false, error: msg };
    }
    log(`✓ Java: ${javaVer}`);

    log('⇣ Загружаю Mojang version manifest…');
    const manifest = await downloadJson('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    const ver = manifest.versions.find((v) => v.id === targetVersion);
    if (!ver) {
      const msg = `Версия ${targetVersion} не найдена в манифесте Mojang.`;
      log('✖ ' + msg);
      return { ok: false, error: msg };
    }

    const versionDir = path.join(MC_DIR, 'versions', targetVersion);
    const versionJsonPath = path.join(versionDir, `${targetVersion}.json`);
    let versionJson;
    if (fs.existsSync(versionJsonPath)) {
      versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    } else {
      log('⇣ Загружаю описание версии…');
      versionJson = await downloadJson(ver.url);
      fs.mkdirSync(versionDir, { recursive: true });
      fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson));
    }

    const clientJar = path.join(versionDir, `${targetVersion}.jar`);
    if (!fs.existsSync(clientJar)) {
      log('⇣ Загружаю client.jar (~25 MB)…');
      await downloadFile(versionJson.downloads.client.url, clientJar);
    }

    // Библиотеки (упрощённо: качаем все artifact'ы без natives-классификаторов)
    const libsDir = path.join(MC_DIR, 'libraries');
    const libPaths = [];
    log('⇣ Загружаю библиотеки…');
    for (const lib of versionJson.libraries) {
      const art = lib.downloads && lib.downloads.artifact;
      if (!art || !art.path) continue;
      const dest = path.join(libsDir, art.path);
      if (!fs.existsSync(dest)) {
        try { await downloadFile(art.url, dest); } catch (e) { log('⚠ ' + art.path + ': ' + e.message); }
      }
      libPaths.push(dest);
    }
    log(`✓ Библиотек: ${libPaths.length}`);

    // Ассеты — пропускаем для скорости теста (Minecraft запустится, но без звуков)
    const assetsDir = path.join(MC_DIR, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    // Classpath
    const sep = process.platform === 'win32' ? ';' : ':';
    const classpath = [...libPaths, clientJar].join(sep);

    const mainClass = versionJson.mainClass || 'net.minecraft.client.main.Main';

    const args = [
      '-Xmx2G',
      '-Xms512M',
      `-Djava.library.path=${path.join(versionDir, 'natives')}`,
      '-cp', classpath,
      mainClass,
      '--username', username,
      '--version', targetVersion,
      '--gameDir', MC_DIR,
      '--assetsDir', assetsDir,
      '--assetIndex', (versionJson.assetIndex && versionJson.assetIndex.id) || targetVersion,
      '--uuid', '00000000-0000-0000-0000-000000000000',
      '--accessToken', '0',
      '--userType', 'legacy',
      '--versionType', 'release',
    ];

    log('▶ Запускаю Java…');
    const child = spawn('java', args, { cwd: MC_DIR, detached: false });

    child.stdout.on('data', (d) => log(d.toString().trim()));
    child.stderr.on('data', (d) => log(d.toString().trim()));
    child.on('exit', (code) => log(`◼ Minecraft завершился (код ${code})`));
    child.on('error', (err) => log('✖ ' + err.message));

    return { ok: true, message: 'Minecraft запускается…' };
  } catch (e) {
    log('✖ Ошибка: ' + e.message);
    return { ok: false, error: e.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
