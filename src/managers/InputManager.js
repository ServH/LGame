// src/managers/InputManager.js

/**
 * Gestor de entrada de usuario
 * Maneja teclas, controles y acciones
 */
export default class InputManager {
    /**
     * Inicializa el gestor de entrada
     * @param {Phaser.Scene} scene - Escena principal
     * @param {GameManager} gameManager - Gestor del juego
     */
    constructor(scene, gameManager) {
      this.scene = scene;
      this.gameManager = gameManager;
      this.keys = {};
      this.callbacks = {};
    }
    
    /**
     * Inicializa los controles
     */
    initialize() {
      // Teclas para controlar la velocidad del juego
      this.keys.speed = {
        pause: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        normal: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        fast: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        superfast: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
      };
      
      // Teclas para el modo de colocación de tiles
      this.keys.tile = {
        activateMode: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T),
        grass: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
        rock: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
        thorn: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
        lamp: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
        cancel: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      };
      
      // Teclas especiales
      this.keys.special = {
        restart: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
      };
      
      // Configurar eventos de teclas
      this.setupKeyEvents();
    }
    
    /**
     * Configura eventos para las teclas
     */
    setupKeyEvents() {
      // Tecla de reinicio (para Game Over)
      this.scene.input.keyboard.on('keydown-R', () => {
        if (this.gameManager.gameState === 'defeat') {
          this.gameManager.restartGame();
        }
      });
      
      // Procesar todas las teclas
      this.scene.input.keyboard.on('keydown', (event) => {
        // Controles de velocidad
        if (event.keyCode === this.keys.speed.pause.keyCode) {
          this.gameManager.togglePause();
        } else if (event.keyCode === this.keys.speed.normal.keyCode) {
          this.gameManager.setGameSpeed(1);
        } else if (event.keyCode === this.keys.speed.fast.keyCode) {
          this.gameManager.setGameSpeed(2);
        } else if (event.keyCode === this.keys.speed.superfast.keyCode) {
          this.gameManager.setGameSpeed(4);
        }
        
        // Teclas de sistema de tiles
        const tileSystem = this.gameManager.getSystem('tile');
        if (tileSystem) {
          if (event.keyCode === this.keys.tile.activateMode.keyCode) {
            this.toggleTilePlacementMode(tileSystem);
          } else if (tileSystem.tilePlacementMode) {
            if (event.keyCode === this.keys.tile.grass.keyCode) {
              tileSystem.activatePlacementMode('grass');
            } else if (event.keyCode === this.keys.tile.rock.keyCode) {
              tileSystem.activatePlacementMode('rock');
            } else if (event.keyCode === this.keys.tile.thorn.keyCode) {
              tileSystem.activatePlacementMode('thorn');
            } else if (event.keyCode === this.keys.tile.lamp.keyCode) {
              tileSystem.activatePlacementMode('lamp');
            } else if (event.keyCode === this.keys.tile.cancel.keyCode) {
              tileSystem.deactivatePlacementMode();
            }
          }
        }
        
        // Otros callbacks personalizados
        Object.values(this.callbacks).forEach(callback => {
          if (callback.keyCode === event.keyCode) {
            callback.action();
          }
        });
      });
    }
    
    /**
     * Alterna el modo de colocación de tiles
     * @param {TileSystem} tileSystem - Sistema de tiles
     */
    toggleTilePlacementMode(tileSystem) {
      if (tileSystem.tilePlacementMode) {
        tileSystem.deactivatePlacementMode();
      } else {
        // Por defecto, seleccionar el primer tipo de tile
        tileSystem.activatePlacementMode('grass');
      }
    }
    
    /**
     * Registra un callback para una tecla
     * @param {string} name - Nombre del callback
     * @param {number} keyCode - Código de la tecla
     * @param {Function} action - Función a ejecutar
     */
    registerKeyCallback(name, keyCode, action) {
      this.callbacks[name] = { keyCode, action };
    }
    
    /**
     * Elimina un callback
     * @param {string} name - Nombre del callback
     */
    removeKeyCallback(name) {
      delete this.callbacks[name];
    }
    
    /**
     * Comprueba si una tecla está pulsada
     * @param {string} category - Categoría de tecla (speed, tile, special)
     * @param {string} key - Nombre de la tecla
     * @returns {boolean} Si está pulsada
     */
    isKeyDown(category, key) {
      if (!this.keys[category] || !this.keys[category][key]) return false;
      return this.keys[category][key].isDown;
    }
    
    /**
     * Deshabilita todos los controles
     */
    disableAllControls() {
      Object.values(this.keys).forEach(category => {
        Object.values(category).forEach(key => {
          key.enabled = false;
        });
      });
    }
    
    /**
     * Habilita todos los controles
     */
    enableAllControls() {
      Object.values(this.keys).forEach(category => {
        Object.values(category).forEach(key => {
          key.enabled = true;
        });
      });
    }
  }