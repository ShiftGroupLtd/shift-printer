const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const mime = require('mime');
const getSftpDetails = require('./ftpDetails').getSftpDetails
const logError = require('./errorLogger').logError;
const {connect, getClient} = require("./sftp");
const {updateStatusBar} = require("./statusBar");

const pendingFilesDirName = 'ftp_files_pending'
const successUploadsDirName = 'ftp_files_uploaded_successfully'
const errorUploadsDirName = 'ftp_files_failed';
const maxFileSizeMb = 10
const acceptedFileTypes = []; // allow all
const acceptedMimeTypes = ['text/plain'];
let validationError = null;

/**
 * Handle file uploads.
 *
 * Process flow:
 * 1. Validate the file
 * 2. Move to pending uploads folder
 * 3. Upload to sftp server
 * 3.1 - If failed, move to the error folder
 * 3.2 - If successful, move to the success folder
 * 4. Remove no longer needed pending folder
 *
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * @param basePath {string}
 * @param filePath {string}
 * @returns {Promise<void>}
 */
const uploadFile = async (mainWindow, basePath, filePath) => {

    const fileName = path.basename(filePath);

    // Validate the file before proceeding
    if (!validateUploadFile(filePath)) {
        updateStatusBar({ mainWindow, text: 'Invalid file: ' + fileName + '. Reason: ' + validationError, type: 'danger'});
        try {
            await moveFileToErrorFolder(basePath, filePath)
        }
        catch (err) {
            console.log('moveFilesToErrorFolder (1) error', err)
        }
        return;
    }

    // Move the file to the pending folder
    await moveFileToPendingFolder(basePath, filePath)
    filePath = `${path.join(path.dirname(basePath), pendingFilesDirName, fileName)}`;

    //  Handle SFTP upload
    updateStatusBar({ mainWindow, text: 'Uploading file: '+fileName})
    uploadFileFTP(mainWindow, filePath, basePath).then(async () => {
        try {
            // Move the file to the success folder
            await moveFileToSuccessUploadsFolder(basePath, filePath)
        }
        catch (err) {}

        // Success
        const successMessage = `File uploaded successfully: ${path.basename(filePath)}`
        updateStatusBar({mainWindow, text: successMessage, type: 'success'})

        // Clean up and remove pending folder
        try {
            await removePendingFolder(basePath)
        }
        catch (err) {}
    })
    .catch(async (err) => {
        logError(err, 'uploadFileFTP error')
        updateStatusBar({ mainWindow, text: 'Upload error: '+err.message, type: 'danger'});
        try {
            await moveFileToErrorFolder(basePath, filePath)
        }
        catch (err) {
            logError(err, 'moveFilesToErrorFolder (2) error')
        }
    })

}

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 * @param filePath {string}
 * @param basePath {string}
 * @returns {Promise<void>}
 */
const uploadFileFTP = async (mainWindow, filePath, basePath) => {
    console.log('uploadFileSFTP started', path.basename(filePath))
    updateStatusBar({ mainWindow, text: 'Uploading file'});

    const ftpDetails = await getSftpDetails()
    const { ftpHost, ftpUsername, ftpPassword, ftpPort, ftpTargetPath } = ftpDetails

    await connect({ host: ftpHost, username: ftpUsername, password: ftpPassword, port: ftpPort })
    const targetPath = `${ftpTargetPath}/${path.basename(filePath)}`

    // Upload the file to the FTP server using the 'put' method
    await getClient().fastPut(filePath, targetPath);

    // Close the SFTP connection
    await getClient().end();
}

/**
 * Creates a folder at a specified path.
 * @param folderName {string} The name of the folder to create.
 * @param basePath {string} The base path where the folder should be created.
 * @returns {Promise<void>}
 */
const createFolder = async (folderName, basePath) => {
    // Create the folder one level above basePath
    const folderPath = path.join(path.dirname(basePath), path.basename(folderName));

    try {
        // Check if the folder already exists
        await fs.access(folderPath);
    } catch (error) {
        // If it doesn't exist, create it
        if (error.code === 'ENOENT') {
            try {
                await fs.mkdir(folderPath);
                console.log(`Created ${folderName} folder at ${folderPath}`);
            } catch (mkdirError) {
                logError(mkdirError, `Error creating ${folderName} folder: ${mkdirError.message}`)
            }
        } else {
            logError(error, `Error accessing ${folderName} folder: ${error.message}`)
        }
    }
};


/**
 * Move to pending uploads folder
 * @param basePath {string}
 * @param filePath {string}
 * @returns {Promise<void>}
 */
const moveFileToPendingFolder = async (basePath, filePath) => {
    const pendingUploadsPath = path.join(path.dirname(basePath), pendingFilesDirName);

    try {
        // Create the pending folder if it doesn't exist
        await createFolder(pendingFilesDirName, basePath)

        // Extract the file name from the file path
        const fileName = path.basename(filePath);

        // Construct the new path for the file in the pending_uploads folder
        const newFilePath = path.join(pendingUploadsPath, fileName);

        // Move the file to the pending_uploads folder
        await fs.rename(filePath, newFilePath);
        console.log(`Moved file "${fileName}" to pending folder`);
    } catch (error) {
        logError(error, `Error moving file to pending_uploads folder: ${error.message}`)
    }
};

/**
 * Moves a file to the error folder.
 * @param basePath {string} The base path where the file is located.
 * @param filePath {string} The path to the file.
 * @returns {Promise<void>}
 */
const moveFileToErrorFolder = async (basePath, filePath) => {
    const errorPath = path.join(path.dirname(basePath), errorUploadsDirName);

    try {
        // Create the pending folder if it doesn't exist
        await createFolder(errorUploadsDirName, basePath)

        // Extract the file name from the file path
        const fileName = path.basename(filePath);

        // Construct the new path for the file in the pending_uploads folder
        const newFilePath = path.join(errorPath, fileName);

        // Move the file to the pending_uploads folder
        await fs.rename(filePath, newFilePath);
        console.log(`Moved file "${fileName}" to error folder`);
    } catch (error) {
        logError(error, `Error moving file to error folder: ${error.message}`)
    }
};

/**
 * Moves a file to the success uploads folder.
 * @param basePath {string} The base path where the file is located.
 * @param filePath {string} The path to the file.
 * @returns {Promise<void>}
 */
const moveFileToSuccessUploadsFolder = async (basePath, filePath) => {
    const successUploadsDirPath = path.join(path.dirname(basePath), successUploadsDirName);

    try {
        // Create the success folder if it doesn't exist
        await createFolder(successUploadsDirPath, basePath)

        // Construct the destination path
        const destinationPath = path.join(successUploadsDirPath, path.basename(filePath));

        // Move the file to the success uploads folder
        await fs.rename(filePath, destinationPath);
        console.log('File moved to success uploads folder:', destinationPath);
    } catch (error) {
        logError(error, 'Error moving file to success uploads folder:'+ error)
    }
};

/**
 * @param basePath {string}
 * @returns {Promise<void>}
 */
const removePendingFolder = async (basePath) => {
    const pendingUploadsPath = path.join(path.dirname(basePath), pendingFilesDirName);
    await fs.rmdir(pendingUploadsPath, { recursive: true });
}

/**
 * @param filePath {string}
 * @returns {boolean}
 */
const validateUploadFile = (filePath) => {
    const fileSizeInMb = fsSync.statSync(filePath).size / (1024 * 1024); // Calculate file size in megabytes
    const fileExtension = path.extname(filePath).toLowerCase().substring(1); // Get file extension without the dot

    if (fileSizeInMb > maxFileSizeMb) {
        validationError = 'File size exceeds the maximum allowed size.';
        return false;
    }

    if (acceptedFileTypes.length && !acceptedFileTypes.includes(fileExtension)) {
        validationError = 'File type is not accepted.';
        return false;
    }

    const fileMimeType = mime.getType(filePath); // Get the MIME type of the file

    if (acceptedMimeTypes.length && !acceptedMimeTypes.includes(fileMimeType)) {
        validationError = 'MIME type is not accepted. ('+fileMimeType+')';
        return false;
    }

    return true;
};


module.exports = {
    uploadFile,
}