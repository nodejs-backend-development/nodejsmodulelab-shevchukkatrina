const http = require('http');
const fs = require('fs');
const path = require('path');
const split2 = require('split2');
const through2 = require('through2');
const zlib = require('zlib');
const url = require('url');

// ========== UpperCaseTransform ==========
class UpperCaseTransform {
    static transformText(text) {
        return text.replace(/[a-zа-яіїєґ]/gi, char => char.toUpperCase());
    }
}

// ========== CSV Reader ==========
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

// ========== Server ==========
const HOST = 'localhost';
const PORT = 8080;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathName = parsedUrl.pathname;

    // Route: /user
    if (pathName === '/user') {
        const cookieHeader = req.headers.cookie;
        let userInfo = null;
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((obj, pair) => {
                const [key, value] = pair.trim().split('=');
                obj[key] = value;
                return obj;
            }, {});
            userInfo = cookies['user_info'];
        }

        let response = {};
        if (userInfo === 'user1') {
            response = {
                id: 1,
                firstName: 'Leanne',
                lastName: 'Graham'
            };
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
    
    // Route: /csv
    } else if (pathName === '/csv') {
        if (req.method !== 'GET') {
            res.writeHead(405, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Метод не підтримується' }));
            return;
        }

        try {
            await checkFileExists();
            const data = await processCsvToJson();
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(data));
        } catch (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: err.message }));
        }

    // Route: /transform?text=тут_рядок
    } else if (pathName === '/transform') {
        const query = parsedUrl.query;
        const inputText = query.text || '';
        const transformed = UpperCaseTransform.transformText(inputText);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ original: inputText, transformed }));
    
    // Default 404
    } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: 'Маршрут не знайдено' }));
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Сервер запущено на http://${HOST}:${PORT}`);
    console.log('Доступні маршрути: /user, /csv, /transform?text=...');
});
