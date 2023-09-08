/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * @param text {string}
 * @param type {('success'|'info'|'warning'|'danger')}
 */
const updateStatusBar = ({ mainWindow, text, type = 'info'}) => {
    mainWindow.webContents.send('statusBar', {message: text, type});
}

module.exports = {
    updateStatusBar,
}