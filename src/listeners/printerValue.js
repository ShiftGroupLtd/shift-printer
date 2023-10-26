const settings = require("electron-settings");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {exec} = require("child_process");
const { ipcMain } = require("electron");
const hostName = require('os').hostname();

const {logError} = require("../services/errorLogger");

/**
 * @param mainWindow {Electron.CrossProcessExports.BrowserWindow}
 */
const printerValue = ({ mainWindow }) => {
    ipcMain.on('printerValue', async (event, data) => {
        console.log('Received printer details', {data})

        if(data.length) {
            await settings.set('printer', {
                name: data[0],
                location: data[1],
            });

            console.log('Send actionReplySuccess')
            return event.sender.send('actionReplySuccess');
        }

        console.log('Send actionReplyFail')
        return event.sender.send('actionReplyFail');
    });


    ipcMain.on('checkLoader', async function (event, arg) {
        console.log('checkLoader')
        await startPrinter();

        //if printer name is set close it
        const printerName = await settings.has('printer.name');
        if(!printerName) {
            return;
        }
        event.sender.send('closeLoader');
    });

    const startPrinter = async () => {
        console.log('startPrinter started')

        setInterval(async() => {

            try {
                let authToken = await settings.has('auth.token');
                let accountId =  await settings.has('auth.accountId');
                let printerName = await settings.has('printer.name');
                let printerLocation = await settings.has('printer.location');

                console.log('startPrinter debug 1', {authToken, accountId, printerName})

                if(!authToken || !accountId || !printerName) {
                    return;
                }

                authToken = await settings.get('auth.token');
                accountId =  await settings.get('auth.accountId');
                printerName = await settings.get('printer.name');

                if(printerLocation) {
                    data = {
                        accountId : accountId,
                        location : await settings.get('printer.location')
                    }
                } else {
                    data = {
                        accountId : accountId
                    }
                }

                console.log('url', {url})

                const config = {
                    method: 'post',
                    url: 'https://api.shift.online/business-dashboard/v1/printer/autoPrint',
                    headers: {
                        'Authorization': "Bearer " + authToken
                    },
                    data
                };

                if (!fs.existsSync('C:\\shiftLabels\\')){
                    fs.mkdirSync('C:\\shiftLabels\\');
                }
                
                const response = await axios(config);
                await response.data.forEach(async(item, count) => {
                    // Write File#
                    await fs.writeFileSync(path.join('C:\\shiftLabels\\', count + ".txt"), item ,"UTF8",{ flag: 'wx' })
                    // Print File
                    await execPromise('COPY /B '+ path.join('C:\\shiftLabels\\', count + ".txt") + ' "\\\\' + hostName + '\\' + printerName +'"', 1);
                    // Delete File
                    fs.unlink(path.join('C:\\shiftLabels\\', count + ".txt"), function (err) {
                        if (err) throw err;
                    });
                });
            } catch (error) {
                logError(error)
            }
        }, 2000);
    }

    /**
     * todo: description
     * @param command
     * @param count
     * @param log
     * @returns {Promise<Awaited<unknown>[]>}
     */
    const execPromise = (command, count = 1, log = 'label') => {
        const promises = [];
        for (let i = 0; i < count; ++i) {
            promises.push(new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        mainWindow.webContents.send('error', JSON.stringify(error, Object.getOwnPropertyNames(error)));
                        reject(error);
                        return;
                    }
                    resolve(stdout.trim());
                });
            }));
        }
        return Promise.all(promises);
    }
}

module.exports.default = printerValue;