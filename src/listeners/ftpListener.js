const { ipcMain } = require('electron');
const {updateSftpDetails: updateFtpDetailsService} = require("../services/ftpDetails");
const {getClient} = require("../services/sftp");
const {connect, validatePath: validateServerPath} = require("../services/sftp")
const {stopFileWatcher, startFileWatcher} = require("../services/fileWatcher");
const {logError} = require("../services/errorLogger");
const getFtpDetails = require('../services/ftpDetails').getSftpDetails;
const validatePath = require('../services/fileWatcher').validatePath;

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 */
const ftpListener = ({ mainWindow }) => {
    /**
     * Sends FTP details to UI.
     */
    ipcMain.on('ftpDetails', async (event) => {
        console.log('Received ftpDetails request')
        const ftpDetails = await getFtpDetails()
        event.sender.send('ftpDetails', ftpDetails);
    });

    /**
     * Updates FTP details to settings.
     */
    ipcMain.on('updateFtpDetails', async (event, data) => {
        console.log('updateFtpDetails', data)

        const {ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort} = extractData(data)
        await updateFtpDetailsService({ ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort })

        // Attempt connection to SFTP server
        if(await attemptConnection({
            host: ftpHost,
            username: ftpUsername,
            password: ftpPassword,
            port: ftpPort,
            successMessage: 'Successfully connected & ftp credentials saved.',
            localPath: ftpPath,
            targetPath: ftpTargetPath,
        }, event)) {
            // restart file watcher
            stopFileWatcher()
            await startFileWatcher({ mainWindow })
        }
    });

    /**
     * Tests the SFTP connection.
     */
    ipcMain.on('testFtpDetails', async (event, data) => {
        const {ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort} = extractData(data)

        // Attempt connection to SFTP server
        await attemptConnection({
            host: ftpHost,
            username: ftpUsername,
            password: ftpPassword,
            port: ftpPort,
            successMessage: 'Connection OK.',
            localPath: ftpPath,
            targetPath: ftpTargetPath
        }, event)
    })

    console.log('ftp listener started')
}

/**
 * @param successMessage {string}
 * @param localPath {string}
 * @param targetPath {string}
 * @param credentials {{host: string, username: string, password: string, port: number}}
 * @param event
 * @returns {Promise<boolean>}
 */
const attemptConnection = async ({successMessage, localPath, targetPath, ...credentials}, event) => {
    try {
        await event.sender.send('ftpConnecting')
        await connect(credentials)
        const client = getClient()

        if(!validatePath(localPath)) {
            throw new Error('Local folder path does not exist')
        }

        await validateServerPath(targetPath)

        await client.end()

        event.sender.send('ftpDetailsSuccess', {message: successMessage})

        return true
    }
    catch (err) {
        event.sender.send('ftpDetailsError', {errors: [err.message]})
        logError(err)
    }

    return false
}

/**
 * @param data
 * @returns {{ftpHost: string, ftpUsername: string, ftpPassword: string, ftpPath: string, ftpTargetPath: string, ftpPort: null}|*[]}
 */
const extractData = (data) => {
    try {
        const [ftpHost = '', ftpUsername = '', ftpPassword = '', ftpPath = '', ftpTargetPath = '', ftpPort = null] = data
        return { ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort }
    }
    catch (err) {
        logError(err)
    }

    return []
}
module.exports.default = ftpListener;