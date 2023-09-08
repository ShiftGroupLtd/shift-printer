/**
 * @type {Electron.IpcRenderer}
 * @global
 */
const ipc = require('electron').ipcRenderer;
const version = document.getElementById('version');
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

document.addEventListener('DOMContentLoaded', () => {
    try {
        // todo: Find out why this doesn't work without the setTimeout
        setTimeout(() => {
            ipc.send('variable-request');
            ipc.send('checkLoader'); // calls closeLoader
            ipc.send('appVersion');
            ipc.send('ftpDetails');
        },1000)
    }
    catch (err) {
        console.error(err)
    }

    ui.statusBar.idle()
})

ipc.on('closeLoader', function (event, response) {
    document.getElementById("loadingBg").remove();
    document.getElementById('iframe').src = 'https://app.shift.online'
});

document.getElementById("version").addEventListener('click', (event) => {
    if(window.confirm('Are you sure you want to logout?')) {
        ipc.send('logout', true);
    }
});

ipc.on('appVersion', (event, arg) => {
    console.log('Received appVersion')
    ipc.removeAllListeners('appVersion');
    version.innerText = 'Version ' + arg.version;
});

ipc.on('update_available', () => {
    ipc.removeAllListeners('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    notification.classList.remove('hidden');
});

ipc.on('update_downloaded', () => {
    ipc.removeAllListeners('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
});

ipc.on('error', (error, message) => {
   console.error(message);
});

ipc.on('info', (error, message) => {
    console.log(message);
});

/**
 * @param {Object} args - The argument object.
 * @param {string} args.type - The type of the status bar.
 * @param {string} args.message - The message to display in the status bar.
 */
ipc.on('statusBar', (error, args) => {
    ui.statusBar.setClass(args.type)
    ui.statusBar.setText(args.message)
})

window.addEventListener(
    "message",
    (event) => {
        if (event.origin !== "https://app.shift.online") {
            return;
        }

        if (event.data.token) {
            ipc.send('setToken', [event.data.token, event.data.accountId]);
        }
    }
);

document.addEventListener("keydown", function(event) {
    // Check if both Ctrl and I keys are pressed simultaneously
    if (event.ctrlKey && event.key === "i") {
        ipc.send('devTools')
    }
});

