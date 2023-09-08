const { app } = require("electron");
const { autoUpdater } = require("electron-updater");

const appVersionListener = require('./listeners/appVersion').default;
const autoUpdaterListener = require('./listeners/autoUpdater').default;
const devToolsListener = require('./listeners/devToolsListener').default;
const ftpListener = require('./listeners/ftpListener').default;
const logoutListener = require('./listeners/logout').default;
const printerValueListener = require('./listeners/printerValue').default;
const restartAppListener = require('./listeners/restartApp').default;
const setTokenListener = require('./listeners/setToken').default;
const setupBrowserWindow = require('./services/setupBrowserWindow').default;
const startFileWatcher = require('./services/fileWatcher').startFileWatcher;
const useErrorLogger = require('./services/errorLogger').useErrorLogger;

const basePath = __dirname;

// Hot reloading - not especially useful as on restart, you can no longer view log in the terminal
// try {
//   require('electron-reloader')(module)
// } catch (_) {}

const createWindow = async() => {
  const mainWindow = await setupBrowserWindow({
    basePath,
    browserWindowOptions:  {
      width: 1200,
      height: 1200,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
    }
  })

  useErrorLogger({ mainWindow })

  autoUpdaterListener({ mainWindow })

  mainWindow.once('ready-to-show', async () => {
    await autoUpdater.checkForUpdatesAndNotify();
  });

  // Note: setTimeout is used here because the events are not registered properly - there is probably a better way of achieving this.
  setTimeout(() => {
    appVersionListener()

    logoutListener()

    restartAppListener()

    devToolsListener({ mainWindow })

    printerValueListener()

    ftpListener({ mainWindow })

    startFileWatcher({ mainWindow })

    setTokenListener()

  }, 0)
};

app.on('ready', createWindow);


