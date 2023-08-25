const ipc = require('electron').ipcRenderer;

ipc.send('variable-request');

ipc.on('actionReplySuccess', function (event, response) {
    document.getElementById("loadingBg").remove();
});


ipc.send('checkLoader');

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

const authButton = document.getElementById("authenticate-button");
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
