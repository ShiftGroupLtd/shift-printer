/**
 * @type {Electron.CrossProcessExports.BrowserWindow}
 */
let browserWindow = null;

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 */
const useErrorLogger = ({ mainWindow }) => {
    browserWindow = mainWindow
}

/**
 * @param err {Error}
 * @param message {string}
 */
const logError = (err, message= '') => {
    if(!browserWindow) {
        return;
    }

    console.error(err)
    browserWindow.webContents.send('error', {err,message})
}

const logInfo = (info) => {
    if(!browserWindow) {
        return;
    }

    browserWindow.webContents.send('error', info)
}

module.exports = {
    useErrorLogger,
    logError,
    logInfo
}