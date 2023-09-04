const settings = require("electron-settings");

const settingsKey = 'ftpSettings';

/**
 * @returns {Promise<{ftpHost: string, ftpUsername: string, ftpPassword: string, ftpPath: string, ftpPort: number}|null>}
 */
async function getSftpDetails()
{
    if(!await settings.has(settingsKey)) {
        return null;
    }

    return await settings.get(settingsKey)
}

async function updateSftpDetails({ ftpHost, ftpUsername, ftpPassword, ftpPath, ftpPort })
{
    await settings.set(settingsKey, {
        ftpHost,
        ftpUsername,
        ftpPassword,
        ftpPath,
        ftpPort,
    })
}

module.exports = {
    getSftpDetails,
    updateSftpDetails
}