const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs')
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: isDev 
      ? path.join(__dirname, '../public/icon.png')
      : path.join(__dirname, '../dist/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,  // Desabilitado para permitir window.prompt()
      sandbox: false
    },
    autoHideMenuBar: true,
    title: 'PHFlap - Editor de Autômatos'
  });

  // Carrega a aplicação
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Remove menu em produção
  if (!isDev) {
    mainWindow.setMenuBarVisibility(false);
  }

  // Interceptar tentativa de fechar a janela para perguntar sobre salvar (apenas se um editor estiver ativo)
  mainWindow.on('close', async (e) => {
    try {
      // verificar se o renderer expôs o handler de salvar
      const isEditor = await mainWindow.webContents.executeJavaScript('!!window.__phflap_handleSave');
      if (!isEditor) return // nada a fazer

      // impedir fechamento até tratarmos a escolha
      e.preventDefault()

      const result = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Salvar e sair', 'Sair sem salvar', 'Cancelar'],
        defaultId: 0,
        cancelId: 2,
        title: 'Sair',
        message: 'Você está dentro de um editor. Deseja salvar antes de sair?'
      })

      // 0 = Salvar e sair, 1 = Sair sem salvar, 2 = Cancelar
      if (result.response === 2) {
        // cancelar fechamento
        return
      }

      if (result.response === 0) {
        // Tentar obter o payload de salvamento do renderer (json + nome padrão)
        try {
          const payload = await mainWindow.webContents.executeJavaScript('window.__phflap_getSaveData ? window.__phflap_getSaveData() : null')
          if (payload && payload.json) {
            const savePathResult = await dialog.showSaveDialog(mainWindow, {
              title: 'Salvar autômato',
              defaultPath: payload.filename || 'automato.json',
              filters: [{ name: 'JSON', extensions: ['json'] }]
            })

            if (!savePathResult.canceled && savePathResult.filePath) {
              try {
                fs.writeFileSync(savePathResult.filePath, payload.json, 'utf8')
              } catch (err) {
                // se falhar ao escrever, tentar fallback para handler simples
                try {
                  await mainWindow.webContents.executeJavaScript('(async () => { if (window.__phflap_handleSave) { await window.__phflap_handleSave(); } })()')
                } catch (e) {}
              }
            } else {
              // usuário cancelou o diálogo de salvar -> abortar fechamento
              return
            }
          } else {
            // payload não disponível, usar fallback chamando handler (download)
            try {
              await mainWindow.webContents.executeJavaScript('(async () => { if (window.__phflap_handleSave) { await window.__phflap_handleSave(); } })()')
            } catch (err) {}
          }
        } catch (err) {
          // ignore and fallback
          try {
            await mainWindow.webContents.executeJavaScript('(async () => { if (window.__phflap_handleSave) { await window.__phflap_handleSave(); } })()')
          } catch (e) {}
        }

        // força fechar após salvar
        mainWindow.destroy()
        return
      }

      // response === 1 -> sair sem salvar
      mainWindow.destroy()
    } catch (err) {
      // Em caso de erro, não bloquear o fechamento
      return
    }
  })
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
