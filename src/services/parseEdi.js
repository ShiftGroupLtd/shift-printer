const TuffnellsEdiSchemas = require('./ediSchemas'); // Import your schema module
const FtpCsvBookingImporter = require('./FtpCsvBookingImporter'); // Import your FtpCsvBookingImporter class
const CreateBookingFromEdi = require('./CreateBookingFromEdi'); // Import your CreateBookingFromEdi class
const FtpCsvFailedValidationException = require('./FtpCsvFailedValidationException'); // Import your exception class

class EdiParser {
    handleParseEdi(ediFile, fileType, schema, options, context = []) {
        this.options = options;

        if (fileType === 'text/plain') {
            this.parseTextEdi(ediFile, schema, context);
        }

        if (fileType === 'text/csv') {
            this.parseCsvEdi(ediFile, schema, context);
        }
    }

    parseTextEdi(file, schema, context = []) {
        const ediBookings = file.split(/\r?\n/);

        this.parseToIndividualBookings(ediBookings, schema, context);
    }

    parseToIndividualBookings(parsedBookings, schema, context = []) {
        for (const booking of parsedBookings) {
            if (booking.trim() !== '') {
                const bookingData = {};
                for (const [key, value] of Object.entries(schema)) {
                    const [start, end] = value;
                    const startIndex = start - 1;

                    let trimmedValue = booking.substring(startIndex, end).trim();

                    if (key === 'despatchDate') {
                        trimmedValue = trimmedValue.match(/.{2}/g).join('-');
                    }

                    bookingData[key] = trimmedValue !== '' ? trimmedValue : null;
                }

                if (this.options.schemaName === `${TuffnellsEdiSchemas}::VERSION_TWO_TXT`) {
                    const accountSequentialBarcode = this.accountSequentialBarcodeService
                        .findOrCreateAccountSequentialBarcode(bookingData.accountNumber.replace(/^0+/, ''), context.ftpUserId);

                    bookingData.sequentialBarcodeNumber = accountSequentialBarcode.dailySequentialBarcodeNumber.toString().padStart(4, '0');
                    accountSequentialBarcode.increment('dailySequentialBarcodeNumber');
                }

                CreateBookingFromEdi.dispatch(bookingData, this.options, context);
            }
        }
    }

    handleFtpCsvErrors(failures) {
        const failedRows = {};
        let failedValidationMessage = 'Validation failed: ';

        failures.forEach((failure) => {
            const row = `Row ${failure.row()}`;
            failedRows[row] = (failedRows[row] || []).concat(failure.errors().join(', '));
        });

        Object.entries(failedRows).forEach(([row, reasons]) => {
            const rowReasons = `${row} - ${reasons.join(' ')}`;
            failedValidationMessage += `${rowReasons}\n`;
        });

        console.log(failedValidationMessage);
    }
}

module.exports = EdiParser;