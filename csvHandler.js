// csvHandler.js
const fs = require('fs');
const path = require('path');
const split2 = require('split2');
const through2 = require('through2');
const zlib = require('zlib');

const CSV_FILE_PATH = path.join(__dirname, 'data.csv.gz');

function checkFileExists() {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(CSV_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(CSV_FILE_PATH)) {
            reject(new Error(`Файл не знайдено: ${CSV_FILE_PATH}`));
            return;
        }
        resolve();
    });
}

function processCsvToJson() {
    return new Promise((resolve, reject) => {
        const results = [];
        let headers = null;
        const fileStream = fs.createReadStream(CSV_FILE_PATH);

        fileStream
            .pipe(zlib.createGunzip())
            .pipe(split2())
            .pipe(through2.obj(function(line, enc, callback) {
                const trimmedLine = line.toString('utf8').trim();
                if (!trimmedLine) return callback();
                const values = trimmedLine.split(/,|;/).map(val => val.trim());
                if (!headers) {
                    headers = values;
                    return callback();
                }
                const obj = {};
                headers.forEach((header, index) => {
                    const numValue = Number(values[index]);
                    obj[header] = !isNaN(numValue) && values[index] !== '' ? numValue : values[index];
                });
                results.push(obj);
                callback();
            }))
            .on('finish', () => resolve(results))
            .on('error', err => reject(err));
    });
}

module.exports = {
    checkFileExists,
    processCsvToJson
};
