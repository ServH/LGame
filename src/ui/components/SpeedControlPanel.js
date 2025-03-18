// src/ui/components/SpeedControlPanel.js
import UIComponent from '../UIComponent';

/**
 * Panel de control de velocidad del juego
 */
export default class SpeedControlPanel extends UIComponent {
  /**
   * Inicializa el panel de control de velocidad
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Object} options - Opciones de configuración
   */
  constructor(scene, options = {}) {
    super(scene);
    
    this.options = {
      x: scene.cameras.main.width - 200,
      y: 10,
      width: 190,
      height: 50,
      ...options
    };
    
    this.speedButtons = {};
    this.currentSpeed = 1;
    this.onSpeedChange = null;
    
    this.create();
  }

  /**
   * Crea el panel de control de velocidad
   */
  create() {
    const { x, y, width, height } = this.options;
    
    // Fondo del panel
    const panel = this.createPanel(
      x + width / 2, 
      y + height / 2, 
      width, 
      height, 
      { id: 'speed_panel' }
    );
    
    // Título
    const title = this.createText(
      x + 10, 
      y + 10, 
      'VELOCIDAD', 
      {
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#ffffff',
        id: 'speed_title'
      }
    );
    
    // Botones de velocidad
    this.createSpeedButtons(x, y, width, height);
    
    // Texto de atajos
    const shortcutText = this.createText(
      x + 10, 
      y + 35, 
      '(teclas 1-3, ESPACIO)', 
      {
        fontSize: 10,
        color: '#aaaaaa',
        id: 'speed_shortcuts'
      }
    );
  }

  /**
   * Crea los botones de control de velocidad
   * @param {number} x - Posición X base
   * @param {number} y - Posición Y base
   * @param {number} width - Ancho del panel
   * @param {number} height - Alto del panel
   */
  createSpeedButtons(x, y, width, height) {
    const buttonWidth = 40;
    const buttonHeight = 25;
    const buttonSpacing = 5;
    const startX = x + 10;
    const startY = y + 30;
    
    const speeds = [
      { key: 'pause', label: 'II', value: 0 },
      { key: 'normal', label: '1x', value: 1 },
      { key: 'fast', label: '2x', value: 2 },
      { key: 'superfast', label: '4x', value: 4 }
    ];
    
    speeds.forEach((speed, index) => {
      const buttonX = startX + index * (buttonWidth + buttonSpacing);
      
      // Fondo del botón
      const button = this.scene.add.rectangle(
        buttonX + buttonWidth / 2,
        startY + buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        speed.value === this.currentSpeed ? 0x008800 : 0x444444
      );
      button.setInteractive();
      
      // Texto del botón
      const text = this.scene.add.text(
        buttonX + buttonWidth / 2,
        startY + buttonHeight / 2,
        speed.label,
        {
          font: '12px Arial',
          fill: '#ffffff'
        }
      );
      text.setOrigin(0.5);
      
      // Eventos
      button.on('pointerover', () => {
        if (this.currentSpeed !== speed.value) {
          button.setFillStyle(0x666666);
        }
      });
      
      button.on('pointerout', () => {
        if (this.currentSpeed !== speed.value) {
          button.setFillStyle(0x444444);
        }
      });
      
      button.on('pointerdown', () => {
        if (this.onSpeedChange) {
          this.onSpeedChange(speed.value);
        }
      });
      
      // Guardar referencia
      this.speedButtons[speed.key] = { button, text, value: speed.value };
      
      // Añadir al mapa de elementos
      this.elements.set(`speed_button_${speed.key}`, button);
      this.elements.set(`speed_text_${speed.key}`, text);
    });
  }

  /**
   * Actualiza el botón de velocidad
   * @param {number} speed - Nueva velocidad
   */
  updateSpeed(speed) {
    const oldSpeed = this.currentSpeed;
    this.currentSpeed = speed;
    
    // Resetear color del botón anterior
    const speedKeys = ['pause', 'normal', 'fast', 'superfast'];
    const oldSpeedKey = speedKeys.find(key => this.speedButtons[key]?.value === oldSpeed) || 'normal';
    const newSpeedKey = speedKeys.find(key => this.speedButtons[key]?.value === speed) || 'normal';
    
    // Actualizar colores
    if (this.speedButtons[oldSpeedKey]) {
      this.speedButtons[oldSpeedKey].button.setFillStyle(0x444444);
    }
    
    if (this.speedButtons[newSpeedKey]) {
      this.speedButtons[newSpeedKey].button.setFillStyle(0x008800);
    }
  }

  /**
   * Establece el callback para cambios de velocidad
   * @param {Function} callback - Función a ejecutar
   */
  setSpeedChangeCallback(callback) {
    this.onSpeedChange = callback;
  }
}