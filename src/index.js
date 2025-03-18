// src/index.js
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import BaseScene from './scenes/BaseScene';

// Configuración global del juego
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MainMenuScene, GameScene, UIScene, BaseScene]
};

// Iniciar el juego con la configuración
window.game = new Phaser.Game(config);