const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV === 'development';

// Configurações do autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const BACKUP_FILENAME = 'backup_pdv.json';
const backupPath = path.join(app.getPath('userData'), BACKUP_FILENAME);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/vite.svg')
  });

  Menu.setApplicationMenu(null);

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  if (isDev) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  mainWindow.maximize();
  mainWindow.show();

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// IPC Handlers
ipcMain.handle('get-printers', async () => {
  try {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    let printers = [];
    if (win) {
      printers = await win.webContents.getPrintersAsync();
    } else {
      const tempWin = new BrowserWindow({ show: false });
      printers = await tempWin.webContents.getPrintersAsync();
      tempWin.close();
    }
    console.log('[Electron] Impressoras detectadas:', printers.map(p => ({ name: p.name, displayName: p.displayName, isDefault: p.isDefault })));
    return printers;
  } catch (error) {
    console.error('[Electron] Erro ao buscar impressoras:', error);
    return [];
  }
});

ipcMain.handle('print', async (event, content, options = {}) => {
  const targetDevice = options.deviceName || '';
  console.log(`[Electron] [PRINT_START] - Destino: "${targetDevice || 'Padrão'}"`);
  
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Validar se a impressora existe no sistema
  try {
    const allPrinters = await printWindow.webContents.getPrintersAsync();
    const printerExists = allPrinters.some(p => p.name === targetDevice);
    
    if (targetDevice && !printerExists) {
      console.warn(`[Electron] [ERROR] - Impressora "${targetDevice}" não encontrada.`);
      return { 
        success: false, 
        error: `Impressora "${targetDevice}" não encontrada. Verifique se está ligada e instalada no Windows.`,
        code: 'PRINTER_NOT_FOUND'
      };
    }
  } catch (err) {
    console.error('[Electron] [WARN] - Erro ao validar lista de impressoras:', err);
  }

  const htmlContent = content.startsWith('<html>') ? content : `<html><head><meta charset="UTF-8"></head><body>${content}</body></html>`;
  
  return new Promise((resolve) => {
    let resolved = false;

    const executePrint = () => {
      if (resolved) return;
      console.log(`[Electron] [PRINT_EXEC] - Iniciando envio para a fila do Windows: "${targetDevice || 'Padrão'}"`);
      
      const printParams = {
        silent: true,
        deviceName: targetDevice,
        printBackground: true,
        ...options
      };

      try {
        printWindow.webContents.print(printParams, (success, failureReason) => {
          if (resolved) return;
          resolved = true;

          console.log(`[Electron] [PRINT_CALLBACK] - Sucesso: ${success}, Motivo: ${failureReason || 'Nenhum'}`);

          if (!printWindow.isDestroyed()) printWindow.close();
          
          if (!success) {
            console.error(`[Electron] [PRINT_FAIL] - Falha no driver: "${failureReason}"`);
            resolve({ 
              success: false, 
              error: failureReason || 'O driver da impressora rejeitou o trabalho ou a impressora está offline.',
              code: 'DRIVER_FAILURE'
            });
          } else {
            console.log('[Electron] [PRINT_SUCCESS] - Trabalho aceito pela fila de impressão do Windows.');
            resolve({ success: true });
          }
        });
      } catch (printErr) {
        console.error('[Electron] [PRINT_CRITICAL] - Erro ao chamar webContents.print:', printErr);
        resolved = true;
        if (!printWindow.isDestroyed()) printWindow.close();
        resolve({ success: false, error: printErr.message, code: 'INTERNAL_ERROR' });
      }
    };

    // Registrar o listener ANTES de começar o loadURL
    printWindow.webContents.on('did-finish-load', () => {
      console.log('[Electron] [CONTENT_LOADED] - HTML pronto para renderização.');
      // Delay de 1000ms para garantir que CSS e fontes (especialmente em máquinas lentas) carreguem
      setTimeout(executePrint, 1000);
    });

    printWindow.webContents.on('did-fail-load', (e, errorCode, errorDescription) => {
      console.error('[Electron] [LOAD_FAIL] - Falha ao carregar conteúdo:', errorDescription);
      if (!resolved) {
        resolved = true;
        if (!printWindow.isDestroyed()) printWindow.close();
        resolve({ success: false, error: `Falha ao preparar conteúdo: ${errorDescription}`, code: 'LOAD_FAILURE' });
      }
    });

    // Iniciar o carregamento
    console.log('[Electron] [LOAD_START] - Carregando conteúdo na janela oculta...');
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`).catch(err => {
      console.error('[Electron] [LOAD_CATCH] - Erro no loadURL:', err);
    });

    // Timeout de segurança (60 segundos)
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (!printWindow.isDestroyed()) printWindow.close();
        console.error('[Electron] [TIMEOUT] - O driver de impressão ou a renderização não respondeu em 60s.');
        resolve({ 
          success: false, 
          error: 'A operação de impressão demorou mais de 60 segundos. Verifique o status da impressora no Windows.',
          code: 'TIMEOUT'
        });
      }
    }, 60000);
  });
});

ipcMain.handle('save-backup', async (event, data) => {
  try {
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar backup:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-backup', async () => {
  try {
    if (fs.existsSync(backupPath)) {
      const data = fs.readFileSync(backupPath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar backup:', error);
    return null;
  }
});

ipcMain.handle('export-backup', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Exportar Backup',
    defaultPath: path.join(app.getPath('downloads'), `backup_pdv_${new Date().toISOString().split('T')[0]}.json`),
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false };
});

ipcMain.handle('import-backup', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Importar Backup',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      return null;
    }
  }
  return null;
});

app.whenReady().then(() => {
  createWindow();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Eventos do AutoUpdater
autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] Nova versão disponível:', info.version);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[AutoUpdater] O aplicativo está atualizado.');
});

autoUpdater.on('error', (err) => {
  console.error('[AutoUpdater] Erro na atualização:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Velocidade de download: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Baixado ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log('[AutoUpdater] ' + log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdater] Atualização baixada; pronta para instalar.');
  
  dialog.showMessageBox({
    type: 'info',
    title: 'Atualização Disponível',
    message: `Uma nova versão (${info.version}) foi baixada com sucesso. Gostaria de reiniciar o aplicativo para instalar agora?`,
    buttons: ['Reiniciar Agora', 'Depois'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      console.log('[AutoUpdater] Reiniciando e instalando atualização...');
      autoUpdater.quitAndInstall();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
