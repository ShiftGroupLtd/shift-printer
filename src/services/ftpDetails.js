const settings = require("electron-settings");

const settingsKey = 'ftpSettings';

/**
 * @returns {Promise<{ftpHost: string, ftpUsername: string, ftpPassword: string, ftpPath: string, ftpPort: number, ftpTargetPath: string}|null>}
 */
async function getSftpDetails()
{
    if(!await settings.has(settingsKey)) {
        return null;
    }

    const defaults = {
        ftpPath: 'C:\\',
        ftpTargetPath: '/',
        ftpOfflinePrinting: 'off'
    }

    const data = await settings.get(settingsKey)

    return {
        ...defaults,
        ...data
    }
}

async function updateSftpDetails({ ftpHost, ftpUsername, ftpPassword, ftpPath, ftpTargetPath, ftpPort, ftpOfflinePrinting})
{
    // Remove trailing / on ftpTargetPath
    // It as added on automatically when it comes to uploading.
    if (ftpTargetPath.endsWith('/')) {
        ftpTargetPath = ftpTargetPath.slice(0, -1);
    }

    await settings.set(settingsKey, {
        ftpHost,
        ftpUsername,
        ftpPassword,
        ftpPath,
        ftpTargetPath,
        ftpPort,
        ftpOfflinePrinting
    })
}

module.exports = {
    getSftpDetails,
    updateSftpDetails
}