const ipc = require('electron').ipcRenderer;
const version = document.getElementById('version');
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
const authButton = document.getElementById("authenticate-button");

ipc.send('variable-request');
ipc.send('checkLoader');
ipc.send('app_version');

ipc.on('actionReplySuccess', function (event, response) {
    document.getElementById("loadingBg").remove();
});


ipc.on('closeLoader', function (event, response) {
    document.getElementById("loadingBg").remove();
});

ipc.on('printerList', function (event, response) {
    let sel = document.querySelector('.form-select');
    response.forEach((item) => {
        let opt = document.createElement('option');
        opt.value = item.deviceId;
        let option = document.createTextNode(item.deviceId);
        opt.appendChild(option);
        sel.appendChild(opt);
    })
});

if(authButton) {
    authButton.addEventListener("click", () => {
        ipc.once('actionReply', (event, response) => {
            console.log("Hello world!", response);
        })
        ipc.send('invokeAction');
    });
}

document.getElementById("accountNumber").addEventListener('input', (item) => {
    if(item.data >= 1){
        document.getElementById("submitBtn").disabled = false;
        document.getElementById("submitBtn").className = 'btn btn-primary'; 
    } else {
        document.getElementById("submitBtn").disabled = true;
        document.getElementById("submitBtn").className = 'btn'; 
    }
});

document.getElementById("submitBtn").addEventListener('click', () => {
    let = formList = document.getElementById('select-form'); 
    ipc.send('invokeAction', [formList.options[formList.selectedIndex].value, document.getElementById("accountNumber").value]);
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

function closeNotification() {
    notification.classList.add('hidden');
}
function restartApp() {
    ipcRenderer.send('restart_app');
}