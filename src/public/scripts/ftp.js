ipc.on('ftpDetails', function (event, response) {
    console.log('Received ftpDetails', {response})
    try {
        if(!response) {
            return;
        }

        const {ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort} = response
        document.getElementById('ftp_host').value = ftpHost
        document.getElementById('ftp_port').value = ftpPort
        document.getElementById('ftp_username').value = ftpUsername
        document.getElementById('ftp_password').value = ftpPassword
        document.getElementById('ftp_path').value = ftpPath
        document.getElementById('ftp_target_path').value = ftpTargetPath

        ui.advancedSettings.show()
    }
    catch (err) {
        console.error(err)
    }
});

ipc.on('ftpConnecting', function(_event, _response) {
    ui.statusBar.sftpConnecting()
})

ipc.on('ftpDetailsError', function (event, response) {
    console.log('Received updateFtpDetailsError', {response})
    try {
        ui.ftpSettingsWarning.setErrors(response.errors)
        ui.ftpSettingsSuccess.hide()
        ui.ftpSaveButton.enable()
        ui.ftpTestConnectionButton.enable()
        ui.statusBar.sftpDisconnected()
    }
    catch (err) {
        console.error(err)
    }
});

ipc.on('ftpDetailsSuccess', function (event, response) {
    console.log('Received updateFtpDetailsSuccess')
    try {
        ui.ftpSettingsWarning.clearErrors()
        ui.ftpSettingsSuccess.show()
        ui.ftpSettingsSuccess.setText(response.message)
        ui.ftpSaveButton.enable()
        ui.ftpTestConnectionButton.enable()
        ui.statusBar.sftpConnected()
    }
    catch (err) {
        console.error(err)
    }
});

ui.advancedSettings.elementBtn.addEventListener('click', (_event) => {
    ui.advancedSettings.toggleVisible()
});

/**
 * Test connection.
 */
ui.ftpTestConnectionButton.element.addEventListener('click', (_event) => {
    ui.ftpSettingsWarning.clearErrors()
    ui.ftpSettingsSuccess.hide()
    ui.ftpSaveButton.disable()
    ui.ftpTestConnectionButton.disable()
    ipc.send('testFtpDetails', getFtpSendToServerCredentialArgsArray());
})

/**
 * Update the ftp credentials & tests the connection.
 */
ui.ftpSaveButton.element.addEventListener('click', (event) => {
    try {
        ui.ftpSettingsSuccess.hide()
        ui.ftpSettingsWarning.clearErrors()

        const { success, errors } = validateFtp()

        if (!success) {
            ui.ftpSettingsWarning.setErrors(errors)
            return;
        }

        ipc.send('updateFtpDetails', getFtpSendToServerCredentialArgsArray());
        ui.statusBar.sftpConnecting()
        ui.ftpSaveButton.disable()
        ui.ftpTestConnectionButton.disable()
    }
    catch (err) {
        console.error(err)
    }
});

function getFtpSendToServerCredentialArgsArray() {
    const {ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort} = getFtpInputs()
    return [ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, parseInt(ftpPort)]
}

/**
 * @returns {{ftpHost: string, ftpUsername: string, ftpPassword: string, ftpPath: string, ftpPort: string, ftpTargetPath: string}}
 */
function getFtpInputs() {
    const ftpHost = document.getElementById('ftp_host').value,
        ftpPort = document.getElementById('ftp_port').value,
        ftpUsername = document.getElementById('ftp_username').value,
        ftpPassword = document.getElementById('ftp_password').value,
        ftpPath = document.getElementById('ftp_path').value,
        ftpTargetPath = document.getElementById('ftp_target_path').value;
    return {ftpHost, ftpPort, ftpUsername, ftpPassword, ftpPath, ftpTargetPath }
}

/**
 * @returns {{success: boolean, errors: string[]}}
 */
function validateFtp() {
    const errors = [];
    const { ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort } = getFtpInputs()

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
        errors.push('Please enter your local path')
    }
    if(ftpTargetPath.length === 0) {
        errors.push('Please enter your server target path')
    }
    if(ftpPort.length === 0) {
        errors.push('Please enter your FTP port')
    }

    return {
        success: !errors.length,
        errors,
    }
}