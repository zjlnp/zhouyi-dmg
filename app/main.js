const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let hexagramData = null;
let isQuitting = false;

function loadData() {
  if (hexagramData) return hexagramData;
  const dataPath = path.join(__dirname, 'data', 'hexagrams.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  hexagramData = JSON.parse(raw);
  return hexagramData;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: '金钱卦 · 周易占筮',
    backgroundColor: '#faf9f6',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.setMenuBarVisibility(false);
  mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.focus(); });
}

app.whenReady().then(() => {
  loadData();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || isQuitting) app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

// IPC handlers
ipcMain.handle('get-hexagram', (event, id) => {
  const data = loadData();
  return data.hexagrams[id] || null;
});

ipcMain.handle('get-all-hexagrams', () => {
  return loadData().hexagrams;
});

ipcMain.handle('get-bagua', () => {
  return loadData().bagua;
});

ipcMain.handle('get-zhuxi-rules', () => {
  return loadData().zhuxi_rules;
});

ipcMain.handle('divinate', (event, lines) => {
  const data = loadData();
  return performDivination(lines, data);
});

function performDivination(lines, data) {
  // lines: array of 6 numbers (6,7,8,9) from bottom (初爻) to top (上爻)
  // 6=老阴, 7=少阳, 8=少阴, 9=老阳

  // Build ben gua (original hexagram)
  const benLines = lines.map(v => v === 7 || v === 9); // 阳=7/9, 阴=6/8
  const changingYaos = [];
  lines.forEach((v, i) => {
    if (v === 6 || v === 9) changingYaos.push(i + 1); // 1-indexed
  });

  // Find ben gua id
  const benId = findHexagramByLines(benLines, data);
  if (!benId) return { error: '无法识别本卦' };

  // Build bian gua (changed hexagram)
  const bianLines = lines.map(v => {
    if (v === 6) return true;   // 老阴变阳
    if (v === 9) return false;  // 老阳变阴
    return v === 7;              // 少阳不变
  });

  const bianId = (changingYaos.length > 0)
    ? findHexagramByLines(bianLines, data)
    : null;

  // Apply Zhu Xi's rules
  const benHexagram = data.hexagrams[benId];
  const bianHexagram = (bianId && data.hexagrams[bianId]) ? data.hexagrams[bianId] : null;

  const numChanges = changingYaos.length;
  const rule = data.zhuxi_rules && data.zhuxi_rules.rules
    ? data.zhuxi_rules.rules[numChanges.toString()]
    : { desc: numChanges + '爻变' };

  // Determine what to reference based on Zhu Xi's rules
  let reference = '';
  let referenceDetail = '';

  if (numChanges === 0) {
    reference = '本卦卦辞';
    referenceDetail = benHexagram.guaci;
  } else if (numChanges === 1) {
    const yaoPos = changingYaos[0];
    const yaoName = getYaoName(benLines[yaoPos - 1], yaoPos);
    reference = `本卦变爻（${yaoName}）爻辞`;
    referenceDetail = `占本卦${yaoName}爻辞`;
  } else if (numChanges === 2) {
    reference = '本卦两变爻爻辞（以上爻为主）';
    const upperYao = Math.max(...changingYaos);
    referenceDetail = `主看第${upperYao}爻`;
  } else if (numChanges === 3) {
    reference = '本卦及之卦彖辞（卦辞）';
    const chuChanged = changingYaos.includes(1);
    if (chuChanged) {
      referenceDetail = '前十卦：主贞（本卦）';
    } else {
      referenceDetail = '后十卦：主悔（变卦）';
    }
  } else if (numChanges === 4) {
    reference = '之卦两不变爻爻辞（以下爻为主）';
    const unchanged = [1,2,3,4,5,6].filter(p => !changingYaos.includes(p));
    referenceDetail = `不变爻：${unchanged.join(',')}，主看第${unchanged[0]}爻`;
  } else if (numChanges === 5) {
    reference = '之卦不变爻爻辞';
    const unchanged = [1,2,3,4,5,6].find(p => !changingYaos.includes(p));
    referenceDetail = `唯一不变爻：第${unchanged}爻`;
  } else {
    if (benId === 1) {
      reference = '乾占用九：群龙无首吉';
    } else if (benId === 2) {
      reference = '坤占用六：利永贞';
    } else {
      reference = '占之卦彖辞（卦辞）';
      referenceDetail = bianHexagram ? bianHexagram.guaci : '';
    }
  }

  return {
    ben_gua: {
      id: benId,
      ...benHexagram,
      lines_display: benLines.map((isYang, i) => ({
        position: i + 1,
        name: getYaoName(isYang, i + 1),
        isYang,
        isChanging: changingYaos.includes(i + 1),
        originalValue: lines[i]
      }))
    },
    bian_gua: bianHexagram ? {
      id: bianId,
      ...bianHexagram,
      lines_display: bianLines.map((isYang, i) => ({
        position: i + 1,
        name: getYaoName(isYang, i + 1),
        isYang,
        isChanged: changingYaos.includes(i + 1),
        originalValue: lines[i]
      }))
    } : null,
    changing_yaos: changingYaos,
    num_changes: numChanges,
    zhuxi_rule: rule,
    reference: reference,
    reference_detail: referenceDetail,
    input_lines: lines
  };
}

function findHexagramByLines(target, data) {
  for (const key of Object.keys(data.hexagrams)) {
    const h = data.hexagrams[key];
    if (h.lines && h.lines.length === 6 &&
        h.lines.every((v, i) => v === target[i])) {
      return parseInt(key);
    }
  }
  return null;
}

function getYaoName(isYang, pos) {
  const yao = isYang ? '九' : '六';
  if (pos === 1) return '初' + yao;
  if (pos === 6) return '上' + yao;
  const names = { 2: '二', 3: '三', 4: '四', 5: '五' };
  return yao + names[pos];
}

// Clear cache handler
ipcMain.handle('clear-cache', async () => {
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ['serviceworkers', 'cachestorage']
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
