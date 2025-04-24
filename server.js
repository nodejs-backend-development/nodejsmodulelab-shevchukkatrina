// server.js
const http = require('http');
const url = require('url');
const { checkFileExists, processCsvToJson } = require('./csvHandler');
const UpperCaseTransform = require('./transform');

const HOST = 'localhost';
const PORT = 8080;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathName = parsedUrl.pathname;

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

    } else if (pathName === '/transform') {
        const query = parsedUrl.query;
        const inputText = query.text || '';
        const transformed = UpperCaseTransform.transformText(inputText);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ original: inputText, transformed }));

    } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: 'Маршрут не знайдено' }));
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Сервер запущено на http://${HOST}:${PORT}`);
    console.log('Доступні маршрути: /user, /csv, /transform?text=...');
});
