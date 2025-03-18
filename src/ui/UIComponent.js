// src/ui/UIComponent.js

/**
 * Clase base para componentes de la interfaz de usuario
 */
export default class UIComponent {
    /**
     * Inicializa el componente
     * @param {Phaser.Scene} scene - Escena de Phaser
     */
    constructor(scene) {
      this.scene = scene;
      this.elements = new Map();
      this.visible = true;
    }
  
    /**
     * Crea el componente visual
     */
    create() {
      // Implementado en subclases
    }
  
    /**
     * Actualiza el componente
     * @param {number} time - Tiempo actual
     * @param {number} delta - Tiempo desde el último frame
     */
    update(time, delta) {
      // Implementado en subclases
    }
  
    /**
     * Muestra el componente
     */
    show() {
      if (this.visible) return;
      this.visible = true;
      this.elements.forEach(element => {
        if (element.setVisible) {
          element.setVisible(true);
        }
      });
    }
  
    /**
     * Oculta el componente
     */
    hide() {
      if (!this.visible) return;
      this.visible = false;
      this.elements.forEach(element => {
        if (element.setVisible) {
          element.setVisible(false);
        }
      });
    }
  
    /**
     * Destruye el componente
     */
    destroy() {
      this.elements.forEach(element => {
        if (element.destroy) {
          element.destroy();
        }
      });
      this.elements.clear();
    }
  
    /**
     * Crea un botón interactivo
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {string} text - Texto del botón
     * @param {Function} callback - Callback al pulsar
     * @param {Object} options - Opciones de personalización
     * @returns {Object} Botón creado
     */
    createButton(x, y, text, callback, options = {}) {
      const {
        width = 100,
        height = 30,
        fontSize = 14,
        backgroundColor = 0x444444,
        backgroundColorHover = 0x666666,
        textColor = '#ffffff',
        textColorHover = '#ffffff',
        id = `button_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      } = options;
      
      // Fondo del botón
      const button = this.scene.add.rectangle(x, y, width, height, backgroundColor);
      button.setInteractive();
      
      // Texto del botón
      const buttonText = this.scene.add.text(x, y, text, {
        font: `${fontSize}px Arial`,
        fill: textColor
      });
      buttonText.setOrigin(0.5);
      
      // Eventos
      button.on('pointerover', () => {
        button.setFillStyle(backgroundColorHover);
        buttonText.setStyle({ fill: textColorHover });
      });
      
      button.on('pointerout', () => {
        button.setFillStyle(backgroundColor);
        buttonText.setStyle({ fill: textColor });
      });
      
      button.on('pointerdown', () => {
        if (callback) callback();
      });
      
      // Añadir al mapa de elementos
      this.elements.set(`${id}_bg`, button);
      this.elements.set(`${id}_text`, buttonText);
      
      return { button, text: buttonText, id };
    }
  
    /**
     * Crea un panel con fondo
     * @param {number} x - Posición X (centro)
     * @param {number} y - Posición Y (centro)
     * @param {number} width - Ancho
     * @param {number} height - Alto
     * @param {Object} options - Opciones de personalización
     * @returns {Phaser.GameObjects.Rectangle} Panel creado
     */
    createPanel(x, y, width, height, options = {}) {
      const {
        backgroundColor = 0x000000,
        backgroundAlpha = 0.7,
        borderColor = 0xaaaaaa,
        borderWidth = 1,
        id = `panel_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      } = options;
      
      // Fondo
      const panel = this.scene.add.rectangle(
        x, y, width, height, 
        backgroundColor, backgroundAlpha
      );
      
      // Borde si es necesario
      if (borderWidth > 0) {
        panel.setStrokeStyle(borderWidth, borderColor);
      }
      
      // Añadir al mapa de elementos
      this.elements.set(id, panel);
      
      return panel;
    }
  
    /**
     * Crea texto dentro del componente
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {string} text - Texto a mostrar
     * @param {Object} options - Opciones de personalización
     * @returns {Phaser.GameObjects.Text} Texto creado
     */
    createText(x, y, text, options = {}) {
      const {
        fontSize = 14,
        fontFamily = 'Arial',
        color = '#ffffff',
        align = 'left',
        origin = { x: 0, y: 0 },
        id = `text_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      } = options;
      
      const textObject = this.scene.add.text(x, y, text, {
        font: `${fontSize}px ${fontFamily}`,
        fill: color,
        align
      });
      
      textObject.setOrigin(origin.x, origin.y);
      
      // Añadir al mapa de elementos
      this.elements.set(id, textObject);
      
      return textObject;
    }
  
    /**
     * Muestra una notificación temporal
     * @param {string} message - Mensaje a mostrar
     * @param {Object} options - Opciones de personalización
     */
    showToast(message, options = {}) {
      const {
        duration = 2000,
        fontSize = 16,
        backgroundColor = 0x000000,
        backgroundAlpha = 0.8,
        color = '#ffffff',
        x = this.scene.cameras.main.width / 2,
        y = this.scene.cameras.main.height - 50
      } = options;
      
      // Crear texto
      const toast = this.scene.add.text(x, y, message, {
        font: `${fontSize}px Arial`,
        fill: color,
        backgroundColor: `rgba(0,0,0,${backgroundAlpha})`,
        padding: { x: 10, y: 5 }
      });
      toast.setOrigin(0.5);
      toast.setDepth(110);
      toast.alpha = 0;
      
      // Animación de entrada
      this.scene.tweens.add({
        targets: toast,
        y: y - 30,
        alpha: 1,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          // Mantener visible
          this.scene.time.delayedCall(duration, () => {
            // Animación de salida
            this.scene.tweens.add({
              targets: toast,
              y: y,
              alpha: 0,
              duration: 300,
              ease: 'Power2',
              onComplete: () => {
                toast.destroy();
              }
            });
          });
        }
      });
    }
  }