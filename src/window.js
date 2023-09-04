const ipc = require('electron').ipcRenderer;
const version = document.getElementById('version');
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
const advancedSettingsBtn = document.getElementById("advancedSettingsBtn")
const advancedSettings = document.getElementById('advancedSettings');
const ftpSettingsWarning = document.getElementById('ftpSettingsWarning');
const ftpSettingsSuccess = document.getElementById('ftpSettingsSuccess');

ipc.send('variable-request');
ipc.send('checkLoader');
ipc.send('app_version');

ipc.on('actionReplySuccess', function (event, response) {
    document.getElementById("loadingBg").remove();
});

ipc.on('ftpDetails', function (event, response) {
    try {
        console.log('Recieved FTP details', {response})
        const {ftpHost, ftpUsername, ftpPassword, ftpPath, ftpPort} = response

        document.getElementById('ftp_host').value = ftpHost
        document.getElementById('ftp_username').value = ftpUsername
        document.getElementById('ftp_password').value = ftpPassword
        document.getElementById('ftp_path').value = ftpPath
        document.getElementById('ftp_port').value = ftpPort
        advancedSettings.style.display = 'block';
    }
    catch (err) {
        console.error(err)
    }
});

ipc.on('closeLoader', function (event, response) {
    document.getElementById("loadingBg").remove();
});

ipc.on('printerList', function (event, response) {
});

document.getElementById("printer").addEventListener('input', (item) => {
    text = document.getElementById("printer").value;
    if(text.length >= 1){
        document.getElementById("submitBtn").disabled = false;
        document.getElementById("submitBtn").className = 'btn btn-primary'; 
    } else {
        document.getElementById("submitBtn").disabled = true;
        document.getElementById("submitBtn").className = 'btn'; 
    }
});

document.getElementById("submitBtn").addEventListener('click', (event) => {
    event.preventDefault();
    let formList = document.getElementById('select-form');
    ipc.send('invokeAction', [document.getElementById("printer").value]);

    // todo: If FTP entered, then send to index.js
    // todo: invokeFTPAction
});

advancedSettingsBtn.addEventListener('click', (event) => {
    const display = {block: 'none', none: 'block'}
    const text = {block: 'Advanced Settings', none: 'Hide Advanced Settings'}
    advancedSettingsBtn.innerText = text[advancedSettings.style.display]
    advancedSettings.style.display = display[advancedSettings.style.display]
});

document.getElementById("saveFtpSettingsBtn").addEventListener('click', (event) => {
    try {
        ftpSettingsWarning.style.display = 'none';
        ftpSettingsSuccess.style.display = 'none';

        const errors = [];
        const ftpHost = document.getElementById('ftp_host').value,
            ftpUsername = document.getElementById('ftp_username').value,
            ftpPassword = document.getElementById('ftp_password').value,
            ftpPath = document.getElementById('ftp_path').value,
            ftpPort = document.getElementById('ftp_port').value;

        if(ftpHost.length === 0) {
            errors.push('Please enter your FTP host')
        }
        if (ftpUsername.length === 0) {
            errors.push('Please enter your FTP username')
        }
        if (ftpPassword.length === 0) {
            errors.push('Please enter your FTP password')
        }
        if (ftpPath.length === 0) {
            errors.push('Please enter your FTP folder path')
        }
        if(ftpPort.length === 0) {
            errors.push('Please enter your FTP port')
        }

        if (errors.length) {
            ftpSettingsWarning.style.display = 'block';
            ftpSettingsWarning.innerHTML = '<ul class="list-group">' + errors.map((error) => `<li class="list-group-item">${error}</li>`).join('') + '</ul>';
            return;
        }

        ipc.send('updateFTPDetails', [ftpHost, ftpUsername, ftpPassword, ftpPath, parseInt(ftpPort)]);
        ftpSettingsSuccess.style.display = 'block';
    }
    catch (err) {
        console.error(err)
    }
});

document.getElementById("version").addEventListener('click', (event) => {
    ipc.send('logout', true);
});

ipc.on('app_version', (event, arg) => {
    ipc.removeAllListeners('app_version');
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
   console.log(message);
});

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

