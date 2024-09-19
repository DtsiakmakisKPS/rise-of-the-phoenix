// public/client.js

// Initialize Socket.io
const socket = io();

// Player speed
const playerSpeed = 8;

// Variable to store local player ID
let localPlayerID;

// Variable to track the local player's current animation state
let currentAnimation = 'turn';

// Listen for the 'connect' event to get the socket ID
socket.on('connect', () => {
    localPlayerID = socket.id;
    console.log('Connected with ID:', localPlayerID);
});

// Define the MainScene class before initializing the Phaser game
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.localPlayerSprite = null; // Reference to the local player's sprite
        this.mapWidth = 1600; // Default map width; will be updated from server
        this.mapHeight = 1200; // Default map height; will be updated from server
    }

    preload() {
        // Preload assets
        this.load.image('floor', '/assets/floor/floor.png');
        this.load.image('wall', '/assets/walls/wall.png');
        this.load.image('seat', '/assets/seats/seat.png');
        this.load.image('seat_taken', '/assets/seats/seat_taken.png');
        this.load.spritesheet('dude', '/assets/freeAssets/characters/Bob_run_16x16.png', {
            frameWidth: 16,
            frameHeight: 32,
        });
        this.load.spritesheet('dude_idle', '/assets/freeAssets/characters/Bob_idle_anim_16x16.png', {
            frameWidth: 16,
            frameHeight: 32,
        });

        // Listen for load errors
        this.load.on('loaderror', (fileObj) => {
            console.error(`Failed to load asset: ${fileObj.key} from ${fileObj.src}`);
        });
    }

    create() {
        // Add floor as a tile sprite covering the entire map
        this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, 'floor').setOrigin(0, 0);

        // Initialize groups for walls, seats, and players
        this.wallsGroup = this.physics.add.staticGroup();
        this.seatsGroup = this.physics.add.staticGroup();
        this.playersGroup = this.physics.add.group();

        // Listen for game start event from the server
        socket.on('gameStarted', (data) => {
            console.log('Received gameStarted event with data:', data);
            this.mapWidth = data.mapWidth;
            this.mapHeight = data.mapHeight;
            this.createWalls(data.walls);
            this.createSeats(data.seats);
            this.createPlayers(data.players); // data.players is now an array
            document.getElementById('status').innerText = 'Game Started! Find a seat!';
        });

        // Listen for player updates
        socket.on('updatePlayers', (data) => {
            console.log('Received updatePlayers event with data:', data);
            this.updatePlayers(data); // data is now an array
        });

        // Listen for seat acquisition
        socket.on('playerReachedSeat', (data) => {
            console.log('Received playerReachedSeat event with data:', data);
            this.handleSeatTaken(data);
        });

        // Listen for game over
        socket.on('gameOver', (data) => {
            console.log('Received gameOver event with data:', data);
            this.handleGameOver(data);
        });

        // Listen for game reset
        socket.on('resetGame', () => {
            console.log('Received resetGame event');
            this.resetGame();
        });

        // Listen for player disconnection
        socket.on('playerDisconnected', (id) => {
            console.log(`Player disconnected: ${id}`);
            this.removePlayer(id);
        });

        // Handle own disconnection
        socket.on('disconnect', () => {
            alert('You have been disconnected from the server.');
            this.resetGame();
        });

        // Define animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 12, end: 17 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'turn',
            frames: this.anims.generateFrameNumbers('dude_idle', { start: 18, end: 23 }),
            frameRate: 10,
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1,
        });

        // Use frame 4 as a placeholder for up and down movement if no separate animations exist
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('dude', { start: 6, end: 11 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('dude', { start: 18, end: 23 }),
            frameRate: 10,
            repeat: -1,
        });

        // Setup keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.WKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    update() {
        // Handle player movement input
        this.handleInput();
    }

    createWalls(wallsData) {
        wallsData.forEach((wall) => {
            // Assuming wall has x, y, width, height
            const wallImage = this.add
                .image(wall.x + wall.width / 2, wall.y + wall.height / 2, 'wall')
                .setDisplaySize(wall.width, wall.height)
                .setOrigin(0.5, 0.5);

            // Add walls to the static group
            this.wallsGroup.add(wallImage);

            // Enable physics on walls
            this.physics.add.existing(wallImage, true);
        });

        // Add collision between players and walls
        this.physics.add.collider(this.playersGroup, this.wallsGroup);
    }

    createSeats(seatsData) {
        seatsData.forEach((seat) => {
            const seatImage = this.add.image(seat.x, seat.y, 'seat').setDisplaySize(30, 30).setOrigin(0.5, 0.5);

            // Add seats to the static group
            this.seatsGroup.add(seatImage);

            // Enable physics on seats
            this.physics.add.existing(seatImage, true);
        });

        // Add overlap detection between players and seats
        this.physics.add.overlap(this.playersGroup, this.seatsGroup, this.checkSeatCollision, null, this);
    }

    createPlayers(playersData) {
        console.log('Creating players:', playersData);
        // Clear existing players if any
        this.playersGroup.clear(true, true);

        playersData.forEach((player) => {
            const avatarKey = player.animationState === 'turn' ? 'dude_idle' : 'dude'; // Dynamic avatar based on animation

            const playerSprite = this.physics.add
                .sprite(player.x, player.y, avatarKey)
                .setDisplaySize(16, 32)
                .setCollideWorldBounds(true)
                .setOrigin(0.5, 0.5)
                .setInteractive();

            // Store player ID in the sprite for reference
            playerSprite.playerId = player.id;

            // Add username text above the player
            const usernameText = this.add
                .text(player.x, player.y - 20, player.username, {
                    font: '12px Arial',
                    fill: '#000',
                })
                .setOrigin(0.5, 0.5);

            // Associate the text with the player sprite
            playerSprite.usernameText = usernameText;

            // Highlight the local player (optional)
            if (player.id === localPlayerID) {
                playerSprite.setTint(0x0000ff); // Blue tint for local player
                this.localPlayerSprite = playerSprite; // Store reference for easy access

                // Set up the camera to follow the local player
                this.cameras.main.startFollow(this.localPlayerSprite, true, 0.05, 0.05);
                this.cameras.main.setZoom(1); // Adjust the zoom level as desired
                this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight); // Set camera bounds to the map size
            }

            // Add player sprite to the group
            this.playersGroup.add(playerSprite);

            // Play the appropriate animation based on the animation state
            playerSprite.anims.play(player.animationState, true);
        });
    }

    updatePlayers(playersData) {
        console.log('Updating players:', playersData);
        playersData.forEach((player) => {
            // Find the player sprite by ID
            const playerSprite = this.playersGroup.getChildren().find((sprite) => sprite.playerId === player.id);

            if (playerSprite) {
                // Update position
                playerSprite.x = player.x;
                playerSprite.y = player.y;

                // Update username text position
                playerSprite.usernameText.x = player.x;
                playerSprite.usernameText.y = player.y - 20;

                // Update tint if player has a seat
                if (player.hasSeat) {
                    playerSprite.setTint(0x00ff00); // Green tint
                } else {
                    if (player.id === localPlayerID) {
                        playerSprite.setTint(0x0000ff); // Blue tint for local player without a seat
                    } else {
                        playerSprite.clearTint();
                    }
                }

                // Update animation state if it has changed
                if (player.animationState && player.animationState !== currentAnimation) {
                    playerSprite.anims.play(player.animationState, true);
                    if (player.id === localPlayerID) {
                        currentAnimation = player.animationState;
                    }
                }
            } else {
                // New player joined
                const avatarKey = player.animationState === 'turn' ? 'dude_idle' : 'dude'; // Dynamic avatar based on animation

                const newPlayerSprite = this.physics.add
                    .sprite(player.x, player.y, avatarKey)
                    .setDisplaySize(16, 32)
                    .setCollideWorldBounds(true)
                    .setOrigin(0.5, 0.5)
                    .setInteractive();

                newPlayerSprite.playerId = player.id;

                const newUsernameText = this.add
                    .text(player.x, player.y - 20, player.username, {
                        font: '12px Arial',
                        fill: '#000',
                    })
                    .setOrigin(0.5, 0.5);

                newPlayerSprite.usernameText = newUsernameText;

                // Highlight the local player (optional)
                if (player.id === localPlayerID) {
                    newPlayerSprite.setTint(0x0000ff); // Blue tint for local player
                    this.localPlayerSprite = newPlayerSprite; // Store reference for easy access
                }

                // Add player sprite to the group
                this.playersGroup.add(newPlayerSprite);

                // Play the appropriate animation based on the animation state
                newPlayerSprite.anims.play(player.animationState, true);
            }
        });
    }

    handleSeatTaken(data) {
        const { playerId, seatId } = data;

        // Find the seat image by seatId (assuming seatId corresponds to index)
        const seatImage = this.seatsGroup.getChildren()[seatId];
        if (seatImage) {
            // Change seat texture to taken
            seatImage.setTexture('seat_taken');
            console.log(`Seat ${seatId} has been taken by Player ${playerId}`);
        } else {
            console.warn(`Seat with ID ${seatId} not found.`);
        }

        // Tint the player who took the seat
        const playerSprite = this.playersGroup.getChildren().find((sprite) => sprite.playerId === playerId);
        if (playerSprite) {
            playerSprite.setTint(0x00ff00); // Green tint
            console.log(`Player ${playerId} has been tinted green.`);
        } else {
            console.warn(`Player with ID ${playerId} not found.`);
        }
    }

    handleGameOver(data) {
        if (data.winners) {
            const winners = data.winners;
            const isWinner = winners.some((winner) => winner.id === localPlayerID);

            if (isWinner) {
                document.getElementById('status').innerText = 'You win!';
            } else {
                const winnerNames = winners.map((winner) => winner.username).join(', ');
                document.getElementById('status').innerText = `${winnerNames} won the game!`;
            }
        } else if (data.message) {
            document.getElementById('status').innerText = data.message;
        }

        // Optionally, reset the game after a delay
        setTimeout(() => {
            this.resetGame();
        }, 3000); // 3 seconds delay
    }

    resetGame() {
        console.log('Resetting game...');
        // Remove all player sprites
        this.playersGroup.clear(true, true);

        // Remove all seats
        this.seatsGroup.clear(true, true);

        // Remove all walls
        this.wallsGroup.clear(true, true);

        // Clear status text
        document.getElementById('status').innerText = 'Game Reset. Join again to play.';

        location.reload();
    }

    removePlayer(id) {
        console.log(`Removing player with ID: ${id}`);
        // Find the player sprite by ID
        const playerSprite = this.playersGroup.getChildren().find((sprite) => sprite.playerId === id);

        if (playerSprite) {
            // Remove username text
            playerSprite.usernameText.destroy();

            // Remove player sprite
            playerSprite.destroy();
            console.log(`Player ${id} removed from the game.`);
        } else {
            console.warn(`Player with ID ${id} not found.`);
        }
    }

    checkSeatCollision(playerSprite, seatImage) {
        // Emit event to the server that this player has reached a seat
        const seatId = this.seatsGroup.getChildren().indexOf(seatImage); // Should match seat.id from the server
        console.log(`Player ${playerSprite.playerId} has reached Seat ${seatId}`);
        socket.emit('playerReachedSeat', { playerId: playerSprite.playerId, seatId: seatId });
    }

    handleInput() {
        if (!this.localPlayerSprite) return; // Ensure the local player sprite is available

        let moveX = 0;
        let moveY = 0;
        let moving = false;
        let newAnimation = currentAnimation; // To determine if animation state changes

        if (this.cursors.left.isDown || this.AKey.isDown) {
            moveX -= playerSpeed;
            this.localPlayerSprite.anims.play('left', true);
            moving = true;
            newAnimation = 'left';
        }
        if (this.cursors.right.isDown || this.DKey.isDown) {
            moveX += playerSpeed;
            this.localPlayerSprite.anims.play('right', true);
            moving = true;
            newAnimation = 'right';
        }
        if (this.cursors.up.isDown || this.WKey.isDown) {
            moveY -= playerSpeed;
            this.localPlayerSprite.anims.play('up', true);
            moving = true;
            newAnimation = 'up';
        }
        if (this.cursors.down.isDown || this.SKey.isDown) {
            moveY += playerSpeed;
            this.localPlayerSprite.anims.play('down', true);
            moving = true;
            newAnimation = 'down';
        }

        if (!moving) {
            this.localPlayerSprite.anims.play('turn', true);
            newAnimation = 'turn';
        }

        // If animation state has changed, emit the new state to the server
        if (newAnimation !== currentAnimation) {
            currentAnimation = newAnimation;
            socket.emit('playerAnimation', { animationState: currentAnimation });
        }

        if (moveX !== 0 || moveY !== 0) {
            // Normalize movement
            const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= magnitude;
            moveY /= magnitude;

            // Send movement to the server
            socket.emit('continuousMove', { moveX, moveY, animationState: currentAnimation });
        }
    }
}

// Initialize the Phaser game AFTER defining MainScene
const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1200,
    parent: 'gameScreen',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
    scene: [MainScene],
};

// Initialize the Phaser game
const gameInstance = new Phaser.Game(config);

// Handle Join Button Click Outside Phaser
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('loginScreen');
    const gameScreen = document.getElementById('gameScreen');
    const joinBtn = document.getElementById('joinBtn');
    const usernameInput = document.getElementById('username');
    const statusDiv = document.getElementById('status');

    joinBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username === '') {
            alert('Please enter a username.');
            return;
        }
        socket.emit('playerJoined', username);
        loginScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
    });
});
