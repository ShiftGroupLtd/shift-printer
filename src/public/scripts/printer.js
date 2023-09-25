
document.getElementById("printer").addEventListener('input', (item) => {
    const text = document.getElementById("printer").value;
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
    ipc.send('printerValue', [document.getElementById("printer").value]);
});


ipc.on('printerList', function (event, response) {
});

ipc.on('actionReplySuccess', function (_event, _response) {
    try {
        document.getElementById("loadingBg").remove();
        document.getElementById('iframe').src = 'https://app.shift.online';
    }
    catch (err) {
        console.error(err)
    }
});