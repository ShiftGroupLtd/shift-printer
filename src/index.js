const path = require("path");
const settings = require('electron-settings');
const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const { getPrinters  }  = require("pdf-to-printer")
const fs = require('fs');
const axios = require('axios');
const { exec } = require("child_process");
const hostName = require('os').hostname();
const { ipcMain } = require('electron');
const ipc = require('electron').ipcMain;


const createWindow = async() => {
  const mainWindow = new BrowserWindow({
      width: 1200,
      height: 900,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    }
  );

  //mainWindow.webContents.openDevTools();

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.executeJavaScript(`document.getElementById("iframe").setAttribute('src', 'https://app.shift.online')`);

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });
  
  ipcMain.on('logout', async function (event, arg) {
    await settings.unset('auth');
    await settings.unset('printer');
    app.exit();
    app.relaunch();
  });

  ipc.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
  });

  ipc.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

  ipc.on('invokeAction', async (event, data) => {
    if(data.length) {
      await settings.set('printer', {
        name: data[0],
      });
      return event.sender.send('actionReplySuccess');
    }
    return  event.sender.send('actionReplyFail');
  });


  ipc.on('setToken', async (event, data) => {
    if(data.length && data.length == 2) {
      await settings.set('auth', {
        token: data[0],
        accountId: data[1],
      });
      console.log('set token...');
    }
  });

  ipcMain.on('checkLoader', async function (event, arg) {
    startPrinter();

    //if printer name is set close it
    printerName = await settings.has('printer.name');
    if(!printerName) {
      return;
    } 
    event.sender.send('closeLoader');
  });

  
  const execPromise = (command, count = 1, log = 'label') => {
    const promises = [];
    for (i = 0; i < count; ++i) {
      promises.push(new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                mainWindow.webContents.send('error', JSON.stringify(error, Object.getOwnPropertyNames(error)));
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
      }));
    }
    return Promise.all(promises);
  }

  const startPrinter = async () => {
    const loopStart = setInterval(async() => {
      try {
        authToken = await settings.has('auth.token');
        accountId =  await settings.has('auth.accountId');
        printerName = await settings.has('printer.name');

        if(!authToken || !accountId || !printerName) {
          return;
        } 

        authToken = await settings.get('auth.token');
        accountId =  await settings.get('auth.accountId');
        printerName = await settings.get('printer.name');

        //console.log(await settings.has('auth.token'), await settings.has('auth.accountId'), await settings.has('printer.name'));
        const config = {
          method: 'post',
          url: 'https://api.shift.online/business-dashboard/v1/printer/autoPrint',
          headers: { 
              'Authorization': "Bearer " + authToken
          },
          data : {
            accountId : accountId
          }
        };

        const response = await axios(config);
        await response.data.forEach(async(item, count) => {
          let pageDirectory = __dirname.replace('app.asar', 'app.asar.unpacked')
          pageDirectory = pageDirectory.replace('\src', '');
          // Write File#
          await fs.writeFileSync(path.join(pageDirectory, count + ".txt"), item ,"UTF8",{ flag: 'wx' })
          // Print File
          await execPromise('COPY /B '+ path.join(pageDirectory, count + ".txt") + ' "\\\\' + hostName + '\\' + printerName +'"', 1);
          // Delete File
          fs.unlink(path.join(pageDirectory, count + ".txt"), function (err) {
              if (err) throw err;
          });
        });
      } catch (error) {
        mainWindow.webContents.send('error', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }
    }, 2000);
  }
};

app.on('ready', createWindow);

