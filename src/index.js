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


const execPromise = (command, count = 1, log = 'label') => {
  const promises = [];
  for (i = 0; i < count; ++i) {
    promises.push(new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
          if (error) {
              reject(error);
              return;
          }
          resolve(stdout.trim());
      });
    }));
  }
  return Promise.all(promises);
}

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
};

app.on('ready', createWindow);

ipc.on('app_version', (event) => {
  console.log('triggered')
  event.sender.send('app_version', { version: app.getVersion() });
});

ipc.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipc.on('invokeAction', async (event, data) => {
  if(data.length && data.length == 2) {
    startPrinter(data[0], data[1]);
    await settings.set('settings', {
      printerId: data[0],
      accountId: data[1]
    });
    return event.sender.send('actionReplySuccess');
  }
  return  event.sender.send('actionReplyFail');
});

ipcMain.on('checkLoader', async function (event, arg) {
  //await settings.unset('settings');
  accountId = await settings.has('settings.accountId');
  printerId = await settings.has('settings.printerId');
  if(accountId && printerId) {
    startPrinter(await settings.get('settings.accountId'),  await settings.get('settings.printerId'));
    event.sender.send('closeLoader');
  } else {
    printerList = await getPrinters();
    event.sender.send('printerList', printerList);
  }
});

const startPrinter = async () => {
  // setInterval(async() => {
  //   try {
  //     const config = {
  //       method: 'post',
  //       url: 'https://api.shift.online/printer/v1/qr_pending?location=' +  'test',
  //       headers: { 
  //           'Authorization': "****"
  //       }
  //     };

  //     const response = await axios(config);
  //     let { data }  = await response.data;
  //     await data.forEach(async(item, count) => {
  //       // Write File
  //       await fs.writeFileSync(path.join(__dirname,"zplStorage", item.qr_id + "_" + count + ".txt"), item.zpl,"UTF8",{ flag: 'wx' })
  //        // Print File
  //       await execPromise('COPY /B '+ path.join(__dirname,"zplStorage", item.qr_id + "_" + count + ".txt") + ' "\\\\' + hostName + '\\' + await settings.get('settings.printerId')+'"', 1);
  //       // Delete File
  //       fs.unlink(path.join(__dirname,"zplStorage", item.qr_id + "_" + count + ".txt"), function (err) {
  //           if (err) throw err;
  //       });
  //     });
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }, 2000);  
}