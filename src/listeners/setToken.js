const { ipcMain: ipc } = require("electron");
const settings = require("electron-settings");

const setTokenListener = () => {
    ipc.on('setToken', async (event, data) => {
        if(data.length && data.length === 2) {
            await settings.set('auth', {
                token: data[0],
                accountId: data[1],
            });
            console.log('set token...');
        }
    });
}

module.exports.default = setTokenListener