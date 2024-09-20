import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import GameLoop from "./game-loop.js";

const app = express();
const server = createServer(app);
const io = new Server(server);

// Define available sprite keys
const activeSpriteKeys = ['adam', 'alex', 'amelia', 'bob'];

let players = {};
const PORT = process.env.PORT || 3000;
const ipMap = {};
const BLOCK_IP = true;

const gameLoop = new GameLoop(io);

// Serve static files from the 'public' directory
app.use(express.static('public'));

io.on('connection', function (socket) {
    console.log('a user connected');

    const ipAddress =
        socket.handshake.headers['x-forwarded-for'] ??
        socket.handshake.headers['x-real-ip'] ??
        socket.handshake.address;

    if (BLOCK_IP && ipMap[ipAddress]) {
        socket.emit('alreadyPlaying', true);
        socket.disconnect();
        return;
    }
    ipMap[ipAddress] = true;

    // create a new player and add it to our players object
    console.log(`User connected: ${socket.id}`);

    // Assign a random sprite key to the new player
    const randomIndex = Math.floor(Math.random() * activeSpriteKeys.length);
    const assignedSprite = activeSpriteKeys[randomIndex];

    // Initialize the new player with default position and animation state
    players[socket.id] = {
        x: 0,
        y: 0,
        playerId: socket.id,
        playerSprite: assignedSprite,
        animationState: 'idle', // Default animation state
    };

    // Send the current players to the new player
    socket.emit('currentPlayers', players);

    // Notify all other players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.emit('phaseChange', { phase: gameLoop.getCurrentPhase() });
    // Handle player disconnection
    socket.on('disconnect', function () {
        console.log(`User disconnected: ${socket.id}`);

        // remove this player from our players object
        delete players[socket.id];

        // Notify all players to remove this player
        socket.broadcast.emit('playerRemoved', socket.id);
        delete ipMap[ipAddress];
    });

    // Handle player movement and animation updates
    socket.on('playerMovement', function (movementData) {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].animationState = movementData.animationState || players[socket.id].animationState;

            // Broadcast the movement and animation state to all other players
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });
});

server.listen(PORT, function () {
    console.log(`Listening on ${server.address().port}`);
});