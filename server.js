const http = require('http');
const fs = require('fs/promises');
const url = require('url');

const FILE_MOVIES = 'peliculas.txt';
const FILE_SERIES = 'series.txt';

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;
    const method = req.method;

    // Configuración de CORS para permitir peticiones del cliente
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (method === 'OPTIONS') return res.end();

    try {
        if (method === 'GET' && pathname === '/catalog') {
            const file = query.type === 'movie' ? FILE_MOVIES : FILE_SERIES;
            const data = await fs.readFile(file, 'utf-8');
            const list = data.split('\n').filter(line => line.trim()).map(line => {
                const parts = line.split(',');
                return query.type === 'movie' 
                    ? { name: parts[0], director: parts[1], year: parts[2] }
                    : { name: parts[0], year: parts[1], seasons: parts[2] };
            });
            res.statusCode = 200;
            res.end(JSON.stringify(list));

        } else if (method === 'POST' && pathname === '/catalog') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const item = JSON.parse(body);
                const file = item.director ? FILE_MOVIES : FILE_SERIES;
                const newLine = item.director 
                    ? `\n${item.name},${item.director},${item.year}`
                    : `\n${item.name},${item.year},${item.seasons}`;
                await fs.appendFile(file, newLine);
                res.statusCode = 201;
                res.end(JSON.stringify({ message: 'Agregado con éxito' }));
            });

        } else if (method === 'DELETE' && pathname === '/catalog') {
            const { name, type } = query;
            const file = type === 'movie' ? FILE_MOVIES : FILE_SERIES;
            const data = await fs.readFile(file, 'utf-8');
            const lines = data.split('\n').filter(line => !line.startsWith(name));
            await fs.writeFile(file, lines.join('\n'));
            res.statusCode = 200;
            res.end(JSON.stringify({ message: 'Eliminado correctamente' }));

        } else {
            res.statusCode = 405; // Method Not Allowed
            res.end(JSON.stringify({ error: 'Método no permitido' }));
        }
    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Error en el servidor' }));
    }
});

server.listen(3000, () => console.log('Servidor corriendo en [Node.js Documentation](https://nodejs.org) puerto 3000'));

