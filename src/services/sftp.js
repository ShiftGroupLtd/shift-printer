const Client = require('ssh2-sftp-client');
const sftp = new Client();
const getFtpDetails = require('./ftpDetails').getSftpDetails;

module.exports.client = null;

const getClient = async () => {

    const ftpDetails = await getFtpDetails()

    const {
        ftpHost: host,
        ftpUsername: username,
        ftpPassword: password,
        ftpPort: port
    } = ftpDetails

    if(!module.exports.client) {
        module.exports.client = await connect({ host, username, password, port })
    }

    return module.exports.client
}
const connect = async ({ host, port, username, password }) => {
    try {
        return await sftp.connect({
            host,
            port,
            username,
            password
        });
    }
    catch (err) {
        console.log('sftp error', err)
    }
}

module.exports = {
    getClient,
}