const { ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

const restartApp = () => {
    ipcMain.on('restart_app', () => {
        autoUpdater.quitAndInstall();
    });
}

module.exports.default = restartApp;