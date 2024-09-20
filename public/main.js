import {MusicController} from "./music-controller.js";
import {PlayerFeedback} from "./player-feedback.js";
import {gamesStateListeners} from "./games-state-listener.js";

const worldSize = {
    width: 4160,
    height: 3840,
};

// Active sprites available for players
const activeSpriteKeys = ['adam', 'alex', 'amelia', 'bob'];

const speed = 300;
let keyA;
let keyS;
let keyD;
let keyW;
const ZOOM_LEVEL = 2;

class GameScene extends Phaser.Scene {
    constructor() {
        super('scene-game');
        this.player = null;
        this.otherPlayers = null;
        this.cursor = null;
        this.playerSpeed = speed + 50;
        this.entryCollider = null;
        this.alreadyPlayingInOtherTab = false;
        this.playerSprite = 'bob';
        this.animationState = 'idle';
        this.musicController = null;
    }

    addPlayer(playerInfo, spawnPoint, worldLayer, decorationLayer, entryLayer) {
        const avatarKey = `${playerInfo.playerSprite}_idle`;
        this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, avatarKey).setOrigin(0.5, 0.5);
        this.player.playerId = playerInfo.playerId;
        this.player.body.setSize(this.player.width, this.player.height - 20);
        this.player.body.setOffset(0, 20);
        this.player.playerSprite = playerInfo.playerSprite;
        this.player.animationState = playerInfo.animationState || 'idle';
        this.player.setImmovable(false); // Allow player to move
        this.player.anims.play(`${playerInfo.playerSprite}_${this.player.animationState}`, true); // Play initial animation
        this.physics.add.collider(this.player, worldLayer);
        this.physics.add.collider(this.player, decorationLayer);
        this.entryCollider = this.physics.add.collider(this.player, entryLayer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1); // Adjust the zoom level as desired
        this.cameras.main.setBounds(0, 0, worldSize.width, worldSize.height);

        // Add overlap detection between player and chairs
        this.physics.add.overlap(this.player, this.chairs, this.handleChairOverlap, null, this);
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

    // Game Lifecycle Hooks
    startLobby(remainingTime) {
        this.events.emit('startLobby', remainingTime);
        console.log('Pre Game Phase!');
    }

    startGame(remainingTime) {
        this.events.emit('startGame', remainingTime);
        console.log('Game started!');
    }

    stopGame(remainingTime) {
        this.events.emit('stopGame', remainingTime);
        console.log('Game stopped!');
    }

    preload() {
        // Load map assets
        this.load.image('walls', 'assets/map/Room_Builder_free_32x32.png');
        this.load.image('decoration', 'assets/map/Interiors_free_32x32.png');
        // this.load.image('walls_extended', 'assets/map/Room_Builder_32x32.png');
        // this.load.image('decoration_extended', 'assets/map/Interiors_32x32.png');
        this.load.tilemapTiledJSON('map', 'assets/map/world.json');

        // Load sprites for each active sprite key
        activeSpriteKeys.forEach((spriteKey) => {
            // Load run animation
            this.load.spritesheet(spriteKey, `assets/sprites/${spriteKey}/${capitalize(spriteKey)}_run_32x32.png`, {
                frameWidth: 32,
                frameHeight: 64,
            });

            // Load idle animation
            this.load.spritesheet(
                `${spriteKey}_idle`,
                `assets/sprites/${spriteKey}/${capitalize(spriteKey)}_idle_anim_32x32.png`,
                {
                    frameWidth: 32,
                    frameHeight: 64,
                },
            );
        });

        // Load npc sprites
        this.load.spritesheet(
            `bob_sit`,
            `assets/sprites/bob/Bob_sit_32x32.png`,
            {
                frameWidth: 48,
                frameHeight: 64,
            },
        );

        // Load audio
        this.load.audio('backgroundMusic', 'assets/audio/game-bg-music.mp3');
    }

    create() {
        this.socket = io();
        const self = this;

        gamesStateListeners(this);

        // Load and configure the tilemap
        const map = this.make.tilemap({key: 'map'});
        const spawnPoint = map.findObject('Spawn Point', (obj) => obj.name === 'Spawn Point');
        const chairObjects = map.getObjectLayer('Chairs')?.objects || [];
        this.musicController = new MusicController(this.sound);

        const tileset = map.addTilesetImage('Room_Builder_free_32x32', 'walls');
        const decorationset = map.addTilesetImage('Interiors_free_32x32', 'decoration');
        // const tilesetExtended = map.addTilesetImage('Room_Builder_32x32', 'walls_extended');
        // const decorationsetExtended = map.addTilesetImage('Interiors_32x32', 'decoration_extended');

        const belowLayer = map.createLayer("floor", tileset, 0, 0);
        const worldLayer = map.createLayer("walls", [tileset, decorationset], 0, 0);
        const entryLayer = map.createLayer("entry", tileset, 0, 0);
        const decorationLayer = map.createLayer("decorations", decorationset, 0, 0);

        worldLayer.setCollisionByProperty({collides: true});
        decorationLayer.setCollisionByProperty({collides: true});
        entryLayer.setCollisionByProperty({collides: true});        

        setTimeout(() => {
            console.log(this.entryCollider);
            if (this.entryCollider) {
                console.log("entryLayer", entryLayer);
                this.physics.world.removeCollider(this.entryCollider);
                entryLayer.destroy();
            }
        }, 5000);

        this.cursor = this.input.keyboard.createCursorKeys();

        // Add WASD Keys for animations
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

        // Initialize groups
        this.otherPlayers = this.physics.add.group();

        // Register socket event handlers using arrow functions to preserve 'this'
        this.socket.on('currentPlayers', (players) => {
            console.log(players, this.socket.id);
            Object.keys(players).forEach((id) => {
                if (players[id].playerId === this.socket.id) {
                    this.addPlayer(players[id], spawnPoint, worldLayer, decorationLayer, entryLayer);
                } else {
                    this.addOtherPlayer(players[id]);
                }
            });
        });

        // Handle new player joining
        this.socket.on('newPlayer', (playerInfo) => {
            this.addOtherPlayer(playerInfo);
        });

        // Handle player movement
        this.socket.on('playerMoved', (playerInfo) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                    // Update animation state if it has changed
                    if (otherPlayer.animationState !== playerInfo.animationState) {
                        otherPlayer.anims.play(`${otherPlayer.playerSprite}_${playerInfo.animationState}`, true);
                        otherPlayer.animationState = playerInfo.animationState;
                    }
                }
            });
        });

        // Handle player removal
        this.socket.on('playerRemoved', (playerId) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });

        this.socket.on('alreadyPlaying', (isPlaying) => {
            this.alreadyPlayingInOtherTab = isPlaying;
        });

        // Create a physics group for chair zones
        this.chairs = this.physics.add.staticGroup();

        // Determine which chair is available (not taken)
        const availableChairIndex = Phaser.Math.Between(0, chairObjects.length - 1);

        // Npc Animations
        this.anims.create({
            key: `bob_sit_left`,
            frames: this.anims.generateFrameNumbers(`bob_sit`, { start: 0, end: 0 }),
            frameRate: 10,
        });

        this.anims.create({
            key: `bob_sit_right`,
            frames: this.anims.generateFrameNumbers(`bob_sit`, { start: 6, end: 7 }),
            frameRate: 10,
        });

        // Iterate through each chair object from the tilemap and create a Zone
        chairObjects.forEach((chair, index) => {
            chair.taken = (index !== availableChairIndex);

            // Create a Zone for each chair
            const chairZone = this.add.zone(chair.x, chair.y - chair.height, chair.width, chair.height);
            this.physics.world.enable(chairZone, Phaser.Physics.Arcade.STATIC_BODY);
            chairZone.body.setSize(chair.width + 100, chair.height);
            chairZone.body.setOffset(0, 0);
            chairZone.isChair = true;
            chairZone.taken = chair.taken;

            // Add the zone to the chairs group
            this.chairs.add(chairZone);

            // Add npc only on taken chairs
            if (chair.taken) {
                const npc = this.physics.add.sprite(chair.x, chair.y, 'bob_sit').setOrigin(0.6, 0.9);
                npc.body.setSize(npc.width - 20, npc.height - 20);
                npc.body.setOffset(20, 20);

                if(chair.type === 'Left') {
                    npc.setFlipX(true);

                }

            }
        });

        // Define animations for each sprite
        activeSpriteKeys.forEach((spriteKey) => {
            // Left
            this.anims.create({
                key: `${spriteKey}_left`,
                frames: this.anims.generateFrameNumbers(spriteKey, {start: 12, end: 17}),
                frameRate: 10,
                repeat: -1,
            });

            // Idle
            this.anims.create({
                key: `${spriteKey}_idle`,
                frames: this.anims.generateFrameNumbers(`${spriteKey}_idle`, {start: 18, end: 23}),
                frameRate: 10,
                repeat: -1,
            });

            // Right
            this.anims.create({
                key: `${spriteKey}_right`,
                frames: this.anims.generateFrameNumbers(spriteKey, {start: 0, end: 5}),
                frameRate: 10,
                repeat: -1,
            });

            // Up
            this.anims.create({
                key: `${spriteKey}_up`,
                frames: this.anims.generateFrameNumbers(spriteKey, {start: 6, end: 11}),
                frameRate: 10,
                repeat: -1,
            });

            // Down
            this.anims.create({
                key: `${spriteKey}_down`,
                frames: this.anims.generateFrameNumbers(`${spriteKey}`, {start: 18, end: 23}),
                frameRate: 10,
                repeat: -1,
            });

        });
    }

    handleChairOverlap(player, chairZone) {
        const finalPopup = document.querySelector('.final-popup')
        if (!chairZone.taken) {
            finalPopup.classList.remove('hidden')
            player.body.setVelocity(0);
            this.physics.pause();
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
            } else if (right.isDown || keyD.isDown) {
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
                this.socket.emit('playerMovement', {
                    x: this.player.x,
                    y: this.player.y,
                    animationState: this.player.animationState,
                });
            }

            // Emit movement if position has changed
            const x = this.player.x;
            const y = this.player.y;
            if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
                this.socket.emit('playerMovement', {
                    x: this.player.x,
                    y: this.player.y,
                    animationState: this.player.animationState,
                });
            }
            this.player.oldPosition = {
                x: this.player.x,
                y: this.player.y,
            };
        }     
        
        if (this.alreadyPlayingInOtherTab) {            
            this.musicController.stopMusic();
            this.add.rectangle(0, 0, worldSize.width, worldSize.height, 0x000000);
            this.add.text(100, 100, "You entered the game with your current IP address already!", { font: '25px Arial', fill: '#fff' });
        }
    }
}

// Helper function to capitalize sprite keys
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const gameCanvas = document.getElementById('gameCanvas'); // Ensure this element exists in your HTML

class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'HUD', active: true });
    }

    create() {
        const Game = this.scene.get('scene-game');

        const preGameCounter = new PlayerFeedback(
            this,
            'Game starts in: ',
            null,
            'center'
        );
        preGameCounter.setBackgroundColor('#000', 0.3);

        const roundTimer = new PlayerFeedback(
            this,
            'Round Timer: ',
            null,
            'top-right'
        );
        roundTimer.setBackgroundColor('#001e3c', 0.8);

        const roundOverFeedback = new PlayerFeedback(this, 'Round Over!', null, 'center');
        roundOverFeedback.setBackgroundColor('#000', 0.3);


        Game.events.on('startLobby', function (remainingTime) {
            console.log('startLobby', remainingTime);
            roundOverFeedback.removeFeedback();
            preGameCounter.addCountdown('preGameEnd', remainingTime ?? 10);
            preGameCounter.render();
        }, this);

        Game.events.on('startGame', function (remainingTime) {
            console.log('startGame', remainingTime);
            preGameCounter.removeFeedback();
            roundTimer.addCountdown('roundTimerEnd', remainingTime ?? 60);
            roundTimer.render();
        }, this);

        Game.events.on('stopGame', function (remainingTime) {
            console.log('stopGame', remainingTime);
            roundTimer.removeFeedback();
            roundOverFeedback.setDuration(remainingTime ?? 2)
            roundOverFeedback.render();
        }, this);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 1700,
    height: 650,
    canvas: gameCanvas,
    scale: {
        parent: 'game-wrapper',
        mode: Phaser.Scale.RESIZE,
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
