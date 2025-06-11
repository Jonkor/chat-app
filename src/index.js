import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import express from 'express';
import { Server } from "socket.io";
import { Filter } from 'bad-words';
import { generateMessage, generateLocationMessage } from './utils/messages.js';
import { addUser, removeUser, getUser, getUsersInRoom } from './utils/users.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectoryPath = path.join(__dirname, '../public');
// const { addUser, removeUser, getUser, getUsersInRoom } = from ('./utils/users');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });
        
        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        
        socket.emit('message', generateMessage('Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`));

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }

        io.to('Center City').emit('message', generateMessage(message));
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`));
        }     
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
});