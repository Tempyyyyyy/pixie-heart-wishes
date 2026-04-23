const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const DiscordRPC = require('discord-rpc');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');
const os = require('os');

// ============================================================
//  Pixiestape Launcher — Electron main process
// ============================================================

const LAUNCHER_URL = process.env.LAUNCHER_URL || null;

let mainWindow = null;
const activeProcesses = new Map();

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
  
  if (LAUNCHER_URL) {
    mainWindow.loadURL(LAUNCHER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (LAUNCHER_URL) {
      const target = new URL(url);
      const current = new URL(LAUNCHER_URL);
      if (target.host !== current.host) {
        event.preventDefault();
        shell.openExternal(url);
      }
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
          <button onclick="location.reload()">Повторить</button>
        </div></body></html>`)
    );
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

const MC_DIR = path.join(app.getPath('userData'), 'minecraft');
const INSTANCES_DIR = path.join(MC_DIR, 'instances');

function log(msg) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('launch-log', msg);
  }
  console.log('[mc]', msg);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'PixiestapeLauncher/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpGet(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      resolve(res);
    }).on('error', reject);
  });
}

async function downloadJson(url) {
  const res = await httpGet(url);
  let data = '';
  for await (const chunk of res) data += chunk;
  return JSON.parse(data);
}

async function downloadFile(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await httpGet(url);
  const file = fs.createWriteStream(dest);
  await pipeline(res, file);
}

async function downloadFileWithSha1(url, dest, expectedSha1) {
  if (fs.existsSync(dest) && expectedSha1) {
    const hash = crypto.createHash('sha1').update(fs.readFileSync(dest)).digest('hex');
    if (hash === expectedSha1) return;
  }
  await downloadFile(url, dest);
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

function isLibraryAllowed(lib) {
  if (!lib.rules) return true;
  let allowed = false;
  const platform =
    process.platform === 'win32' ? 'windows' :
    process.platform === 'darwin' ? 'osx' : 'linux';
  const arch = process.arch === 'x64' ? 'x64' : 'x86';

  // Жесткий фильтр по имени: если мы на x64, игнорируем всё, что явно помечено как x86/i386 или ARM
  if (arch === 'x64') {
    const name = lib.name || "";
    const isArm = name.includes('arm') || name.includes('aarch64');
    const isX86 = (name.includes('x86') || name.includes('i386') || name.includes('32')) && !name.includes('x86_64');
    
    if (isArm || isX86) {
      return false;
    }
  }

  for (const rule of lib.rules) {
    const matchesOs = !rule.os || rule.os.name === platform;
    // Если в правиле указана архитектура, и она не совпадает с нашей - отсекаем
    const matchesArch = !rule.os || !rule.os.arch || rule.os.arch === (arch === 'x64' ? 'x86_64' : 'x86');
    
    if (matchesOs && matchesArch) {
      allowed = rule.action === 'allow';
    }
  }
  return allowed;
}

function getNativeClassifier(lib) {
  const platform =
    process.platform === 'win32' ? 'windows' :
    process.platform === 'darwin' ? 'osx' : 'linux';
  const arch = process.arch === 'x64' ? 'x64' : 'x86';
    
  if (lib.natives) {
    let cls = lib.natives[platform];
    if (!cls) return null;
    return cls.replace('${arch}', process.arch === 'x64' ? '64' : '32');
  }
  
  if (lib.downloads && lib.downloads.classifiers) {
    const cls = lib.downloads.classifiers;
    if (platform === 'windows') {
      if (arch === 'x64') {
        // Жесткий приоритет 64-битным версиям
        if (cls['natives-windows-x86_64']) return 'natives-windows-x86_64';
        if (cls['natives-windows-64']) return 'natives-windows-64';
        if (cls['natives-windows-x64']) return 'natives-windows-x64';
      }
      return cls['natives-windows'] ? 'natives-windows' : null;
    }
    // ... остальное для других ОС по аналогии, если нужно ...
    if (platform === 'osx') {
      if (arch === 'x64' && cls['natives-macos-x86_64']) return 'natives-macos-x86_64';
      return cls['natives-macos'] ? 'natives-macos' : null;
    }
    if (platform === 'linux') {
      if (arch === 'x64' && cls['natives-linux-x86_64']) return 'natives-linux-x86_64';
      return cls['natives-linux'] ? 'natives-linux' : null;
    }
  }
  return null;
}

function mavenToPath(coord) {
  const [g, a, v] = coord.split(':');
  return path.join(...g.split('.'), a, v, `${a}-${v}.jar`);
}

function mavenToUrl(baseUrl, coord) {
  const [g, a, v] = coord.split(':');
  return `${baseUrl.replace(/\/$/, '')}/${g.split('.').join('/')}/${a}/${v}/${a}-${v}.jar`;
}

let _manifestCache = null;
async function getMojangManifest() {
  if (_manifestCache) return _manifestCache;
  _manifestCache = await downloadJson('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
  return _manifestCache;
}

async function ensureVanillaVersion(version) {
  const manifest = await getMojangManifest();
  const ver = manifest.versions.find(v => v.id === version);
  if (!ver) throw new Error(`Версия ${version} не найдена в манифесте Mojang`);

  const versionDir = path.join(MC_DIR, 'versions', version);
  const versionJsonPath = path.join(versionDir, `${version}.json`);
  let versionJson;
  if (fs.existsSync(versionJsonPath)) {
    versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  } else {
    log(`⇣ Метаданные ${version}…`);
    versionJson = await downloadJson(ver.url);
    fs.mkdirSync(versionDir, { recursive: true });
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson));
  }

  const clientJar = path.join(versionDir, `${version}.jar`);
  if (!fs.existsSync(clientJar)) {
    log(`⇣ client.jar ${version}…`);
    await downloadFileWithSha1(versionJson.downloads.client.url, clientJar, versionJson.downloads.client.sha1);
  }

  const libsDir = path.join(MC_DIR, 'libraries');
  const libPaths = [];
  const nativesDir = path.join(versionDir, 'natives');
  if (fs.existsSync(nativesDir)) {
    try { fs.rmSync(nativesDir, { recursive: true, force: true }); } catch(e){}
  }
  fs.mkdirSync(nativesDir, { recursive: true });

  log(`⇣ Библиотеки vanilla…`);
  // Дебаг Java
  try {
    const javaArch = execSync('java -XshowSettings:properties -version 2>&1').toString();
    console.log("[DRP] Java Environment Details:", javaArch.split('\n').filter(l => l.includes('os.arch') || l.includes('sun.arch.data.model')).join(' | '));
  } catch(e) {}

  for (const lib of versionJson.libraries) {
    if (!isLibraryAllowed(lib)) continue;
    const downloads = lib.downloads || {};
    
    // Проверяем, является ли эта библиотека сама по себе нативной (по имени)
    const isNativeLib = lib.name && lib.name.includes(':natives-');
    
    // Основной артефакт
    if (downloads.artifact && downloads.artifact.path) {
      const dest = path.join(libsDir, downloads.artifact.path);
      await downloadFileWithSha1(downloads.artifact.url, dest, downloads.artifact.sha1).catch(e => log('⚠ ' + e.message));
      libPaths.push(dest);
      
      // Если это нативная либа, распаковываем её
      if (isNativeLib) {
        console.log(`[DRP] Extracting native artifact: ${lib.name}`);
        try {
          await extractNativesToDir(dest, nativesDir);
        } catch (e) { log('⚠ unpack native artifact ' + e.message); }
      }
    }
    
    // Нативные классификаторы (старый формат или дополнения)
    const nativeCls = getNativeClassifier(lib);
    if (nativeCls && downloads.classifiers && downloads.classifiers[nativeCls]) {
      const nat = downloads.classifiers[nativeCls];
      console.log(`[DRP] Choosing native ${nativeCls} for ${lib.name}`);
      const dest = path.join(libsDir, nat.path);
      await downloadFileWithSha1(nat.url, dest, nat.sha1).catch(e => log('⚠ native ' + e.message));
      try {
        await extractNativesToDir(dest, nativesDir);
      } catch (e) { log('⚠ unpack classifier ' + e.message); }
      libPaths.push(dest);
    }
  }

  return { versionJson, clientJar, libPaths, nativesDir, versionDir };
}

async function extractNativesToDir(jarPath, outDir) {
  console.log(`[DRP] EXTRACTING FROM: ${jarPath}`);
  const buf = fs.readFileSync(jarPath);
  const eocdSig = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === eocdSig) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Bad ZIP: EOCD not found');
  const cdOff = buf.readUInt32LE(eocd + 16);
  const totalEntries = buf.readUInt16LE(eocd + 10);
  let p = cdOff;
  const zlib = require('zlib');
  for (let i = 0; i < totalEntries; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Bad CD entry');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const uncompSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith('/')) continue;
    if (name.startsWith('META-INF/')) continue;
    if (!/\.(dll|so|dylib|jnilib)$/i.test(name)) continue;

    const localNameLen = buf.readUInt16LE(localOff + 26);
    const localExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + localNameLen + localExtraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    let out;
    if (method === 0) out = data;
    else if (method === 8) out = zlib.inflateRawSync(data);
    else continue;
    const outPath = path.join(outDir, path.basename(name));
    fs.writeFileSync(outPath, out);
  }
}

async function ensureAssets(versionJson) {
  const assetsDir = path.join(MC_DIR, 'assets');
  const indexesDir = path.join(assetsDir, 'indexes');
  const objectsDir = path.join(assetsDir, 'objects');
  fs.mkdirSync(indexesDir, { recursive: true });
  fs.mkdirSync(objectsDir, { recursive: true });

  const ai = versionJson.assetIndex;
  if (!ai) return assetsDir;
  const indexPath = path.join(indexesDir, `${ai.id}.json`);
  let index;
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } else {
    log(`⇣ Индекс ассетов ${ai.id}…`);
    index = await downloadJson(ai.url);
    fs.writeFileSync(indexPath, JSON.stringify(index));
  }

  const entries = Object.entries(index.objects || {});
  log(`⇣ Ассеты (звуки/шрифты): ${entries.length} файлов…`);
  let done = 0, skipped = 0;
  // Параллелизация по 8 потоков для ускорения
  const queue = [...entries];
  async function worker() {
    while (queue.length) {
      const [, obj] = queue.shift();
      const hash = obj.hash;
      const sub = hash.slice(0, 2);
      const dest = path.join(objectsDir, sub, hash);
      if (fs.existsSync(dest)) { skipped++; continue; }
      try { await downloadFile(`https://resources.download.minecraft.net/${sub}/${hash}`, dest); done++; }
      catch (e) { /* ignore */ }
      if ((done + skipped) % 300 === 0) log(`  …${done + skipped}/${entries.length}`);
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => worker()));
  log(`✓ Ассеты: новых ${done}, кэш ${skipped}`);
  return assetsDir;
}

async function ensureFabric(mcVersion, loaderVersionOpt) {
  let loaderVersion = loaderVersionOpt;
  if (!loaderVersion) {
    const loaders = await downloadJson(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`);
    if (!loaders.length) throw new Error(`Fabric не поддерживает ${mcVersion}`);
    loaderVersion = loaders[0].loader.version;
  }
  log(`✓ Fabric loader ${loaderVersion}`);

  const profile = await downloadJson(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/profile/json`);

  const libsDir = path.join(MC_DIR, 'libraries');
  const libPaths = [];
  log(`⇣ Библиотеки Fabric (${profile.libraries.length})…`);
  for (const lib of profile.libraries) {
    const relPath = mavenToPath(lib.name);
    const dest = path.join(libsDir, relPath);
    const url = mavenToUrl(lib.url || 'https://maven.fabricmc.net/', lib.name);
    if (!fs.existsSync(dest)) {
      try { await downloadFile(url, dest); }
      catch (e) {
        try { await downloadFile(mavenToUrl('https://repo1.maven.org/maven2/', lib.name), dest); }
        catch (e2) { log('⚠ ' + lib.name + ': ' + e2.message); continue; }
      }
    }
    libPaths.push(dest);
  }

  return { mainClass: profile.mainClass, libPaths, loaderVersion };
}

async function ensureForge(mcVersion, loaderVersionOpt) {
  let forgeVersion = loaderVersionOpt;
  if (!forgeVersion) {
    const promos = await downloadJson('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
    forgeVersion = promos.promos[`${mcVersion}-recommended`] || promos.promos[`${mcVersion}-latest`];
    if (!forgeVersion) throw new Error(`Forge не имеет рекомендованной версии для ${mcVersion}.`);
  }
  log(`✓ Forge ${forgeVersion}`);

  const fullVersion = `${mcVersion}-${forgeVersion}`;
  const versionDir = path.join(MC_DIR, 'versions', `forge-${fullVersion}`);
  const versionJsonPath = path.join(versionDir, 'version.json');

  if (!fs.existsSync(versionJsonPath)) {
    log(`⇣ Forge installer (~5 MB)…`);
    const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${fullVersion}/forge-${fullVersion}-installer.jar`;
    const installerPath = path.join(versionDir, 'installer.jar');
    await downloadFile(installerUrl, installerPath);
    log(`⇣ Распаковка профиля…`);
    extractFileFromZip(installerPath, 'version.json', versionJsonPath);
  }

  const profile = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));

  const libsDir = path.join(MC_DIR, 'libraries');
  const libPaths = [];
  log(`⇣ Библиотеки Forge (${profile.libraries.length})…`);
  for (const lib of profile.libraries) {
    const downloads = lib.downloads;
    if (!downloads || !downloads.artifact || !downloads.artifact.path) continue;
    const dest = path.join(libsDir, downloads.artifact.path);
    if (!fs.existsSync(dest) && downloads.artifact.url) {
      try { await downloadFile(downloads.artifact.url, dest); }
      catch (e) { log('⚠ ' + lib.name + ': ' + e.message); continue; }
    }
    if (fs.existsSync(dest)) libPaths.push(dest);
  }

  return { mainClass: profile.mainClass, libPaths, args: profile.arguments, loaderVersion: forgeVersion };
}

function extractFileFromZip(jarPath, fileName, outPath) {
  const buf = fs.readFileSync(jarPath);
  const eocdSig = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === eocdSig) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP EOCD not found');
  const cdOff = buf.readUInt32LE(eocd + 16);
  const totalEntries = buf.readUInt16LE(eocd + 10);
  let p = cdOff;
  const zlib = require('zlib');
  for (let i = 0; i < totalEntries; i++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;
    if (name === fileName) {
      const localNameLen = buf.readUInt16LE(localOff + 26);
      const localExtraLen = buf.readUInt16LE(localOff + 28);
      const dataStart = localOff + 30 + localNameLen + localExtraLen;
      const data = buf.slice(dataStart, dataStart + compSize);
      const out = method === 8 ? zlib.inflateRawSync(data) : data;
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, out);
      return;
    }
  }
  throw new Error(`File ${fileName} not in ZIP`);
}

function listZipEntries(jarPath) {
  const buf = fs.readFileSync(jarPath);
  const eocdSig = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === eocdSig) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP EOCD not found');
  const cdOff = buf.readUInt32LE(eocd + 16);
  const totalEntries = buf.readUInt16LE(eocd + 10);
  let p = cdOff;
  const zlib = require('zlib');
  const entries = [];
  for (let i = 0; i < totalEntries; i++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;
    entries.push({ name, method, compSize, localOff, _buf: buf, _zlib: zlib });
  }
  return entries;
}

function readZipEntry(entry) {
  const buf = entry._buf;
  const localOff = entry.localOff;
  const localNameLen = buf.readUInt16LE(localOff + 26);
  const localExtraLen = buf.readUInt16LE(localOff + 28);
  const dataStart = localOff + 30 + localNameLen + localExtraLen;
  const data = buf.slice(dataStart, dataStart + entry.compSize);
  return entry.method === 8 ? entry._zlib.inflateRawSync(data) : data;
}

// ============================================================
//  .mrpack installer — теперь возвращает список модов для UI
// ============================================================

ipcMain.handle('install-mrpack', async (_e, opts) => {
  try {
    const { url, instanceId, instanceName } = opts;
    if (!url || !instanceId) return { ok: false, error: 'Нет url или instanceId' };

    log(`▶ Установка модпака: ${instanceName}`);
    const instDir = path.join(INSTANCES_DIR, instanceId);
    const modsDir = path.join(instDir, 'mods');
    fs.mkdirSync(instDir, { recursive: true });
    fs.mkdirSync(modsDir, { recursive: true });

    const mrpackPath = path.join(instDir, 'pack.mrpack');
    log(`⇣ Скачиваю .mrpack…`);
    await downloadFile(url, mrpackPath);

    const entries = listZipEntries(mrpackPath);
    const indexEntry = entries.find(e => e.name === 'modrinth.index.json');
    if (!indexEntry) return { ok: false, error: '.mrpack не содержит modrinth.index.json' };

    const index = JSON.parse(readZipEntry(indexEntry).toString('utf8'));
    log(`✓ Манифест: ${index.name} v${index.versionId}`);

    const mcVersion = index.dependencies['minecraft'];
    let loader = 'fabric';
    let loaderVersion;
    if (index.dependencies['fabric-loader']) {
      loader = 'fabric'; loaderVersion = index.dependencies['fabric-loader'];
    } else if (index.dependencies['forge']) {
      loader = 'forge'; loaderVersion = index.dependencies['forge'];
    } else if (index.dependencies['neoforge']) {
      loader = 'neoforge'; loaderVersion = index.dependencies['neoforge'];
    } else if (index.dependencies['quilt-loader']) {
      loader = 'quilt'; loaderVersion = index.dependencies['quilt-loader'];
    }
    log(`✓ Лоадер: ${loader} ${loaderVersion}, MC ${mcVersion}`);

    log(`⇣ Скачиваю ${index.files.length} файлов мода…`);
    const installedMods = [];
    let done = 0;
    for (const f of index.files) {
      const dest = path.join(instDir, f.path);
      try {
        await downloadFileWithSha1(f.downloads[0], dest, f.hashes && f.hashes.sha1);
        done++;
        // Если это файл из mods/ — добавляем в список модов для БД
        if (f.path.startsWith('mods/')) {
          const fname = path.basename(f.path);
          installedMods.push({
            id: `mrpack:${fname}`,
            slug: fname.replace(/\.jar$/i, ''),
            name: fname.replace(/\.jar$/i, '').replace(/[-_]/g, ' '),
            icon: null,
            file: fname,
            source: 'mrpack',
          });
        }
      } catch (e) {
        log(`⚠ ${f.path}: ${e.message}`);
      }
    }
    log(`✓ Файлов установлено: ${done}/${index.files.length}, модов: ${installedMods.length}`);

    // overrides → копируем в инстанс. Для mods/* добавляем в список тоже.
    for (const e of entries) {
      if (e.name.startsWith('overrides/') || e.name.startsWith('client-overrides/')) {
        if (e.name.endsWith('/')) continue;
        const rel = e.name.replace(/^(client-)?overrides\//, '');
        const out = path.join(instDir, rel);
        try {
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, readZipEntry(e));
          if (rel.startsWith('mods/') && rel.endsWith('.jar')) {
            const fname = path.basename(rel);
            if (!installedMods.find(m => m.file === fname)) {
              installedMods.push({
                id: `override:${fname}`,
                slug: fname.replace(/\.jar$/i, ''),
                name: fname.replace(/\.jar$/i, '').replace(/[-_]/g, ' '),
                icon: null,
                file: fname,
                source: 'override',
              });
            }
          }
        } catch (err) { log('⚠ override ' + rel + ': ' + err.message); }
      }
    }

    return {
      ok: true,
      message: `Установлено ${installedMods.length} модов`,
      mc_version: mcVersion,
      loader,
      loader_version: loaderVersion,
      mods: installedMods,
    };
  } catch (e) {
    log('✖ ' + e.message);
    return { ok: false, error: e.message };
  }
});

// ============================================================
//  Скачать конкретный мод из Modrinth для инстанса
// ============================================================

ipcMain.handle('download-mod', async (_e, opts) => {
  try {
    const { instanceId, projectId, slug, mcVersion, loader } = opts;
    if (!instanceId || !projectId) return { ok: false, error: 'Нет instanceId/projectId' };
    const modsDir = path.join(INSTANCES_DIR, instanceId, 'mods');
    fs.mkdirSync(modsDir, { recursive: true });

    // Получаем версии мода
    const versions = await downloadJson(
      `https://api.modrinth.com/v2/project/${projectId}/version` +
      (mcVersion ? `?game_versions=["${mcVersion}"]` : '')
    );
    // Фильтруем по лоадеру
    let matching = versions;
    if (loader) {
      matching = versions.filter(v => v.loaders.includes(loader));
      if (!matching.length) matching = versions;
    }
    if (!matching.length) return { ok: false, error: 'Нет совместимых версий' };
    const v = matching[0];
    const file = v.files.find(f => f.primary) || v.files[0];
    if (!file) return { ok: false, error: 'Нет файла' };

    const dest = path.join(modsDir, file.filename);
    log(`⇣ ${slug || projectId}: ${file.filename}`);
    await downloadFileWithSha1(file.url, dest, file.hashes && file.hashes.sha1);
    return { ok: true, filename: file.filename, version: v.version_number };
  } catch (e) {
    log('✖ download-mod: ' + e.message);
    return { ok: false, error: e.message };
  }
});

// ============================================================
//  Загрузить свой файл мода в инстанс
// ============================================================

ipcMain.handle('upload-mod-file', async (_e, { instanceId, filePath }) => {
  try {
    if (!instanceId || !filePath) return { ok: false, error: 'Нет instanceId/filePath' };
    const ext = path.extname(filePath).toLowerCase();
    
    // Детекция папки
    let folder = 'mods';
    if (ext === '.zip') {
      // Если в названии есть "shader" или это зипка не с модом - кладем в шейдеры/ресурсы
      // Но проще всего спросить или просто класть в resourcepacks
      folder = 'resourcepacks';
      if (path.basename(filePath).toLowerCase().includes('shader')) folder = 'shaderpacks';
    }

    const destDir = path.join(INSTANCES_DIR, instanceId, folder);
    fs.mkdirSync(destDir, { recursive: true });

    const fileName = path.basename(filePath);
    const destPath = path.join(destDir, fileName);
    
    log(`⇣ Загрузка файла в ${folder}: ${fileName}`);
    fs.copyFileSync(filePath, destPath);

    return { 
      ok: true, 
      filename: fileName, 
      name: fileName.replace(new RegExp(`\\${ext}$`, 'i'), '').replace(/[-_]/g, ' '),
      folder
    };
  } catch (e) {
    log('✖ upload-file: ' + e.message);
    return { ok: false, error: e.message };
  }
});

// ============================================================
//  Microsoft Login (OAuth2 + Xbox Live + Minecraft)
// ============================================================

const MS_CLIENT_ID = '00000000402b5328'; // Generic Minecraft Client ID
const MS_REDIRECT = 'https://login.live.com/oauth20_desktop.srf';
const TOKENS_PATH = path.join(app.getPath('userData'), 'ms_tokens.json');

function saveToken(uuid, token) {
  let tokens = {};
  try { if (fs.existsSync(TOKENS_PATH)) tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8')); } catch(e) {}
  tokens[uuid] = token;
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens));
}

function getToken(uuid) {
  try {
    if (fs.existsSync(TOKENS_PATH)) {
      const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
      return tokens[uuid];
    }
  } catch(e) {}
  return null;
}

// --- Discord RPC ---
const DISCORD_CLIENT_ID = '903264027732955176'; // Modrinth Client ID as fallback for testing
let rpc = null;
let rpcReady = false;
const startTimestamp = new Date();

function setActivity(details, state, largeImageKey = 'modrinth', largeImageText = 'Pixiestape') {
  if (!rpc || !rpcReady) return;
  rpc.setActivity({
    details,
    state,
    startTimestamp,
    largeImageKey,
    largeImageText,
    instance: false,
  }).catch(e => log('✖ RPC Update Error: ' + e.message));
}

function initRPC() {
  try {
    DiscordRPC.register(DISCORD_CLIENT_ID);
    rpc = new DiscordRPC.Client({ transport: 'ipc' });
    rpc.on('ready', () => {
      rpcReady = true;
      log('✓ Discord RPC готов');
      setActivity('В лаунчере', 'Выбирает сборку');
    });

    rpc.on('disconnected', () => {
      rpcReady = false;
      log('⚠ Discord RPC отключен');
    });

    rpc.login({ clientId: DISCORD_CLIENT_ID }).catch(err => {
      log('✖ Discord Login Error: ' + err.message);
      rpc = null;
    });
  } catch (err) {
    log('✖ Discord RPC Init Error: ' + err.message);
  }
}

initRPC();

ipcMain.handle('update-presence', (e, { details, state }) => {
  setActivity(details, state);
});

ipcMain.handle('login-microsoft', async () => {
  return new Promise((resolve) => {
    const authWin = new BrowserWindow({
      width: 500,
      height: 600,
      parent: mainWindow,
      modal: true,
      show: true,
      title: 'Вход в Microsoft',
      autoHideMenuBar: true,
    });

    const url = `https://login.live.com/oauth20_authorize.srf?client_id=${MS_CLIENT_ID}&response_type=code&redirect_uri=${MS_REDIRECT}&scope=XboxLive.signin%20offline_access&prompt=select_account`;
    authWin.loadURL(url);

    let resolved = false;

    authWin.webContents.on('will-navigate', async (e, url) => {
      if (url.startsWith(MS_REDIRECT)) {
        e.preventDefault();
        const code = new URL(url).searchParams.get('code');
        if (code) {
          resolved = true;
          authWin.close();
          handleCode(code);
        }
      }
    });

    authWin.webContents.on('will-redirect', async (e, url) => {
      if (url.startsWith(MS_REDIRECT)) {
        e.preventDefault();
        const code = new URL(url).searchParams.get('code');
        if (code) {
          resolved = true;
          authWin.close();
          handleCode(code);
        }
      }
    });

    async function handleCode(code) {
      try {
        log('⇣ Обмен кода на токен…');
        const tokenRes = await post('https://login.live.com/oauth20_token.srf', `client_id=${MS_CLIENT_ID}&code=${code}&grant_type=authorization_code&redirect_uri=${MS_REDIRECT}`, 'application/x-www-form-urlencoded');
        
        log('⇣ Авторизация Xbox Live…');
        const xblRes = await postJson('https://user.auth.xboxlive.com/user/authenticate', {
          Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${tokenRes.access_token}` },
          RelyingParty: 'http://auth.xboxlive.com',
          TokenType: 'JWT'
        });

        log('⇣ Авторизация XSTS…');
        const xstsRes = await postJson('https://xsts.auth.xboxlive.com/xsts/authorize', {
          Properties: { SandboxId: 'RETAIL', UserTokens: [xblRes.Token] },
          RelyingParty: 'rp://api.minecraftservices.com/',
          TokenType: 'JWT'
        });

        log('⇣ Вход в Minecraft…');
        const mcRes = await postJson('https://api.minecraftservices.com/authentication/login_with_xbox', {
          identityToken: `XBL3.0 x=${xblRes.DisplayClaims.xui[0].uhs};${xstsRes.Token}`
        });

        log('⇣ Получение профиля…');
        const profile = await fetchJson('https://api.minecraftservices.com/minecraft/profile', mcRes.access_token);

        saveToken(profile.id, mcRes.access_token);

        resolve({
          ok: true,
          username: profile.name,
          uuid: profile.id,
        });
      } catch (err) {
        log('✖ Ошибка MS: ' + err.message);
        resolve({ ok: false, error: err.message });
      }
    }

    authWin.on('closed', () => {
      if (!resolved) resolve({ ok: false, error: 'Авторизация отменена или окно закрыто' });
    });
  });
});

async function post(url, body, contentType) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, {
      method: 'POST',
      headers: { 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function postJson(url, obj) {
  return post(url, JSON.stringify(obj), 'application/json');
}

async function fetchJson(url, token) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

// ============================================================
//  LAUNCH
// ============================================================

ipcMain.handle('launch-minecraft', async (_e, opts = {}) => {
  const username = (opts.username || 'PixieTester');
  const uuid = opts.uuid || '00000000000000000000000000000000';
  const accountType = opts.accountType || 'offline';
  const mcVersion = opts.version || '1.20.1';
  const loader = (opts.loader || 'vanilla').toLowerCase();
  const loaderVersion = opts.loaderVersion;
  const instanceId = opts.instanceId;
  const ramGb = Math.max(1, Math.min(32, parseInt(opts.ramGb, 10) || 4));
  const startedAt = Date.now();

  let accessToken = '0';
  if (accountType === 'microsoft') {
    accessToken = getToken(uuid);
    if (!accessToken) {
       log(`⚠ Токен Microsoft для ${username} не найден. Пробуем оффлайн.`);
    }
  }

  try {
    log(`▶ ${username} → ${loader} ${mcVersion}${loaderVersion ? ' (' + loaderVersion + ')' : ''}, RAM ${ramGb} ГБ`);

    const javaVer = await checkJava();
    if (!javaVer) {
      const msg = 'Java не найдена. Установите Java 17+ (https://adoptium.net) и перезапустите.';
      log('✖ ' + msg);
      return { ok: false, error: msg };
    }
    log(`✓ Java: ${javaVer}`);

    const vanilla = await ensureVanillaVersion(mcVersion);
    const assetsDir = await ensureAssets(vanilla.versionJson);

    let mainClass = vanilla.versionJson.mainClass;
    let extraLibs = [];

    if (loader === 'fabric' || loader === 'quilt') {
      const f = await ensureFabric(mcVersion, loaderVersion);
      mainClass = f.mainClass;
      extraLibs = f.libPaths;
    } else if (loader === 'forge' || loader === 'neoforge') {
      try {
        const f = await ensureForge(mcVersion, loaderVersion);
        mainClass = f.mainClass;
        extraLibs = f.libPaths;
      } catch (e) {
        log(`⚠ Forge не установлен: ${e.message}. Запускаю vanilla.`);
      }
    }

    const sep = process.platform === 'win32' ? ';' : ':';
    const allLibs = [...extraLibs, ...vanilla.libPaths, vanilla.clientJar];
    
    // Умная дедупликация: если есть несколько версий одной библиотеки, оставляем последнюю
    const libMap = new Map();
    const finalLibs = [];
    
    for (const libPath of allLibs) {
      if (libPath === vanilla.clientJar) {
        finalLibs.push(libPath);
        continue;
      }
      
      // Пытаемся вычленить идентификатор библиотеки (путь до версии)
      // Пример: .../org/ow2/asm/asm/9.9/asm-9.9.jar -> org/ow2/asm/asm
      const parts = libPath.split(/[\\/]/);
      if (parts.length > 2) {
        // Берем путь без последних двух элементов (версия и файл)
        const libKey = parts.slice(0, -2).join('/');
        const version = parts[parts.length - 2];
        
        if (!libMap.has(libKey) || isNewer(version, libMap.get(libKey).version)) {
          libMap.set(libKey, { path: libPath, version });
        }
      } else {
        finalLibs.push(libPath);
      }
    }
    
    // Собираем итоговый список из Map
    for (const entry of libMap.values()) {
      finalLibs.push(entry.path);
    }

    const uniqLibs = Array.from(new Set(finalLibs));
    const classpath = uniqLibs.join(sep);

    function isNewer(v1, v2) {
      const p1 = v1.split('.').map(Number);
      const p2 = v2.split('.').map(Number);
      for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const n1 = p1[i] || 0;
        const n2 = p2[i] || 0;
        if (n1 > n2) return true;
        if (n1 < n2) return false;
      }
      return false;
    }

    const gameDir = instanceId ? path.join(INSTANCES_DIR, instanceId) : MC_DIR;
    fs.mkdirSync(gameDir, { recursive: true });
    fs.mkdirSync(path.join(gameDir, 'mods'), { recursive: true });

    // Дозагружаем моды из переданного списка (если есть и это не mrpack-файлы)
    if (Array.isArray(opts.mods) && opts.mods.length) {
      log(`⇣ Проверка модов сборки (${opts.mods.length})…`);
      for (const m of opts.mods) {
        if (m.source === 'mrpack' || m.source === 'override') continue; // уже на диске
        if (!m.id || m.id.startsWith('mrpack:') || m.id.startsWith('override:')) continue;
        try {
          const versions = await downloadJson(
            `https://api.modrinth.com/v2/project/${m.id}/version?game_versions=["${mcVersion}"]`
          );
          let matching = versions.filter(v => v.loaders.includes(loader));
          if (!matching.length) matching = versions;
          if (!matching.length) { log(`⚠ ${m.name}: нет совместимых версий`); continue; }
          const v = matching[0];
          const file = v.files.find(f => f.primary) || v.files[0];
          if (!file) continue;
          const dest = path.join(gameDir, 'mods', file.filename);
          if (!fs.existsSync(dest)) {
            await downloadFileWithSha1(file.url, dest, file.hashes && file.hashes.sha1);
            log(`  + ${file.filename}`);
          }
        } catch (err) { log(`⚠ ${m.name}: ${err.message}`); }
      }
    }

    // Считаем установленные моды (для UI / статистики)
    let modsCount = 0;
    try {
      modsCount = fs.readdirSync(path.join(gameDir, 'mods')).filter(f => f.endsWith('.jar')).length;
    } catch {}
    log(`✓ Модов в папке mods: ${modsCount}`);

    const javaArgs = [
      `-Xmx${ramGb}G`,
      `-Xms${Math.min(ramGb, 1)}G`,
      `-Djava.library.path=${vanilla.nativesDir}`,
      `-Dorg.lwjgl.librarypath=${vanilla.nativesDir}`,
      `-Dminecraft.launcher.brand=Pixiestape`,
      `-Dminecraft.launcher.version=1.0`,
      '-cp', classpath,
      mainClass,
      '--username', username,
      '--version', `Pixiestape-${loader}-${mcVersion}`,
      '--gameDir', gameDir,
      '--assetsDir', assetsDir,
      '--assetIndex', (vanilla.versionJson.assetIndex && vanilla.versionJson.assetIndex.id) || mcVersion,
      '--uuid', uuid,
      '--accessToken', accessToken,
      '--userType', accountType === 'microsoft' ? 'msa' : 'legacy',
      '--versionType', 'Pixiestape',
      '--width', '1280',
      '--height', '720',
    ];

    log(`▶ Запускаю Java (libs: ${uniqLibs.length}, mainClass: ${mainClass.split('.').pop()})`);
    setActivity(`Играет в ${instanceId || 'Minecraft'}`, `Версия ${mcVersion} (${loader})`);

    const child = spawn('java', javaArgs, { cwd: gameDir, detached: false });
    if (instanceId) {
      activeProcesses.set(instanceId, child);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mc-session-started', { instanceId });
      }
    }

    child.stdout.on('data', (d) => log(d.toString().trim()));
    child.stderr.on('data', (d) => log(d.toString().trim()));
    child.on('exit', (code) => {
      if (instanceId) activeProcesses.delete(instanceId);
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      log(`◼ Minecraft завершился (код ${code}), сессия: ${seconds}с`);
      setActivity('В лаунчере', 'Выбирает сборку');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mc-session-ended', {
          instanceId: instanceId || null,
          seconds,
          modsCount,
        });
      }
    });
    child.on('error', (err) => log('✖ ' + err.message));

    return { ok: true, message: `Minecraft ${mcVersion} (${loader}) стартует…`, modsCount };
  } catch (e) {
    log('✖ Ошибка: ' + e.message);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('stop-minecraft', async (event, instanceId) => {
  if (!instanceId) return { ok: false, error: 'No instanceId' };
  const child = activeProcesses.get(instanceId);
  if (child) {
    child.kill();
    activeProcesses.delete(instanceId);
    return { ok: true };
  }
  return { ok: false, error: 'Process not found' };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
