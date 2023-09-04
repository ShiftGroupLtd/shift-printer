const chokidar = require('chokidar');
const uploadFileService = require('./uploadFile').default;

const onFileChange = (path) => {
    console.log('fileWatcher file: ', path)
    uploadFileService({ file: path })
}
const fileWatcher = ({ path }) => {
    try {
        const watcher = chokidar.watch(path).on('all', (event, path) => {
            console.log('fileWatcher watch', event, path);
        });

        // Add event listeners.
        watcher
            .on('add', onFileChange)
            .on('change', onFileChange)
            .on('unlink', onFileChange)

    }
    catch (err) {
        console.error(err)
    }
}

module.exports.default = fileWatcher