import Phaser from 'phaser';

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Ejemplo de HUD básico
    this.add.text(10, 10, 'Vida: 100/100', { 
      font: '16px monospace',
      fill: '#ffffff' 
    });
    
    this.add.text(10, 30, 'Nivel: 1', { 
      font: '16px monospace',
      fill: '#ffffff' 
    });
    
    // Botón de pausa (ejemplo)
    const pauseButton = this.add.text(780, 10, 'II', { 
      font: '16px monospace',
      fill: '#ffffff' 
    }).setOrigin(1, 0).setInteractive();
    
    pauseButton.on('pointerdown', () => {
      console.log('Juego pausado');
      // Lógica de pausa
    });
  }
}

export default UIScene;
