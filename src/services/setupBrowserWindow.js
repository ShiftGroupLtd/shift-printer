const path = require("path");
const {BrowserWindow} = require("electron");

/**
 * @param  basePath {string}
 * @param browserWindowOptions {Electron.BrowserWindowConstructorOptions}
 * @returns {Electron.CrossProcessExports.BrowserWindow}
 */
const setupBrowserWindow = async ({ basePath, browserWindowOptions }) => {
    const mainWindow = new BrowserWindow(browserWindowOptions)

    await mainWindow.loadFile(path.join(basePath, '/public/index.html'));

    return mainWindow;
}

module.exports.default = setupBrowserWindow