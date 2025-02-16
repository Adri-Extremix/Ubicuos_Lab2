const http = require("http");
const fs = require("fs");

const PORT = 5500;

const serveStaticFile = async (file) => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, function (err, data) {
            if (err) reject(err);
            resolve(data);
        });
    });
};

const saveTasks = async (file) => {
    return new Promise((resolve, reject) => {
        fs.writeFile("tasks.json", file, function (err, data) {
            if (err) {
                console.log("Error al escribir el json");
                reject(err);
            }
            console.log("He escrito");
            resolve(data);
        });
    });
};

const sendResponse = (response, content, contentType) => {
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
};
let data;

const handleRequest = async (request, response) => {
    const url = request.url;
    if (request.method === "GET") {
        let content;
        let contentType;
        switch (url) {
            case "/":
            case "/index.html":
                content = await serveStaticFile("www/index.html");
                contentType = "text/html";
                break;
            case "/script.js":
                content = await serveStaticFile("www/script.js");
                contentType = "text/javascript";
                break;
            case "/style.css":
                content = await serveStaticFile("www/style.css");
                contentType = "text/css";
                break;
            case "/tasks/get":
                content = await serveStaticFile("tasks.json");
                contentType = "application/json";
                break;
            default:
                content = "Ruta no v&aacutelida\r\n";
                contentType = "text/html";
        }

        sendResponse(response, content, contentType);
    } else if (request.method === "POST") {
        if (url === "/") {
            console.log("recibo una petición");
            let body = "";
            request.on("data", (chunk) => {
                body += chunk.toString();
            });
            request.on("end", async () => {
                try {
                    const tasklist = JSON.parse(body);
                    console.log("El json recibido es", tasklist);
                    await saveTasks(body);
                    /* fs.writeFile("tasks.json", body, (err) => {
                        if (err) {
                            console.error(
                                "Error al escribir en el archivo JSON"
                            );
                        }
                    }); */
                    sendResponse(
                        response,
                        "Tareas guardadas correctamente",
                        "text/plain"
                    );
                } catch (error) {
                    sendResponse(
                        response,
                        "Error al procesar la solicitud",
                        "text/plain",
                        500
                    );
                }
            });
        }
    } else {
        response.writeHead(405, { "Content-Type": "text/html" });
        response.write(`M&eacutetodo ${request.method} no permitido!\r\n`);
    }
};

const server = http.createServer(handleRequest);
server.listen(PORT);
