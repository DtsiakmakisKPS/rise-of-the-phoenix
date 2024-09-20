import {musicController} from "./music-controller.js";
import {PlayerFeedback} from "./player-feedback.js";

const worldSize = {
    width: 4160,
    height: 3840
}

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
        this.cursor;
        this.animationState = 'idle';
        this.playerSpeed = speed + 50;
        this.currentAnimation = 'idle';
        this.chairs = null; // Group to hold chair zones
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

    preload(){
        this.load.image('walls', 'assets/Room_Builder_free_32x32.png');
        this.load.image('decoration', 'assets/Interiors_free_32x32.png');
        this.load.tilemapTiledJSON('map', 'assets/world.json');
        this.load.spritesheet('dude', 'assets/Bob_run_32x32.png', {
            frameWidth: 32,
            frameHeight: 64,
        });
        this.load.spritesheet('dude_idle', 'assets/Bob_idle_anim_32x32.png', {
            frameWidth: 32,
            frameHeight: 64,
        });
        this.load.audio('backgroundMusic', 'assets/game-bg-music.mp3');
    }

    create(){    
        this.socket = io();
        var self = this;

        // React to UI Events
        const HUD = this.scene.get('HUD');
        HUD.events.on('preGameEnd', function () {
            this.startGame();
        }, this);
        HUD.events.on('roundTimerEnd', function () {
            this.stopGame();
        }, this);

        // Define animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 12, end: 17 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: 'idle',
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

        const map = this.make.tilemap({ key: 'map' });
        const spawnPoint = map.findObject("Spawn Point", obj => obj.name === "Spawn Point");
        const chairObjects = map.getObjectLayer("Chairs")?.objects || []; // Get all chair objects
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
                
        this.cursor = this.input.keyboard.createCursorKeys();

        //add WASD Keys for animations
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        
        this.otherPlayers = this.physics.add.group();

        this.socket.on('currentPlayers', function (players) {            
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === self.socket.id) {
                    self.addPlayer(self, players[id], spawnPoint, worldLayer, decorationLayer, entryLayer);
                } else {
                    self.addOtherPlayer(self, players[id]);
                }
            });
        });

        this.socket.on('newPlayer', function (playerInfo) {
          self.addOtherPlayer(self, playerInfo);
        });

        this.socket.on('playerMoved', function (playerInfo) {             
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {                
                if (playerInfo.playerId === otherPlayer.playerId) {                
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                    // TODO: play animation
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

        this.startLobby();
    }

    handleChairOverlap(player, chairZone) {
        if (!chairZone.hasAlerted) {
            alert("You touched a chair!");
            chairZone.hasAlerted = true; // Set a flag to prevent repeated alerts

            // Optionally, reset the flag after some time to allow future alerts
            this.time.delayedCall(1000, () => {
                chairZone.hasAlerted = false;
            }, [], this);
            this.stopGame();
        }
    }

    update(){
        if(this.player) {
            const {up, down, left , right} = this.cursor;
            this.player.setVelocity(0);
            let moving = false;
            let newAnimation = this.currentAnimation;
            // Horizontal movement
            if (left.isDown || keyA.isDown) {
                this.player.setVelocityX(-this.playerSpeed);
                this.player.anims.play('left', true);
                moving = true;
                newAnimation = 'left';
            }
            else if (right.isDown || keyD.isDown) {
                this.player.setVelocityX(this.playerSpeed);
                this.player.anims.play('right', true);
                moving = true;
                newAnimation = 'right';
            }
            // Vertical movement
            else if (up.isDown || keyW.isDown) {
                this.player.setVelocityY(-this.playerSpeed);
                this.player.anims.play('up', true);
                moving = true;
                newAnimation = 'up';
            } else if (down.isDown || keyS.isDown) {
                this.player.setVelocityY(this.playerSpeed);
                this.player.anims.play('down', true);
                moving = true;
                newAnimation = 'down';
            }

            // Idle movement
            if (!moving) {
                this.player.anims.play('idle', true);
                newAnimation = 'idle';
            }
            
            var x = this.player.x;
            var y = this.player.y;
            if (this.player.oldPosition &&  (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
                this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y });
            }    
            this.player.oldPosition = {
                x: this.player.x,
                y: this.player.y,
            }        
        }
    }
}

class HUD extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'HUD', active: true });
    }

    create ()
    {
        const Game = this.scene.get('scene-game');


        const preGameCounter = new PlayerFeedback(
            this,
            'Game starts in: ',
            sizes,
            { x: sizes.width / 2, y: (sizes.height / 2) - 500 },);
        preGameCounter.addCountdown('preGameEnd', 10);
        preGameCounter.setBackgroundColor('#000', 0.3);
        Game.events.on('startLobby', function () {
            preGameCounter.render();
        }, this);

        const roundTimer = new PlayerFeedback(
            this,
            'Round Timer: ',
            sizes,
            { x: sizes.width / 2, y: 300 },
        );
        roundTimer.addCountdown('roundTimerEnd', 150);
        roundTimer.setBackgroundColor('#001e3c', 0.8);
        Game.events.on('startGame', function () {
            roundTimer.render();
        }, this);

        const roundOverFeedback = new PlayerFeedback(this, 'Round Over!', sizes);
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
        parent: 'game-wrapper',
        mode: Phaser.Scale.FIT,
        width: 1700,
        height: 600,
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
