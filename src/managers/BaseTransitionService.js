// src/services/BaseTransitionService.js

/**
 * Servicio para manejar transiciones entre escenas
 */
export default class BaseTransitionService {
    /**
     * Inicializa el servicio de transición
     * @param {Phaser.Scene} scene - Escena principal
     */
    constructor(scene) {
      this.scene = scene;
      this.transitioning = false;
    }
  
    /**
     * Verifica si hay una transición en curso
     * @returns {boolean} Estado de transición
     */
    isTransitioning() {
      return this.transitioning;
    }
  
    /**
     * Realiza una transición a otra escena
     * @param {string} targetScene - Clave de la escena destino
     * @param {Object} data - Datos a pasar a la escena
     * @param {Object} options - Opciones de transición
     */
    transitionToScene(targetScene, data = {}, options = {}) {
      if (this.transitioning) return;
      
      const { 
        duration = 500, 
        color = 0x000000, 
        delay = 0 
      } = options;
      
      this.transitioning = true;
      
      // Transición con fundido
      this.scene.cameras.main.fade(duration, color, color, color, false, (camera, progress) => {
        // Cuando el fundido es completo
        if (progress === 1) {
          this.scene.time.delayedCall(delay, () => {
            this.scene.scene.start(targetScene, data);
            this.transitioning = false;
          });
        }
      });
    }
  
    /**
     * Crea una animación de desvanecimiento de elementos
     * @param {Array} elements - Elementos gráficos a desvanecer
     * @param {Function} onComplete - Callback al completar
     * @param {Object} options - Opciones de animación
     */
    fadeOutElements(elements, onComplete, options = {}) {
      const { duration = 300 } = options;
      
      this.scene.tweens.add({
        targets: elements,
        alpha: 0,
        duration: duration,
        onComplete: () => {
          // Destruir elementos
          elements.forEach(element => {
            if (element) element.destroy();
          });
          
          if (onComplete) onComplete();
        }
      });
    }
  }