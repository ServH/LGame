import Phaser from 'phaser';

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Título del juego
    this.add.text(width / 2, height / 2 - 100, 'LOOP GAME', { 
      font: '48px monospace',
      fill: '#ffffff' 
    }).setOrigin(0.5);
    
    // Botón de inicio
    const startButton = this.add.text(width / 2, height / 2, 'Iniciar Juego', { 
      font: '32px monospace',
      fill: '#ffffff' 
    }).setOrigin(0.5).setInteractive();
    
    startButton.on('pointerover', () => startButton.setStyle({ fill: '#ff0' }));
    startButton.on('pointerout', () => startButton.setStyle({ fill: '#ffffff' }));
    startButton.on('pointerdown', () => this.scene.start('GameScene'));
    
    // Versión
    this.add.text(width - 20, height - 20, 'v0.1.0', { 
      font: '16px monospace',
      fill: '#666666' 
    }).setOrigin(1);
  }
}

export default MainMenuScene;
