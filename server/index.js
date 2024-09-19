
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

// Define available sprite keys
const activeSpriteKeys = ['adam', 'alex', 'amelia', 'bob'];

let players = {};
const PORT = process.env.PORT || 3000;
const ipMap = {};
const BLOCK_IP = true;

// Serve static files from the 'public' directory
app.use(express.static('public'));

io.on('connection', function (socket) {
    console.log('a user connected');

    const ipAddress =
    socket.handshake.headers["x-forwarded-for"] ??
    socket.handshake.headers["x-real-ip"] ??
    socket.handshake.address;

    if (BLOCK_IP && ipMap[ipAddress]) {
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
        animationState: 'idle' // Default animation state
    };

    // Send the current players to the new player
    socket.emit('currentPlayers', players);

    // Notify all other players about the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

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

/*
// Serve static files from the public directory
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// Game state
let players = {};
let seats = [];
let walls = []; // Walls in the map
let gameStarted = false;

// Map dimensions
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 1200;

// Utility function to generate random seats avoiding walls
function generateSeats(numberOfSeats, mapWidth, mapHeight, walls) {
    const seats = [];
    let attempts = 0;
    while (seats.length < numberOfSeats && attempts < numberOfSeats * 10) {
        const seat = {
            id: seats.length, // Sequential IDs starting at 0
            x: Math.floor(Math.random() * (mapWidth - 30)) + 15,
            y: Math.floor(Math.random() * (mapHeight - 30)) + 15,
            taken: false,
        };
        // Check if seat is inside a wall
        const inWall = walls.some((wall) => isPointInRect(seat.x, seat.y, wall));
        if (!inWall) {
            seats.push(seat);
        }
        attempts++;
    }
    return seats;
}

// Utility function to check if a point is inside a rectangle
function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

// Define walls (example layout)
function defineWalls() {
    walls = [
        // Building definition
        // Outer left and right boundaries
        { x: 0, y: 0, width: 20, height: MAP_HEIGHT }, // Left wall
        { x: MAP_WIDTH - 20, y: 0, width: 20, height: MAP_HEIGHT }, // Right wall

        // Top part of building
        { x: 0, y: 0, width: 200, height: 20 }, // Go right
        { x: 200, y: 0, width: 20, height: 200 }, // Go down
        { x: 200, y: 200, width: 400, height: 20 }, // Go right
        { x: 600, y: 0, width: 20, height: 220 }, // Go up
        { x: 600, y: 0, width: 200, height: 20 }, // Go right
        { x: 600, y: 0, width: 20, height: 200 }, // Go down
        // Bottom part of building

    ];
}

// Collision detection between player and walls
function isColliding(x, y, walls) {
    for (let wall of walls) {
        if (
            x + 15 > wall.x && // Player's right edge
            x - 15 < wall.x + wall.width && // Player's left edge
            y + 15 > wall.y && // Player's bottom edge
            y - 15 < wall.y + wall.height // Player's top edge
        ) {
            return true;
        }
    }
    return false;
}

io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle player login
    socket.on('playerJoined', (username) => {
        players[socket.id] = {
            id: socket.id,
            username: username || `Player${Object.keys(players).length + 1}`,
            x: 50, // Starting x position
            y: 50, // Starting y position
            score: 0, // Maybe to implement a score here TODO
            hasSeat: false, // boolean for if player has a seat or no.
            animationState: 'turn', // Default animation state
        };
        io.emit('updatePlayers', getPlayersForGame());
        checkStartGame();
    });

    // Handle continuous movement
    socket.on('continuousMove', (data) => {
        if (!gameStarted) return; // Prevent movement before game starts

        const player = players[socket.id];
        if (player && !player.hasSeat) {
            const { moveX, moveY, animationState } = data;
            const newX = player.x + moveX;
            const newY = player.y + moveY;

            // Boundary checks
            if (newX - 15 < 0 || newX + 15 > MAP_WIDTH || newY - 15 < 0 || newY + 15 > MAP_HEIGHT) {
                return; // Prevent moving out of bounds
            }

            // Collision detection with walls
            if (!isColliding(newX, newY, walls)) {
                player.x = newX;
                player.y = newY;
                player.animationState = animationState; // Update animation state

                // Check seat collision
                checkSeatCollision(player);

                // Broadcast updated player positions and animation states
                io.emit('updatePlayers', getPlayersForGame()); // Now an array with animationState
            }
        }
    });

    // Handle player animation updates
    socket.on('playerAnimation', (data) => {
        const player = players[socket.id];
        if (player) {
            player.animationState = data.animationState;
            io.emit('updatePlayers', getPlayersForGame()); // Broadcast updated animation state
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('updatePlayers', getPlayersForGame()); // Now an array

        if (gameStarted && Object.keys(players).length < 2) {
            // Not enough players to continue the game
            io.emit('gameOver', { message: 'Not enough players. Game has been reset.' });
            resetGame();
        }
    });
});

// Get players data for Game (as an array)
function getPlayersForGame() {
    const gamePlayers = [];
    for (let id in players) {
        gamePlayers.push({
            id: players[id].id,
            username: players[id].username,
            x: players[id].x,
            y: players[id].y,
            hasSeat: players[id].hasSeat,
            animationState: players[id].animationState, // Include animation state
        });
    }
    return gamePlayers;
}

// Check if enough players to start the game
function checkStartGame() {
    if (!gameStarted && Object.keys(players).length >= 1) {
        startGame();
    }
}

// Start the game by generating seats and notifying players
function startGame() {
    gameStarted = true;
    // Define walls
    defineWalls();
    // Calculate number of seats: players -1
    const numberOfPlayers = Object.keys(players).length;
    const numberOfSeats = numberOfPlayers - 1;
    // Generate seats avoiding walls
    seats = generateSeats(numberOfSeats, MAP_WIDTH, MAP_HEIGHT, walls);
    io.emit('gameStarted', {
        seats: seats,
        walls: walls,
        mapWidth: MAP_WIDTH,
        mapHeight: MAP_HEIGHT,
        players: getPlayersForGame(), // Now an array with animationState
    });
}

// Check if a player has reached a seat
function checkSeatCollision(player) {
    for (let seat of seats) {
        if (!seat.taken) {
            const distance = Math.hypot(player.x - seat.x, player.y - seat.y);
            if (distance < 20) {
                // Collision threshold
                seat.taken = true;
                player.hasSeat = true;
                player.score += 1;
                io.emit('playerReachedSeat', { playerId: player.id, seatId: seat.id });
                checkGameOver();
                break;
            }
        }
    }
}

// Check if the game is over (all seats taken)
function checkGameOver() {
    const takenSeats = seats.filter((seat) => seat.taken).length;
    const requiredSeats = seats.length; // Since seats = players -1

    if (takenSeats >= requiredSeats) {
        // Collect winners
        const winners = Object.values(players).filter((player) => player.hasSeat);
        io.emit('gameOver', { winners: winners });
        resetGame();
    }
}

// Reset the game state
function resetGame() {
    gameStarted = false;
    players = {};
    seats = [];
    walls = [];
    io.emit('updatePlayers', getPlayersForGame()); // Now an empty array
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
*/