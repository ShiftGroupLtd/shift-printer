const { ipcMain } = require("electron");
const settings = require("electron-settings");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {exec} = require("child_process");

const printerValue = () => {
    ipcMain.on('printerValue', async (event, data) => {
        if(data.length) {
            console.log('Received printer details', {data})
            await settings.set('printer', {
                name: data[0],
            });

            console.log('Send actionReplySuccess')
            return event.sender.send('actionReplySuccess');
        }

        console.log('Send actionReplyFail')
        return event.sender.send('actionReplyFail');
    });


    ipcMain.on('checkLoader', async function (event, arg) {
        startPrinter();

        //if printer name is set close it
        printerName = await settings.has('printer.name');
        if(!printerName) {
            return;
        }
        event.sender.send('closeLoader');
    });

    const startPrinter = async () => {
        const loopStart = setInterval(async() => {
            try {
                authToken = await settings.has('auth.token');
                accountId =  await settings.has('auth.accountId');
                printerName = await settings.has('printer.name');

                if(!authToken || !accountId || !printerName) {
                    return;
                }

                authToken = await settings.get('auth.token');
                accountId =  await settings.get('auth.accountId');
                printerName = await settings.get('printer.name');

                //console.log(await settings.has('auth.token'), await settings.has('auth.accountId'), await settings.has('printer.name'));
                const config = {
                    method: 'post',
                    url: 'https://api.shift.online/business-dashboard/v1/printer/autoPrint',
                    headers: {
                        'Authorization': "Bearer " + authToken
                    },
                    data : {
                        accountId : accountId
                    }
                };

                const response = await axios(config);
                await response.data.forEach(async(item, count) => {
                    let pageDirectory = __dirname.replace('app.asar', 'app.asar.unpacked')
                    pageDirectory = pageDirectory.replace('\src', '');
                    // Write File#
                    await fs.writeFileSync(path.join(pageDirectory, count + ".txt"), item ,"UTF8",{ flag: 'wx' })
                    // Print File
                    await execPromise('COPY /B '+ path.join(pageDirectory, count + ".txt") + ' "\\\\' + hostName + '\\' + printerName +'"', 1);
                    // Delete File
                    fs.unlink(path.join(pageDirectory, count + ".txt"), function (err) {
                        if (err) throw err;
                    });
                });
            } catch (error) {
                mainWindow.webContents.send('error', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
        for (i = 0; i < count; ++i) {
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