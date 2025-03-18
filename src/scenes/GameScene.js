import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Iniciar la UI
    this.scene.launch('UIScene');
    
    // Placeholder para el mapa
    const map = this.add.grid(
      400, 300,        // posición x, y
      700, 500,        // ancho, alto
      32, 32,          // tamaño de celda
      0x000000, 0,     // color de relleno
      0, 0x444444, 1   // color de borde
    );
    
    // Placeholder para el personaje
    const player = this.add.circle(100, 100, 8, 0xff0000);
    
    console.log('GameScene iniciada');
    
    // Ejemplo para testear que la escena funciona correctamente
    this.input.on('pointerdown', (pointer) => {
      console.log(`Click en: ${pointer.x}, ${pointer.y}`);
    });
  }

  update(time, delta) {
    // Lógica de update
  }
}

export default GameScene;
