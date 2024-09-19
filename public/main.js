import { musicController } from "./music-controller.js";

const sizes = {
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
        this.cursor;
        this.animationState = 'idle';
        this.playerSpeed = speed + 50;
        this.currentAnimation = 'idle';
        this.chairs = null;
        this.emptyChair = null;
    }

    preload(){
        this.load.image('walls', 'assets/Room_Builder_free_32x32.png');
        this.load.image('decoration', 'assets/Interiors_free_32x32.png');
        this.load.tilemapTiledJSON('map', 'assets/world.json');
        this.load.spritesheet('dude_sit', 'assets/Bob_sit_32x32.png', {
            frameWidth: 48,
            frameHeight: 64,
        });
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
        const map = this.make.tilemap({ key: 'map' });
        const spawnPoint = map.findObject("Spawn Point", obj => obj.name === "Spawn Point");
        const chairObjects = map.getObjectLayer("Chairs")?.objects || []; // Get all chair objects
        musicController(this.sound);

        const tileset = map.addTilesetImage('Room_Builder_free_32x32', 'walls');
        const decorationset = map.addTilesetImage('Interiors_free_32x32', 'decoration');

        const belowLayer = map.createLayer("floor", tileset, 0, 0);
        const worldLayer = map.createLayer("walls", [tileset, decorationset], 0, 0);
        const decorationLayer = map.createLayer("decorations", decorationset, 0, 0);

        worldLayer.setCollisionByProperty({ collides: true });
        decorationLayer.setCollisionByProperty({ collides: true });

        const avatarKey = this.animationState === 'idle' ? 'dude_idle' : 'dude';
        this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, avatarKey).setOrigin(0.5, 0.5);
        this.player.setImmovable(false); // Allow player to move
        this.cursor = this.input.keyboard.createCursorKeys();
        this.physics.add.collider(this.player, worldLayer);
        this.physics.add.collider(this.player, decorationLayer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(4); // Adjust the zoom level as desired
        this.cameras.main.setBounds(0, 0, sizes.width, sizes.height); // Set camera bounds to the map size

        // Add WASD Keys for animations
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

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

        this.player.anims.play(this.animationState, true);

        // Create Chairs
        this.chairs = this.physics.add.staticGroup();

        // Ensure there is at least one chair
        if (chairObjects.length === 0) {
            console.warn("No chair objects found in the 'Chairs' layer.");
            return;
        }

        // Randomly select one chair to be the empty chair
        const randomIndex = Phaser.Math.Between(0, chairObjects.length - 1);
        const emptyChair = chairObjects[randomIndex];
        let chairZone;
        this.emptyChair = emptyChair; // Optional: Store reference if needed

        // Iterate through each chair object from the tilemap and create accordingly
        chairObjects.forEach((chair, index) => {
            if (index === randomIndex) {
                // empty chair does not have a sprite
                chairZone = this.add.zone(chair.x, chair.y - chair.height, chair.width, chair.height);
                this.physics.world.enable(chairZone, Phaser.Physics.Arcade.STATIC_BODY);
                chairZone.body.setSize(chair.width, chair.height);
                chairZone.body.setOffset(0, 0);
                chairZone.isEmpty = true; // Mark as empty chair

                // Add the zone to the chairs group
                this.chairs.add(chairZone);
            } else {
                // Regular Chairs
                const chairSprite = this.physics.add.sprite(chair.x, chair.y, 'dude_sit').setOrigin(0.6, 0.9);
                chairSprite.body.setImmovable(true); // Prevent chairs from moving if collided

                chairZone = this.add.zone(chair.x, chair.y - chair.height, chair.width, chair.height);
                this.physics.world.enable(chairZone, Phaser.Physics.Arcade.STATIC_BODY);
                chairZone.body.setSize(chair.width, chair.height);
                chairZone.body.setOffset(0, 0);
                chairZone.isEmpty = false; // Regular chair

                // Add the zone to the chairs group
                this.chairs.add(chairZone);
            }
        });

        // Add overlap detection between player and chairs
        this.physics.add.overlap(this.player, this.chairs, this.handleChairOverlap, null, this);
    }

    handleChairOverlap(player, chairZone) {
        // Trigger alert only if it's the empty chair
        if (chairZone.isEmpty && !chairZone.hasAlerted) {
            alert("You touched the empty chair!");
            chairZone.hasAlerted = true;

            // Reset the flag after some time to allow future alerts
            this.time.delayedCall(1000, () => {
                chairZone.hasAlerted = false;
            }, [], this);
        }
    }

    update(){
        const { up, down, left, right } = this.cursor;
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
        if (up.isDown || keyW.isDown) {
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
    scene: [GameScene]
}

const game = new Phaser.Game(config);
