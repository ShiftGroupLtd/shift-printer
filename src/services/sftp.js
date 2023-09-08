const Client = require('ssh2-sftp-client');
const sftp = new Client();

module.exports.client = null;

const getClient = () => sftp;

const connect = async ({ host, port, username, password }) => {
    return await sftp.connect({
        host,
        port,
        username,
        password
    });
}

const validatePath = async (path) => {
    const client = getClient()
    const remotePathExists = await client.exists(path);

    if (!remotePathExists) {
        throw new Error('Target folder path does not exist on the remote server');
    }

    await client.end();
}

module.exports = {
    connect,
    getClient,
    validatePath,
}