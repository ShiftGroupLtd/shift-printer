const { ipcMain } = require("electron");
const devToolsService = require("../services/devTools").default

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 */
const devToolsListener = ({ mainWindow }) => {
    ipcMain.on('devTools', async (_event, _data) => {
        console.log('Received devTools')
        devToolsService({ mainWindow })
    })
}

module.exports.default = devToolsListener;