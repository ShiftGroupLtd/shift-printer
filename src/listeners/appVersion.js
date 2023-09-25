const { app, ipcMain } = require('electron');

const appVersion = () => {
    ipcMain.on('appVersion', async (event) => {
        console.log('Received app_version request')
        event.sender.send('appVersion', { version: app.getVersion() });
    });

    console.log('App version listener started')
}

module.exports.default = appVersion;