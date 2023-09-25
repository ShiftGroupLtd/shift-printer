const { autoUpdater } = require("electron-updater");

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 */
const autoUpdaterListener = ({ mainWindow }) => {
    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update_available');
    });

    autoUpdater.on('update-downloaded', () => {
        mainWindow.webContents.send('update_downloaded');
    });
}

module.exports.default = autoUpdaterListener;