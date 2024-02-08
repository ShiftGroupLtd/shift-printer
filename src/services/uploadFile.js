const fs = require('fs').promises;
const fsExtra = require('fs-extra');
const fsSync = require('fs');
const path = require('path');
const mime = require('mime');
const { getSftpDetails } = require('./ftpDetails');
const { logError } = require('./errorLogger');
const { connect, getClient } = require("./sftp");
const { updateStatusBar } = require("./statusBar");

const pendingFilesDirName = 'ftp_files_pending';
const maxFileSizeMb = 10;
const acceptedFileTypes = []; // allow all
const acceptedMimeTypes = ['text/plain', 'text/csv'];
let validationError = null;

const uploadFiles = async (mainWindow, basePath, filePaths) => {
    const filePathsCopy = [...filePaths];
    const pendingUploadsPath = path.join(path.dirname(basePath), pendingFilesDirName);
    for (const filePath of filePaths) {
        const fileName = path.basename(filePath);

        // Validate the file before proceeding
        if (!validateUploadFile(filePath)) {
            updateStatusBar({ mainWindow, text: `Invalid file: ${fileName}. Reason: ${validationError}`, type: 'danger' });
            continue; // Skip to the next file
        }

        const moveFilePending = path.basename(filePath);
        const newFilePath = path.join(pendingUploadsPath, moveFilePending);
        fsExtra.renameSync(filePath, newFilePath); // 

    }

    try {
        await uploadFilesFTP(mainWindow, filePathsCopy, basePath);
        updateStatusBar({ mainWindow, text: `Uploaded files: ${new Date()}`, type: 'success' });
    } catch (error) {
        updateStatusBar({ mainWindow, text: `Error uploading files: ${error}`, type: 'danger' });
    }
};

const uploadFilesFTP = async (mainWindow, filePaths, basePath) => {

    const ftpDetails = await getSftpDetails();
    const { ftpHost, ftpUsername, ftpPassword, ftpPort, ftpTargetPath } = ftpDetails;

    await connect({ host: ftpHost, username: ftpUsername, password: ftpPassword, port: ftpPort });

    await Promise.allSettled(filePaths.map(async (filePath) => {
        const fileName = path.basename(filePath);
        const targetPath = `${ftpTargetPath}/${fileName}`;
        const basePathParts = basePath.split('/');
        basePathParts.pop();
        let newBasePath = basePathParts.join('/') + '/';

        const lastIndex = filePath.lastIndexOf('/');
        const fileNameEnding = filePath.substring(lastIndex + 1);

        try {
            await getClient().fastPut(`${newBasePath}ftp_files_pending/${fileNameEnding}`, targetPath);
            updateStatusBar({ mainWindow, text: `File Uploaded: ${fileNameEnding}`, type: 'success' });
        } catch (error) {
            logError(error, `Error uploading file "${fileName}" to FTP server: ${error.message}`);
            throw error;
        }
    }));

    var lastIndex = basePath.lastIndexOf('/');
    // Remove anything after the last '/'
    var basePathModified = basePath.substring(0, lastIndex);
    // Clear the pending directory just before closing the FTP client
    const pendingDirectory = `${basePathModified}/ftp_files_pending`;
    try {
        const pendingFiles = await fs.readdir(pendingDirectory);
        await Promise.all(pendingFiles.map(async (file) => {
            const filePath = path.join(pendingDirectory, file);
            await fs.unlink(filePath);
            console.log(`Deleted file: ${file}`);
        }));
    } catch (error) {
        console.error(`Error clearing pending directory: ${error}`);
    }
  
    await getClient().end();
};

const validateUploadFile = (filePath) => {
    const fileSizeInMb = fsSync.statSync(filePath).size / (1024 * 1024);
    const fileExtension = path.extname(filePath).toLowerCase().substring(1);

    if (fileSizeInMb > maxFileSizeMb) {
        validationError = 'File size exceeds the maximum allowed size.';
        return false;
    }

    if (acceptedFileTypes.length && !acceptedFileTypes.includes(fileExtension)) {
        validationError = 'File type is not accepted.';
        return false;
    }

    const fileMimeType = mime.getType(filePath);
    if (acceptedMimeTypes.length && !acceptedMimeTypes.includes(fileMimeType)) {
        validationError = `MIME type is not accepted. (${fileMimeType})`;
        return false;
    }

    return true;
};

module.exports = {
    uploadFiles,
};