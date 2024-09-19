import {musicController} from "./music-controller.js";
import {RoundTimer} from "./round-timer.js";

const sizes = {
    width: 4160,
    height: 3840
};

// Active sprites available for players
const activeSpriteKeys = ['adam', 'alex', 'amelia', 'bob'];

const speed = 300;
var keyA;
var keyS;
var keyD;
var keyW;

class GameScene extends Phaser.Scene {
    constructor() {
        super('scene-game');
        this.player = null;
        this.otherPlayers = null;
        this.cursor = null;
        this.playerSpeed = speed + 50;
        this.entryCollider = null;
    }

    startGame() {
        this.events.emit('startGame');
    }

    stopGame() {
        this.events.emit('stopGame');
    }

    preload(){
        // Load map assets
        this.load.image('walls', 'assets/Room_Builder_free_32x32.png');
        this.load.image('decoration', 'assets/Interiors_free_32x32.png');
        this.load.tilemapTiledJSON('map', 'assets/world.json');

        // Load sprites for each active sprite key
        activeSpriteKeys.forEach((spriteKey) => {
            // Load run animation
            this.load.spritesheet(spriteKey, `assets/sprites/${spriteKey}/${capitalize(spriteKey)}_run_32x32.png`, {
                frameWidth: 32,
                frameHeight: 64,
            });

            // Load idle animation
            this.load.spritesheet(`${spriteKey}_idle`, `assets/sprites/${spriteKey}/${capitalize(spriteKey)}_idle_anim_32x32.png`, {
                frameWidth: 32,
                frameHeight: 64,
            });
        });

        // Load audio
        this.load.audio('backgroundMusic', 'assets/game-bg-music.mp3');
    }

    create() {
        this.socket = io();
        const self = this;

        const HUD = this.scene.get('HUD');
        HUD.events.on('roundTimerEnd', function () {
            this.stopGame();
        }, this);

        // Load and configure the tilemap
        const map = this.make.tilemap({ key: 'map' });
        const spawnPoint = map.findObject("Spawn Point", obj => obj.name === "Spawn Point");
        const chairObjects = map.getObjectLayer("Chairs")?.objects || [];
        musicController(this.sound);

        const tileset = map.addTilesetImage('Room_Builder_free_32x32', 'walls');
        const decorationset = map.addTilesetImage('Interiors_free_32x32', 'decoration');

        const belowLayer = map.createLayer("floor", tileset, 0, 0);
        const worldLayer = map.createLayer("walls", [tileset, decorationset], 0, 0);
        const entryLayer = map.createLayer("entry", tileset, 0, 0);
        const decorationLayer = map.createLayer("decorations", decorationset, 0, 0);

        worldLayer.setCollisionByProperty({ collides: true });
        decorationLayer.setCollisionByProperty({ collides: true });
        entryLayer.setCollisionByProperty({ collides: true });

        setTimeout(function() {
            console.log(self.entryCollider);
            if (self.entryCollider) {
                console.log("entryLayer", entryLayer);
                self.physics.world.removeCollider(self.entryCollider);
                entryLayer.destroy();
            }
        }, 5000);


        // Setup input controls
        this.cursor = this.input.keyboard.createCursorKeys();
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

        // Initialize groups
        this.otherPlayers = this.physics.add.group();

        this.socket.on('currentPlayers', function (players) {
        // Handle current players
        this.socket.on('currentPlayers', function (players) {
            console.log(players, self.socket.id);
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === self.socket.id) {
                    self.addPlayer(self, players[id], spawnPoint, worldLayer, decorationLayer, entryLayer);
                    self.addPlayer(players[id], spawnPoint, worldLayer, decorationLayer);
                } else {
                    self.addOtherPlayer(players[id]);
                }
            });
        });

        // Handle new player joining
        this.socket.on('newPlayer', function (playerInfo) {
            self.addOtherPlayer(playerInfo);
        });

        this.socket.on('playerMoved', function (playerInfo) {             
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {                
        // Handle player movement
        this.socket.on('playerMoved', function (playerInfo) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                    // TODO: play animation
                    // Update animation state if it has changed
                    if (otherPlayer.animationState !== playerInfo.animationState) {
                        otherPlayer.anims.play(`${playerInfo.playerSprite}_${playerInfo.animationState}`, true);
                        otherPlayer.animationState = playerInfo.animationState;
                    }
                }
            });
        });

        // Handle player removal
        this.socket.on('playerRemoved', function (playerId) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });

        // Create a physics group for chair zones
        this.chairs = this.physics.add.staticGroup();

        // Iterate through each chair object from the tilemap and create a Zone
        chairObjects.forEach((chair) => {
            // Create a Zone for each chair
            const chairZone = this.add.zone(chair.x, chair.y - chair.height, chair.width, chair.height);
            this.physics.world.enable(chairZone, Phaser.Physics.Arcade.STATIC_BODY);
            chairZone.body.setSize(chair.width, chair.height);
            chairZone.body.setOffset(0, 0);
            chairZone.isChair = true;

            // Add the zone to the chairs group
            this.chairs.add(chairZone);
        });


        // Define animations for each sprite
        activeSpriteKeys.forEach((spriteKey) => {
            // Left
            this.anims.create({
                key: `${spriteKey}_left`,
                frames: this.anims.generateFrameNumbers(spriteKey, { start: 12, end: 17 }),
                frameRate: 10,
                repeat: -1,
            });

            // Idle
            this.anims.create({
                key: `${spriteKey}_idle`,
                frames: this.anims.generateFrameNumbers(`${spriteKey}_idle`, { start: 18, end: 23 }),
                frameRate: 10,
                repeat: -1,
            });

            // Right
            this.anims.create({
                key: `${spriteKey}_right`,
                frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1,
            });

            // Up
            this.anims.create({
                key: `${spriteKey}_up`,
                frames: this.anims.generateFrameNumbers(spriteKey, { start: 6, end: 11 }),
                frameRate: 10,
                repeat: -1,
            });

            // Down
            this.anims.create({
                key: `${spriteKey}_down`,
                frames: this.anims.generateFrameNumbers(`${spriteKey}`, { start: 18, end: 23 }),
                frameRate: 10,
                repeat: -1,
            });
        });
    }

    addPlayer(playerInfo, spawnPoint, worldLayer, decorationLayer) {
        const avatarKey = `${playerInfo.playerSprite}_idle`;
        this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, avatarKey).setOrigin(0.5, 0.5);
        this.player.playerId = playerInfo.playerId;
        this.player.playerSprite = playerInfo.playerSprite;
        this.player.animationState = playerInfo.animationState || 'idle';
        this.player.setImmovable(false); // Allow player to move
        this.player.anims.play(`${playerInfo.playerSprite}_${this.player.animationState}`, true); // Play initial animation
        this.physics.add.collider(this.player, worldLayer);
        this.physics.add.collider(this.player, decorationLayer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(5); // Adjust the zoom level as desired
        this.cameras.main.setBounds(0, 0, sizes.width, sizes.height); // Set camera bounds to the map size
    }

    addOtherPlayer(playerInfo) {
        const avatarKey = `${playerInfo.playerSprite}_idle`;
        const otherPlayer = this.physics.add.sprite(playerInfo.x, playerInfo.y, avatarKey).setOrigin(0.5, 0.5);
        otherPlayer.playerId = playerInfo.playerId;
        otherPlayer.playerSprite = playerInfo.playerSprite;
        otherPlayer.animationState = playerInfo.animationState || 'idle';
        otherPlayer.setImmovable(false);
        otherPlayer.anims.play(`${playerInfo.playerSprite}_${otherPlayer.animationState}`, true);
        this.otherPlayers.add(otherPlayer);
    }

    handleChairOverlap(player, chairZone) {
        if (!chairZone.hasAlerted) {
            alert("You touched a chair!");
            chairZone.hasAlerted = true; // Set a flag to prevent repeated alerts

            // Optionally, reset the flag after some time to allow future alerts
            this.time.delayedCall(1000, () => {
                chairZone.hasAlerted = false;
            }, [], this);
        }
    }

    update() {
        if (this.player) {
            const { up, down, left, right } = this.cursor;
            this.player.setVelocity(0);
            let moving = false;
            let newAnimation = this.player.animationState;

            // Determine movement and set velocity
            if (left.isDown || keyA.isDown) {
                this.player.setVelocityX(-this.playerSpeed);
                newAnimation = 'left';
                moving = true;
            }
            else if (right.isDown || keyD.isDown) {
                this.player.setVelocityX(this.playerSpeed);
                newAnimation = 'right';
                moving = true;
            }

            if (up.isDown || keyW.isDown) {
                this.player.setVelocityY(-this.playerSpeed);
                newAnimation = 'up';
                moving = true;
            } else if (down.isDown || keyS.isDown) {
                this.player.setVelocityY(this.playerSpeed);
                newAnimation = 'down';
                moving = true;
            }

            // If no movement keys are pressed, set to idle
            if (!moving) {
                newAnimation = 'idle';
            }

            // If animation state has changed, play the new animation and emit the change
            if (newAnimation !== this.player.animationState) {
                this.player.anims.play(`${this.player.playerSprite}_${newAnimation}`, true);
                this.player.animationState = newAnimation;

                // Emit the new animation state along with position
                this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, animationState: this.player.animationState });
            }

            // Emit movement if position has changed
            const x = this.player.x;
            const y = this.player.y;
            if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
                this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, animationState: this.player.animationState });
            }
            this.player.oldPosition = {
                x: this.player.x,
                y: this.player.y,
            };
        }
    }
}

// Helper function to capitalize sprite keys
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const gameCanvas = document.getElementById('gameCanvas'); // Ensure this element exists in your HTML

class HUD extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'HUD', active: true });
    }

    create ()
    {
        const roundTimer = new RoundTimer(this);
        roundTimer.initiateRoundTimer();

        const Game = this.scene.get('scene-game');
        Game.events.on('startGame', function () {
            roundTimer.startRoundTimer();
        }, this);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: sizes.width,
    height: sizes.height,
    canvas: gameCanvas,
    scale: {
        mode: Phaser.Scale.CENTER_BOTH,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene, HUD]
}

const game = new Phaser.Game(config);
