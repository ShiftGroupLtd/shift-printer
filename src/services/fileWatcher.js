const chokidar = require('chokidar');
const uploadFiles = require('./uploadFile').uploadFiles;
const getFtpDetails = require('./ftpDetails').getSftpDetails
const fs = require('fs').promises;
const path = require('path');
const {updateStatusBar} = require("./statusBar");
const {logError} = require("./errorLogger");

module.exports.watcher = null;
let intervalHandle;

/**
 * @param basePath {string}
 * @param filePaths {string[]} Array of file paths
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 */
const onFileChange = ({mainWindow, basePath, filePaths }) => {
    try {
        updateStatusBar({mainWindow, text: 'Preparing number of files: ' + filePaths.length});
        uploadFiles(mainWindow, basePath, filePaths);
    }
    catch (err) {
        console.log('onFileChange error', err);
        updateStatusBar({mainWindow, text: err.message, type: 'danger'});
    }
};

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * @returns {Promise<void>}
 */
const startFileWatcher = async ({ mainWindow }) => {
    
    const checkValid = async function() {
        console.log('startFileWatcher checking');
        try {
            const ftpDetails = await getFtpDetails();

            if(ftpDetails == null) {
                return;  
            }
            const path = ftpDetails.ftpPath;

            if (validatePath(path)) {
                await createFolder('ftp_files_pending', path);
                fileWatcher({mainWindow, basePath: path});
                updateStatusBar({mainWindow, text: 'Watching for file changes'});
                console.log('Started file watcher');
            }
        } catch (err) {
            logError(err);
        }
    };

    intervalHandle = setInterval(checkValid, 3000);
};


const createFolder = async (folderName, basePath) => {
    const folderPath = path.join(path.dirname(basePath), path.basename(folderName));
    try {
        await fs.access(folderPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            try {
                await fs.mkdir(folderPath, { recursive: true });
                console.log(`Created ${folderName} folder at ${folderPath}`);
            } catch (mkdirError) {
                logError(mkdirError, `Error creating ${folderName} folder: ${mkdirError.message}`);
            }
        } else {
            logError(error, `Error accessing ${folderName} folder: ${error.message}`);
        }
    }
};

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * @param basePath {string}
 */
const fileWatcher =  ({ mainWindow, basePath }) => {
    if(module.exports.watcher) {
        console.log('fileWatcher already started');
        return;
    }

    //create folder first




    clearInterval(intervalHandle);

    let timeoutHandle = null;
    const changedFilePaths = [];

    try {
        module.exports.watcher = chokidar.watch(basePath)
            .on('add', (path) => {
                console.log('fileWatcher new event', 'file:', path, 'basePath :', basePath);
                changedFilePaths.push(path);
                if (timeoutHandle === null) {
                    timeoutHandle = setTimeout(() => {
                        onFileChange({ mainWindow, basePath, filePaths: changedFilePaths });
                        changedFilePaths.length = 0; // clear the array
                        timeoutHandle = null;
                    }, 5000); // Change this value to your desired timeout in milliseconds
                }
            });
    }
    catch (err) {
        logError(err);
    }
};

const stopFileWatcher = () => {
    if(module.exports.watcher) {
        module.exports.watcher.close();
        module.exports.watcher = null;
    }
};

/**
 * @param path {string}
 * @returns {Promise<boolean>}
 */
const validatePath = async (path) => {
    try {
        await fs.access(path);
        return true;
    } catch (error) {
        return false;
    }
};


module.exports = {
    startFileWatcher,
    stopFileWatcher,
    validatePath,
};

