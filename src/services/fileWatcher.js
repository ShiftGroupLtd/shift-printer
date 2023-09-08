const chokidar = require('chokidar');
const uploadFile = require('./uploadFile').uploadFile;
const getFtpDetails = require('./ftpDetails').getSftpDetails
const fs = require('fs');
const path = require('path');
const {updateStatusBar} = require("./statusBar");
const {logError} = require("./errorLogger");

module.exports.watcher = null;
let intervalHandle

/**
 * @param basePath {string}
 * @param filePath {string}
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 */
const onFileChange = ({basePath, filePath, mainWindow}) => {
    try {
        updateStatusBar({mainWindow, text: 'Preparing file: ' + path.basename(filePath)})

        // Delay the upload so the user can see the file disappear after time and not immediately
        setTimeout(() => {
            uploadFile(mainWindow, basePath, filePath)
        }, 1000)
    }
    catch (err) {
        console.log('onFileChange error', err)
        updateStatusBar({mainWindow, text: err.message, type: 'danger'})
    }
}

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * @returns {Promise<void>}
 */
const startFileWatcher = async ({ mainWindow }) => {

    /**
     * Only start the file watcher once we have a successful connection to the SFTP server.
     */
    const checkValid = async function() {
        console.log('startFileWatcher checking')

        try {
            const ftpDetails = await getFtpDetails()
            const {ftpPath: path} = ftpDetails

            if (validatePath(path)) {

                fileWatcher({mainWindow, basePath: path})

                updateStatusBar({mainWindow, text: 'Watching for file changes'})

                console.log('Started file watcher')
            }
        } catch (err) {
            // Prevent exception
            logError(err)
        }
    }

    intervalHandle = setInterval(checkValid, 3000)
}

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * @param basePath {string}
 */
const fileWatcher = ({ mainWindow, basePath }) => {
    if(module.exports.watcher) {
        console.log('fileWatcher already started')
        return;
    }

    clearInterval(intervalHandle)

    try {
        module.exports.watcher = chokidar.watch(basePath)
            .on('all', (event, path) => {
                console.log('fileWatcher new event', event, path);
            });

        const handleOnFileChange = (filePath) => onFileChange({ mainWindow, basePath, filePath })

        // Add event listeners we care about
        module.exports.watcher
            .on('add', handleOnFileChange)
            .on('change', handleOnFileChange)

        console.log('fileWatcher listening', basePath)
    }
    catch (err) {
        logError(err)
    }
}

const stopFileWatcher = () => {
    if(module.exports.watcher) {
        module.exports.watcher.close()
        module.exports.watcher = null
    }
}

/**
 * @param path {string}
 * @returns {boolean}
 */
const validatePath = (path) => {
    return fs.existsSync(path)
}

module.exports = {
    startFileWatcher,
    stopFileWatcher,
    validatePath,
}