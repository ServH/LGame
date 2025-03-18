// src/scenes/MainMenuScene.js
import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    // Configurar fondo y estilo
    this.setupBackground();

    // Crear título y elementos de menú
    this.createMenuElements();

    // Configurar controles
    this.setupControls();
  }

  /**
   * Configura el fondo de la escena
   */
  setupBackground() {
    const { width, height } = this.cameras.main;
    
    // Fondo
    this.cameras.main.setBackgroundColor('#111111');
    
    // Estrellas (puntos)
    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(20, height - 20);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      
      // Algunas estrellas parpadean
      if (Math.random() < 0.3) {
        this.tweens.add({
          targets: star,
          alpha: 0.2,
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
    
    // Grid tenue de fondo
    this.add.grid(
      width / 2,
      height / 2,
      width,
      height,
      64,
      64,
      undefined,
      undefined,
      0x222222,
      0.3
    );
  }

  /**
   * Crea los elementos del menú
   */
  createMenuElements() {
    const { width, height } = this.cameras.main;
    
    // Título del juego
    const title = this.add.text(width / 2, height / 4, 'LOOP ADVENTURE', {
      font: 'bold 48px monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);
    
    // Efecto de título
    this.tweens.add({
      targets: title,
      y: height / 4 - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Subtítulo
    const subtitle = this.add.text(width / 2, height / 4 + 60, 'Un juego inspirado en Loop Hero', {
      font: '20px monospace',
      fill: '#cccccc'
    });
    subtitle.setOrigin(0.5);
    
    // Botón de Iniciar Juego
    const startButton = this.createButton(width / 2, height / 2, 'Iniciar Juego', () => {
      this.startGame();
    });
    
    // Botón de Controles
    const controlsButton = this.createButton(width / 2, height / 2 + 70, 'Controles', () => {
      this.showControls();
    });
    
    // Botón de Créditos
    const creditsButton = this.createButton(width / 2, height / 2 + 140, 'Créditos', () => {
      this.showCredits();
    });
    
    // Versión
    const version = this.add.text(width - 20, height - 20, 'v0.1.0', {
      font: '16px monospace',
      fill: '#666666'
    });
    version.setOrigin(1);
  }

  /**
   * Crea un botón interactivo
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} text - Texto del botón
   * @param {Function} callback - Función a ejecutar al hacer clic
   * @returns {Object} Grupo con el botón y su texto
   */
  createButton(x, y, text, callback) {
    const button = this.add.rectangle(x, y, 250, 50, 0x222222, 0.8);
    button.setStrokeStyle(1, 0x666666);
    button.setInteractive();
    
    const buttonText = this.add.text(x, y, text, {
      font: '24px monospace',
      fill: '#ffffff'
    });
    buttonText.setOrigin(0.5);
    
    // Efectos de hover
    button.on('pointerover', () => {
      button.setFillStyle(0x444444, 0.8);
      buttonText.setStyle({ fill: '#ffff00' });
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x222222, 0.8);
      buttonText.setStyle({ fill: '#ffffff' });
    });
    
    // Acción al hacer clic
    button.on('pointerdown', callback);
    
    return { button, text: buttonText };
  }

  /**
   * Configura los controles del menú
   */
  setupControls() {
    // Tecla Enter para iniciar
    this.input.keyboard.once('keydown-ENTER', () => {
      this.startGame();
    });
    
    // Tecla C para controles
    this.input.keyboard.once('keydown-C', () => {
      this.showControls();
    });
  }

  /**
   * Inicia el juego
   */
  startGame() {
    // Efecto de transición
    this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
      if (progress === 1) {
        // Iniciar en la escena de base para primera experiencia
        this.scene.start('BaseScene');
      }
    });
  }

  /**
   * Muestra la pantalla de controles
   */
  showControls() {
    const { width, height } = this.cameras.main;
    
    // Panel de fondo
    const panel = this.add.rectangle(width / 2, height / 2, 500, 400, 0x000000, 0.8);
    panel.setStrokeStyle(2, 0xaaaaaa);
    
    // Título
    const title = this.add.text(width / 2, height / 2 - 160, 'CONTROLES', {
      font: 'bold 28px monospace',
      fill: '#ffffff'
    });
    title.setOrigin(0.5);
    
    // Lista de controles
    const controlsData = [
      { key: 'ESPACIO', action: 'Pausar/Reanudar juego' },
      { key: '1, 2, 3', action: 'Velocidad de juego' },
      { key: 'T', action: 'Modo colocación de tiles' },
      { key: 'G, R, H, L', action: 'Seleccionar tipo de tile' },
      { key: 'ESC', action: 'Cancelar acción' },
      { key: 'ENTER', action: 'Confirmar/Iniciar' }
    ];
    
    controlsData.forEach((control, index) => {
      const y = height / 2 - 100 + index * 40;
      
      // Tecla
      const keyText = this.add.text(width / 2 - 150, y, control.key, {
        font: 'bold 18px monospace',
        fill: '#ffff00'
      });
      
      // Descripción
      const actionText = this.add.text(width / 2 - 20, y, control.action, {
        font: '18px monospace',
        fill: '#ffffff'
      });
    });
    
    // Botón de volver
    const backButton = this.createButton(width / 2, height / 2 + 150, 'Volver', () => {
      // Eliminar todos los elementos
      panel.destroy();
      title.destroy();
      backButton.button.destroy();
      backButton.text.destroy();
      
      // Eliminar textos de controles
      this.children.list
        .filter(child => 
          child.type === 'Text' && 
          (child.text === 'CONTROLES' || 
           controlsData.some(c => c.key === child.text || c.action === child.text))
        )
        .forEach(child => child.destroy());
    });
  }

  /**
   * Muestra los créditos
   */
  showCredits() {
    const { width, height } = this.cameras.main;
    
    // Panel de fondo
    const panel = this.add.rectangle(width / 2, height / 2, 500, 400, 0x000000, 0.8);
    panel.setStrokeStyle(2, 0xaaaaaa);
    
    // Título
    const title = this.add.text(width / 2, height / 2 - 160, 'CRÉDITOS', {
      font: 'bold 28px monospace',
      fill: '#ffffff'
    });
    title.setOrigin(0.5);
    
    // Contenido
    const creditsText = this.add.text(width / 2, height / 2 - 100, 
      'Juego creado como ejemplo para\naprender desarrollo de videojuegos\ncon Phaser.js\n\n' +
      'Inspirado en Loop Hero\nde Four Quarters\n\n' +
      'Desarrollado como proyecto educativo', {
      font: '18px monospace',
      fill: '#ffffff',
      align: 'center'
    });
    creditsText.setOrigin(0.5, 0);
    
    // Botón de volver
    const backButton = this.createButton(width / 2, height / 2 + 150, 'Volver', () => {
      // Eliminar todos los elementos
      panel.destroy();
      title.destroy();
      creditsText.destroy();
      backButton.button.destroy();
      backButton.text.destroy();
    });
  }
}