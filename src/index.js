import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import express from 'express';
import { Server } from "socket.io";
import { Filter } from 'bad-words';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.emit('message', 'Welcome!');
    socket.broadcast.emit('message', ' A new user has joined!');

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }

        io.emit('message', message);
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`);
        callback();
    });

    socket.on('disconnect', () => {
        io.emit('message', 'A user has left!');
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
});