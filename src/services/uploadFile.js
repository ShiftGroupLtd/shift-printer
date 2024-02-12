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
const successUploadsDirName = 'ftp_files_uploaded_successfully'
const errorUploadsDirName = 'ftp_files_failed';
const maxFileSizeMb = 10;
const acceptedFileTypes = []; // allow all
const acceptedMimeTypes = ['text/plain', 'text/csv'];
let validationError = null;

async function createFolder(folderName, basePath) {
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

const uploadFiles = async (mainWindow, basePath, [...filePaths]) => {

    const pendingUploadsPath = path.join(path.dirname(basePath), pendingFilesDirName);
    
    const pendingFilePaths = filePaths.map((filePath) => {
        const fileName = path.basename(filePath);

        // Validate the file before proceeding
        if (!validateUploadFile(filePath)) {
            updateStatusBar({ mainWindow, text: `Invalid file: ${fileName}. Reason: ${validationError}`, type: 'danger' });
            try {
                 moveFileToErrorFolder(basePath, filePath)
            }
            catch (err) {
                console.log('moveFilesToErrorFolder (1) error', err)
            }
            return null; // Skip to the next file
        }

        const moveFilePending = path.basename(filePath);
        const newFilePath = path.join(pendingUploadsPath, moveFilePending);
        fsExtra.renameSync(filePath, newFilePath); // 
        return newFilePath;
    }).filter((path) => path !== null);

    try {
        await uploadFilesFTP(mainWindow, pendingFilePaths, basePath);
        updateStatusBar({ mainWindow, text: `Uploaded files: ${new Date()}`, type: 'success' });
    } catch (error) {
        updateStatusBar({ mainWindow, text: `Error uploading files: ${error}`, type: 'danger' });
    }
};

const uploadFilesFTP = async (mainWindow, filePaths, basePath) => {
    const ftpDetails = await getSftpDetails();
    const { ftpHost, ftpUsername, ftpPassword, ftpPort, ftpTargetPath } = ftpDetails;

    await connect({ host: ftpHost, username: ftpUsername, password: ftpPassword, port: ftpPort });

    await Promise.all(
        filePaths.map(async (filePath) => {
            const fileName = path.basename(filePath);

            
            const targetPath = path.join(ftpTargetPath, fileName);
            
            const lastIndex = filePath.lastIndexOf(path.sep);
            const fileNameEnding = filePath.substring(lastIndex + 1);
            try {
                await getClient().fastPut(filePath, targetPath).then(async ()=> {
                    updateStatusBar({ mainWindow, text: `File Uploaded: ${fileNameEnding}`, type: 'success' });
                    await moveFileToSuccessUploadsFolder(basePath, filePath);
                });
            } catch (error) {
                logError(error, `Error uploading file "${fileName}" to FTP server: ${error.message}`);
                await moveFileToErrorFolder(basePath, filePath);
                throw error;
            }
        })
    );

    const lastIndex = basePath.lastIndexOf(path.sep);
    // Remove anything after the last '/'
    const basePathModified = basePath.substring(0, lastIndex);
    // Clear the pending directory just before closing the FTP client
    const pendingDirectory = `${basePathModified}${path.sep}ftp_files_pending`;

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

module.exports = {
    uploadFiles,
};

