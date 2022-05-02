// CREATE DATABASE bancosolar;
// CREATE TABLE usuarios (id SERIAL PRIMARY KEY, nombre VARCHAR(50),
// balance FLOAT CHECK (balance >= 0));
// CREATE TABLE transferencias (id SERIAL PRIMARY KEY, emisor INT, receptor
// INT, monto FLOAT, fecha VARCHAR(50), FOREIGN KEY (emisor) REFERENCES
// usuarios(id), FOREIGN KEY (receptor) REFERENCES usuarios(id));

const http = require("http");
const fs = require("fs");
const urlQ = require("url");
const { nuevoUsuario, getUsuarios, editUsuario, eliminarUsuario, nuevaTransferencia, getTransferencias } = require("./app/funciones");

const server = http.createServer(async (req, res) => {
    const { url, method } = req;
    if (url == "/" && method == "GET") {
        try {
            const index = fs.readFileSync("./public/index.html", "utf-8");
            res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
            res.end(index);
        } catch (e) {
            funError(res, e, "text/html");
        }
    } else if (req.url == '/usuario' && req.method === 'POST') {
        try {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', async () => {
                const parametros = Object.values(JSON.parse(body));
                const resultado = await nuevoUsuario(parametros);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(resultado));
            });
        } catch (e) {
            funError(res, e, 'application/json');
        }
    } else if (req.url == '/usuarios' && req.method === 'GET') {
        try {
            const resultado = await getUsuarios();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultado.rows));
        } catch (e) {
            funError(res, e, 'application/json');
        }
    } else if (req.url.startsWith('/usuario?id=') && req.method === 'PUT') {
        try {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', async () => {
                const parametros = Object.values(JSON.parse(body));
                const resultado = await editUsuario(parametros);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(resultado));
            });
        } catch (e) {
            funError(res, e, 'application/json');
        }
    } else if (req.url.startsWith('/usuario?id=') && req.method === 'DELETE') {
        try {
            const { id } = urlQ.parse(req.url, true).query;
            const resultado = await eliminarUsuario(id);
            if (resultado) {
                throw new Error("No se pudo eliminar el usuario");
            }
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultado));
        } catch (e) {
            funError(res, e, 'application/json');
        }
    } else if (req.url == '/transferencia' && req.method === 'POST') {
        try {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
            });
            req.on('end', async () => {
                const parametros = Object.values(JSON.parse(body));
                const resultado = await nuevaTransferencia(parametros);
                res.end(JSON.stringify(resultado));
            });
        } catch (e) {
            funError(res, e, 'application/json');
        }
    } else if (req.url == '/transferencias' && req.method === 'GET') {
        try {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const resultado = await getTransferencias();
            res.end(JSON.stringify(resultado.rows));
        } catch (e) {
            funError(res, e, 'application/json');
        }
    } else {
        funError(res, null, "text/html");
    }
});

const port = 3000;
server.listen(port, () => console.log(`Escuchando el puerto ${port}`));

const funError = (res, err, type) => {
    if (err) console.log(err);
    res.writeHead(404, { "Content-Type": type });
    if (type == "text/html") res.write("<p>Pagina no encontrada!</p>");
    res.end();
};