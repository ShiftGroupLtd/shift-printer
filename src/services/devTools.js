/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * Note: Ensure that you are calling openDevTools() after the mainWindow has been created and loaded. If you call it before the window is ready, it may not work as expected.
 * Example: mainWindow.once('ready-to-show', () => { ... }; openDevTools();
 */
const devTools = ({ mainWindow }) => {
    if(mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
        return;
    }

    mainWindow.webContents.openDevTools();
}

module.exports.default = devTools;