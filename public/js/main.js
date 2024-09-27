import { GameScene } from "./scenes/GameScene.js";
import { HUD } from "./scenes/HUD.js";

const gameCanvas = document.getElementById('gameCanvas'); // Ensure this element exists in your HTML

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
