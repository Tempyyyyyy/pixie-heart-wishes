const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');
const os = require('os');

// ============================================================
//  Pixiestape Launcher — Electron main process
//  Поддержка: Vanilla, Fabric, Forge (NeoForge), .mrpack установка
// ============================================================

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

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ============================================================
//  Helpers
// ============================================================

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
    if (hash === expectedSha1) return; // already correct
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
  for (const rule of lib.rules) {
    const matchesOs = !rule.os || rule.os.name === platform;
    if (matchesOs) allowed = rule.action === 'allow';
  }
  return allowed;
}

function getNativeClassifier(lib) {
  if (!lib.natives) return null;
  const platform =
    process.platform === 'win32' ? 'windows' :
    process.platform === 'darwin' ? 'osx' : 'linux';
  const cls = lib.natives[platform];
  if (!cls) return null;
  return cls.replace('${arch}', process.arch === 'x64' ? '64' : '32');
}

// Maven coords ("group:artifact:version") → relative path
function mavenToPath(coord) {
  const [g, a, v] = coord.split(':');
  return path.join(...g.split('.'), a, v, `${a}-${v}.jar`);
}

function mavenToUrl(baseUrl, coord) {
  const [g, a, v] = coord.split(':');
  return `${baseUrl.replace(/\/$/, '')}/${g.split('.').join('/')}/${a}/${v}/${a}-${v}.jar`;
}

// ============================================================
//  Vanilla version manifest + libraries
// ============================================================

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

  // Libraries (with rules and natives)
  const libsDir = path.join(MC_DIR, 'libraries');
  const libPaths = [];
  const nativesDir = path.join(versionDir, 'natives');
  fs.mkdirSync(nativesDir, { recursive: true });

  log(`⇣ Библиотеки vanilla…`);
  for (const lib of versionJson.libraries) {
    if (!isLibraryAllowed(lib)) continue;
    const downloads = lib.downloads || {};
    if (downloads.artifact && downloads.artifact.path) {
      const dest = path.join(libsDir, downloads.artifact.path);
      await downloadFileWithSha1(downloads.artifact.url, dest, downloads.artifact.sha1).catch(e => log('⚠ ' + e.message));
      libPaths.push(dest);
    }
    const nativeCls = getNativeClassifier(lib);
    if (nativeCls && downloads.classifiers && downloads.classifiers[nativeCls]) {
      const nat = downloads.classifiers[nativeCls];
      const dest = path.join(libsDir, nat.path);
      await downloadFileWithSha1(nat.url, dest, nat.sha1).catch(e => log('⚠ native ' + e.message));
      // unpack to natives dir
      try {
        await extractNativesToDir(dest, nativesDir);
      } catch (e) { log('⚠ unpack ' + e.message); }
    }
  }

  return { versionJson, clientJar, libPaths, nativesDir, versionDir };
}

// Minimal jar (zip) extraction for natives — uses built-in zlib via child unzip if available,
// otherwise falls back to a tiny pure-JS approach using the `adm-zip`-like routine in Node.
// To keep zero deps, we use a simple manual ZIP reader.
async function extractNativesToDir(jarPath, outDir) {
  const buf = fs.readFileSync(jarPath);
  // EOCD search
  const eocdSig = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === eocdSig) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Bad ZIP: EOCD not found');
  const cdSize = buf.readUInt32LE(eocd + 12);
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

    // local header
    const localNameLen = buf.readUInt16LE(localOff + 26);
    const localExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + localNameLen + localExtraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    let out;
    if (method === 0) out = data;
    else if (method === 8) out = zlib.inflateRawSync(data);
    else continue;
    if (out.length !== uncompSize && uncompSize > 0) {
      // some zips lie about size; trust the inflated output
    }
    const outPath = path.join(outDir, path.basename(name));
    fs.writeFileSync(outPath, out);
  }
}

// ============================================================
//  Assets (vanilla)
// ============================================================

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
  log(`⇣ Ассеты: ${entries.length} файлов (звуки, шрифты)…`);
  let done = 0;
  for (const [, obj] of entries) {
    const hash = obj.hash;
    const sub = hash.slice(0, 2);
    const dest = path.join(objectsDir, sub, hash);
    if (!fs.existsSync(dest)) {
      try { await downloadFile(`https://resources.download.minecraft.net/${sub}/${hash}`, dest); }
      catch (e) { /* ignore individual asset */ }
    }
    done++;
    if (done % 200 === 0) log(`  …${done}/${entries.length}`);
  }
  log(`✓ Ассетов готово: ${done}`);
  return assetsDir;
}

// ============================================================
//  Fabric loader
// ============================================================

async function ensureFabric(mcVersion, loaderVersionOpt) {
  // Get latest loader if not specified
  let loaderVersion = loaderVersionOpt;
  if (!loaderVersion) {
    const loaders = await downloadJson(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`);
    if (!loaders.length) throw new Error(`Fabric не поддерживает ${mcVersion}`);
    loaderVersion = loaders[0].loader.version;
  }
  log(`✓ Fabric loader ${loaderVersion}`);

  // Profile JSON tells us mainClass + libraries
  const profile = await downloadJson(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/profile/json`);

  // Download libraries (Maven format)
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
        // try Maven Central as fallback
        try { await downloadFile(mavenToUrl('https://repo1.maven.org/maven2/', lib.name), dest); }
        catch (e2) { log('⚠ ' + lib.name + ': ' + e2.message); continue; }
      }
    }
    libPaths.push(dest);
  }

  return { mainClass: profile.mainClass, libPaths, loaderVersion };
}

// ============================================================
//  Forge / NeoForge loader (basic — uses Forge's own promotions)
// ============================================================

async function ensureForge(mcVersion, loaderVersionOpt) {
  // Get latest version if not specified
  let forgeVersion = loaderVersionOpt;
  if (!forgeVersion) {
    const promos = await downloadJson('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
    forgeVersion = promos.promos[`${mcVersion}-recommended`] || promos.promos[`${mcVersion}-latest`];
    if (!forgeVersion) throw new Error(`Forge не имеет рекомендованной версии для ${mcVersion}. Укажите версию вручную.`);
  }
  log(`✓ Forge ${forgeVersion}`);

  const fullVersion = `${mcVersion}-${forgeVersion}`;
  const versionDir = path.join(MC_DIR, 'versions', `forge-${fullVersion}`);
  const versionJsonPath = path.join(versionDir, 'version.json');

  // Forge installer is a JAR — for "client install" we'd need to run installer with java.
  // For simplicity, we use the "version JSON" approach via an unofficial mirror,
  // OR fall back to downloading the installer and running it.
  if (!fs.existsSync(versionJsonPath)) {
    log(`⇣ Forge installer (~5 MB)…`);
    const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${fullVersion}/forge-${fullVersion}-installer.jar`;
    const installerPath = path.join(versionDir, 'installer.jar');
    await downloadFile(installerUrl, installerPath);

    // Extract version.json from installer
    log(`⇣ Распаковка профиля…`);
    extractFileFromZip(installerPath, 'version.json', versionJsonPath);
  }

  const profile = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));

  // Forge libs
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
//  .mrpack installer (Modrinth modpack format)
// ============================================================

ipcMain.handle('install-mrpack', async (_e, opts) => {
  try {
    const { url, instanceId, instanceName } = opts;
    if (!url || !instanceId) return { ok: false, error: 'Нет url или instanceId' };

    log(`▶ Установка модпака: ${instanceName}`);
    const instDir = path.join(INSTANCES_DIR, instanceId);
    fs.mkdirSync(instDir, { recursive: true });

    const mrpackPath = path.join(instDir, 'pack.mrpack');
    log(`⇣ Скачиваю .mrpack…`);
    await downloadFile(url, mrpackPath);

    // Read manifest
    const entries = listZipEntries(mrpackPath);
    const indexEntry = entries.find(e => e.name === 'modrinth.index.json');
    if (!indexEntry) return { ok: false, error: '.mrpack не содержит modrinth.index.json' };

    const index = JSON.parse(readZipEntry(indexEntry).toString('utf8'));
    log(`✓ Манифест: ${index.name} v${index.versionId}`);

    const mcVersion = index.dependencies['minecraft'];
    let loader = 'fabric';
    let loaderVersion;
    if (index.dependencies['fabric-loader']) {
      loader = 'fabric';
      loaderVersion = index.dependencies['fabric-loader'];
    } else if (index.dependencies['forge']) {
      loader = 'forge';
      loaderVersion = index.dependencies['forge'];
    } else if (index.dependencies['neoforge']) {
      loader = 'neoforge';
      loaderVersion = index.dependencies['neoforge'];
    } else if (index.dependencies['quilt-loader']) {
      loader = 'quilt';
      loaderVersion = index.dependencies['quilt-loader'];
    }
    log(`✓ Лоадер: ${loader} ${loaderVersion}, MC ${mcVersion}`);

    // Скачиваем все файлы из index.files в instance dir
    const filesDir = instDir;
    log(`⇣ Скачиваю ${index.files.length} файлов мода…`);
    let done = 0;
    for (const f of index.files) {
      // Берём первый downloads url, по политике mrpack — это всегда CDN modrinth/curseforge/etc
      const dest = path.join(filesDir, f.path);
      try {
        await downloadFileWithSha1(f.downloads[0], dest, f.hashes && f.hashes.sha1);
        done++;
      } catch (e) {
        log(`⚠ ${f.path}: ${e.message}`);
      }
    }
    log(`✓ Файлов установлено: ${done}/${index.files.length}`);

    // Распаковываем overrides/ и client-overrides/ в instance dir
    for (const e of entries) {
      if (e.name.startsWith('overrides/') || e.name.startsWith('client-overrides/')) {
        if (e.name.endsWith('/')) continue;
        const rel = e.name.replace(/^(client-)?overrides\//, '');
        const out = path.join(filesDir, rel);
        try {
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, readZipEntry(e));
        } catch (err) { log('⚠ override ' + rel + ': ' + err.message); }
      }
    }

    return {
      ok: true,
      message: `Установлено ${done} модов в инстанс`,
      mc_version: mcVersion,
      loader,
      loader_version: loaderVersion,
    };
  } catch (e) {
    log('✖ ' + e.message);
    return { ok: false, error: e.message };
  }
});

// ============================================================
//  LAUNCH
// ============================================================

ipcMain.handle('launch-minecraft', async (_e, opts = {}) => {
  const username = (opts.username || 'PixieTester').replace(/[^A-Za-z0-9_]/g, '').slice(0, 16) || 'PixieTester';
  const mcVersion = opts.version || '1.20.1';
  const loader = (opts.loader || 'vanilla').toLowerCase();
  const loaderVersion = opts.loaderVersion;
  const instanceId = opts.instanceId;
  const ramGb = Math.max(1, Math.min(32, parseInt(opts.ramGb) || 4));

  try {
    log(`▶ ${username} → ${loader} ${mcVersion}${loaderVersion ? ' (' + loaderVersion + ')' : ''}, RAM ${ramGb} ГБ`);

    const javaVer = await checkJava();
    if (!javaVer) {
      const msg = 'Java не найдена. Установите Java 17+ (https://adoptium.net) и перезапустите.';
      log('✖ ' + msg);
      return { ok: false, error: msg };
    }
    log(`✓ Java: ${javaVer}`);

    // 1. Vanilla (всегда нужно)
    const vanilla = await ensureVanillaVersion(mcVersion);

    // 2. Assets
    const assetsDir = await ensureAssets(vanilla.versionJson);

    // 3. Loader
    let mainClass = vanilla.versionJson.mainClass;
    let extraLibs = [];
    let resolvedLoaderVer = loaderVersion;

    if (loader === 'fabric' || loader === 'quilt') {
      const f = await ensureFabric(mcVersion, loaderVersion);
      mainClass = f.mainClass;
      extraLibs = f.libPaths;
      resolvedLoaderVer = f.loaderVersion;
    } else if (loader === 'forge' || loader === 'neoforge') {
      try {
        const f = await ensureForge(mcVersion, loaderVersion);
        mainClass = f.mainClass;
        extraLibs = f.libPaths;
        resolvedLoaderVer = f.loaderVersion;
      } catch (e) {
        log(`⚠ Forge не установлен: ${e.message}. Запускаю vanilla.`);
      }
    }

    // 4. Build classpath
    const sep = process.platform === 'win32' ? ';' : ':';
    const allLibs = [...extraLibs, ...vanilla.libPaths, vanilla.clientJar];
    const uniqLibs = Array.from(new Set(allLibs));
    const classpath = uniqLibs.join(sep);

    // 5. Game directory: per-instance if specified
    const gameDir = instanceId ? path.join(INSTANCES_DIR, instanceId) : MC_DIR;
    fs.mkdirSync(gameDir, { recursive: true });

    // 6. Args
    const javaArgs = [
      `-Xmx${ramGb}G`,
      `-Xms512M`,
      `-Djava.library.path=${vanilla.nativesDir}`,
      `-Dminecraft.launcher.brand=Pixiestape`,
      `-Dminecraft.launcher.version=1.0`,
      '-cp', classpath,
      mainClass,
      '--username', username,
      '--version', `Pixiestape ${loader} ${mcVersion}`,
      '--gameDir', gameDir,
      '--assetsDir', assetsDir,
      '--assetIndex', (vanilla.versionJson.assetIndex && vanilla.versionJson.assetIndex.id) || mcVersion,
      '--uuid', '00000000-0000-0000-0000-000000000000',
      '--accessToken', '0',
      '--clientId', '0',
      '--xuid', '0',
      '--userType', 'legacy',
      '--versionType', 'release',
    ];

    log(`▶ Запускаю Java (libs: ${uniqLibs.length}, mainClass: ${mainClass.split('.').pop()})`);
    const child = spawn('java', javaArgs, { cwd: gameDir, detached: false });

    child.stdout.on('data', (d) => log(d.toString().trim()));
    child.stderr.on('data', (d) => log(d.toString().trim()));
    child.on('exit', (code) => log(`◼ Minecraft завершился (код ${code})`));
    child.on('error', (err) => log('✖ ' + err.message));

    return { ok: true, message: `Minecraft ${mcVersion} (${loader}) стартует…` };
  } catch (e) {
    log('✖ Ошибка: ' + e.message);
    return { ok: false, error: e.message };
  }
});

// ============================================================
//  App lifecycle
// ============================================================

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
