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

module.exports = {
    useErrorLogger,
    logError
}