const { app, ipcMain } = require("electron");
const settings = require('electron-settings');

const logout = () => {
    ipcMain.on('logout', async function (event, arg) {
        await settings.unset('auth');
        await settings.unset('printer');
        await settings.unset('ftpSettings');
        app.exit();
        app.relaunch();
    });
}

module.exports.default = logout;