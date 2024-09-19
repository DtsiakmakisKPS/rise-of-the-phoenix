import './style.css'
import Phaser from 'phaser';

const sizes = {
    width: 2700,
    height: 1500
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
    }

    

    preload(){
        this.load.image('tiles', '/public/assets/Room_Builder_free_32x32.png');
        this.load.tilemapTiledJSON('map', '/public/assets/world.json');
        this.load.spritesheet('dude', '/public/assets/Bob_run_16x16.png', {
            frameWidth: 16,
            frameHeight: 32,
        });
        this.load.spritesheet('dude_idle', '/public/assets/Bob_idle_anim_16x16.png', {
            frameWidth: 16,
            frameHeight: 32,
        });
    }
    create(){
        const map = this.make.tilemap( {key: 'map'});

        const tileset = map.addTilesetImage('Room_Builder_free_32x32', 'tiles');

        const belowLayer = map.createLayer("floor", tileset, 0, 0);
        const worldLayer = map.createLayer("walls", tileset, 0, 0);


        worldLayer.setCollisionByProperty({ collides: true });
        const avatarKey = this.animationState === 'idle' ? 'dude_idle' : 'dude';
        this.player = this.physics.add.sprite(300,300,avatarKey).setOrigin(0.5,0.5);
        this.player.setImmovable(true);
        this.cursor = this.input.keyboard.createCursorKeys();
        this.physics.add.collider(this.player, worldLayer);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(5); // Adjust the zoom level as desired
        this.cameras.main.setBounds(0, 0, sizes.width, sizes.height); // Set camera bounds to the map size


        //add WASD Keys for animations
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
    }
    update(){
        const {up, down, left , right} = this.cursor;
        this.player.setVelocity(0);
        let moving = false;
        let newAnimation = this.currentAnimation;
        // Horizontal movement
        if (left.isDown || keyA.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
            moving = true;
            newAnimation = 'left';
        } 
        else if (right.isDown || keyD.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
            moving = true;
            newAnimation = 'right';
        }
        // Vertical movement
        else if (up.isDown || keyW.isDown) {
            this.player.setVelocityY(-160);
            this.player.anims.play('up', true);
            moving = true;
            newAnimation = 'up';
        } else if (down.isDown || keyS.isDown) {
            this.player.setVelocityY(160);
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
    type:Phaser.WEBGL,
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
            gravity: {y:0},
            debug: false
        }

    },
    scene: [GameScene]
}

const game = new Phaser.Game(config);

