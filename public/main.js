import {musicController} from "./music-controller.js";
import {PlayerFeedback} from "./player-feedback.js";

const worldSize = {
    width: 4160,
    height: 3840,
};

// Active sprites available for players
const activeSpriteKeys = ['adam', 'alex', 'amelia', 'bob'];

const speed = 300;
var keyA;
var keyS;
var keyD;
var keyW;
const ZOOM_LEVEL = 0.5;
class GameScene extends Phaser.Scene {
    constructor() {
        super('scene-game');
        this.player = null;
        this.otherPlayers = null;
        this.cursor = null;
        this.playerSpeed = speed + 50;
        this.entryCollider = null;
    }

    addPlayer(self, playerInfo, spawnPoint, worldLayer, decorationLayer, entryLayer) {
        const avatarKey = this.animationState === 'idle' ? 'dude_idle' : 'dude';        
        this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, avatarKey).setOrigin(0.5, 0.5);        
        this.player.setImmovable(false); // Allow player to move
        this.player.anims.play(this.animationState, true);
        // Add overlap detection between player and chairs
        this.physics.add.overlap(this.player, this.chairs, this.handleChairOverlap, null, this);
        this.physics.add.collider(this.player, worldLayer);        
        this.physics.add.collider(this.player, decorationLayer);
        this.entryCollider = this.physics.add.collider(this.player, entryLayer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2); // Adjust the zoom level as desired
        this.cameras.main.setBounds(0, 0, worldSize.width, worldSize.height); // Set camera bounds to the map size
    }

    addOtherPlayer(self, playerInfo) {
        const avatarKey = this.animationState === 'idle' ? 'dude_idle' : 'dude';
        const otherPlayer = this.physics.add.sprite(playerInfo.x, playerInfo.y,avatarKey).setOrigin(0.5,0.5);
        otherPlayer.playerId = playerInfo.playerId;
        otherPlayer.setImmovable(false);
        this.otherPlayers.add(otherPlayer);
    }

    startLobby() {
        this.events.emit('startLobby');
        console.log('Pre Game Phase!');
    }

    startGame() {
        this.events.emit('startGame');
        console.log('Game started!');
    }

    stopGame() {
        this.events.emit('stopGame');
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

        // React to UI Events
        const HUD = this.scene.get('HUD');
        HUD.events.on('preGameEnd', function () {
            this.startGame();
        }, this);
        HUD.events.on('roundTimerEnd', function () {
            this.stopGame();
        }, this);


        // Load and configure the tilemap
        const map = this.make.tilemap({ key: 'map' });
        const spawnPoint = map.findObject('Spawn Point', (obj) => obj.name === 'Spawn Point');
        const chairObjects = map.getObjectLayer('Chairs')?.objects || [];
        musicController(this.sound);

        const tileset = map.addTilesetImage('Room_Builder_free_32x32', 'walls');
        const decorationset = map.addTilesetImage('Interiors_free_32x32', 'decoration');
        // const tilesetExtended = map.addTilesetImage('Room_Builder_32x32', 'walls_extended');
        // const decorationsetExtended = map.addTilesetImage('Interiors_32x32', 'decoration_extended');

        const belowLayer = map.createLayer("floor", tileset, 0, 0);
        const worldLayer = map.createLayer("walls", [tileset, decorationset], 0, 0);
        const entryLayer = map.createLayer("entry", tileset, 0, 0);
        const decorationLayer = map.createLayer("decorations", decorationset, 0, 0);

        worldLayer.setCollisionByProperty({ collides: true });
        decorationLayer.setCollisionByProperty({ collides: true });
        entryLayer.setCollisionByProperty({ collides: true });
        game.scale.resize(window.innerWidth/ZOOM_LEVEL, window.innerHeight/ZOOM_LEVEL);

        this.resizing(this.cameras);

        setTimeout(function() {         
            console.log(self.entryCollider);   
            if (self.entryCollider) {
                console.log("entryLayer", entryLayer);
                self.physics.world.removeCollider(self.entryCollider);
                entryLayer.destroy();   
            }         
        }, 5000);
                
        this.cursor = this.input.keyboard.createCursorKeys();

        //add WASD Keys for animations
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

        // Initialize groups
        this.otherPlayers = this.physics.add.group();

        // Register socket event handlers outside of other handlers
        this.socket.on('currentPlayers', function (players) {
            console.log(players, self.socket.id);
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === self.socket.id) {
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

        // Handle player movement
        this.socket.on('playerMoved', function (playerInfo) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
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

        // Determine which chair is available (not taken)
        const availableChairIndex = Phaser.Math.Between(0, chairObjects.length - 1);

        // Iterate through each chair object from the tilemap and create a Zone
        chairObjects.forEach((chair, index) => {
            chair.taken = (index !== availableChairIndex);

            // Create a Zone for each chair
            const chairZone = this.add.zone(chair.x, chair.y - chair.height, chair.width, chair.height);
            this.physics.world.enable(chairZone, Phaser.Physics.Arcade.STATIC_BODY);
            chairZone.body.setSize(chair.width, chair.height);
            chairZone.body.setOffset(0, 0);
            chairZone.isChair = true;
            chairZone.taken = chair.taken;

            // Add the zone to the chairs group
            this.chairs.add(chairZone);

            // Add npc only on taken chairs
            if (chair.taken) {
                this.physics.add.sprite(chair.x, chair.y, 'bob_sit').setOrigin(0.6, 0.9);
            }
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

        this.startLobby();
    }

    handleChairOverlap(player, chairZone) {
        // Check if the chair is not taken and hasn't already triggered an alert
        if (!chairZone.taken && !chairZone.hasAlerted) {
            alert('You touched an available chair!');
            chairZone.hasAlerted = true; // Set a flag to prevent repeated alerts

            // Optionally, reset the flag after some time to allow future alerts
            this.time.delayedCall(1000, () => {
                chairZone.hasAlerted = false;
            }, [], this);
            this.stopGame();
        }
    }

    update() {
        // this.cameras.main.setZoom(5)
        if(this.player) {
            const {up, down, left , right} = this.cursor;
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
    }
} // Correctly close the GameScene class

// Helper function to capitalize sprite keys
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
    resizing(cameras) {
        window.addEventListener("resize", () => {
            game.scale.resize(window.innerWidth/ZOOM_LEVEL, window.innerHeight/ZOOM_LEVEL);
            cameras.main.setZoom(3); // Adjust the zoom level as desired
        },false

        );
    }
}

const gameCanvas = document.getElementById('gameCanvas'); // Ensure this element exists in your HTML

class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'HUD', active: true });
    }

    create ()
    {
        const Game = this.scene.get('scene-game');


        const preGameCounter = new PlayerFeedback(
            this,
            'Game starts in: ',
            worldSize,
            { x: worldSize.width / 2, y: (worldSize.height / 2) - 500 },);
        preGameCounter.addCountdown('preGameEnd', 10);
        preGameCounter.setBackgroundColor('#000', 0.3);
        Game.events.on('startLobby', function () {
            preGameCounter.render();
        }, this);

        const roundTimer = new PlayerFeedback(
            this,
            'Round Timer: ',
            worldSize,
            { x: worldSize.width / 2, y: 300 },
        );
        roundTimer.addCountdown('roundTimerEnd', 150);
        roundTimer.setBackgroundColor('#001e3c', 0.8);
        Game.events.on('startGame', function () {
            roundTimer.render();
        }, this);

        const roundOverFeedback = new PlayerFeedback(this, 'Round Over!', worldSize);
        roundOverFeedback.setBackgroundColor('#000', 0.3);
        Game.events.on('stopGame', function () {
            roundOverFeedback.render();
        }, this);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 1750,
    height: 600,
    canvas: gameCanvas,
    scale: {
        mode: Phaser.Scale.NONE,
        width: window.innerWidth/ZOOM_LEVEL,
        height: window.innerHeight/ZOOM_LEVEL,
        zoom: ZOOM_LEVEL

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