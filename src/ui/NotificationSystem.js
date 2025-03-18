// src/ui/NotificationSystem.js
import UIComponent from './UIComponent';

/**
 * Sistema de notificaciones y eventos emergentes
 */
export default class NotificationSystem extends UIComponent {
  /**
   * Inicializa el sistema de notificaciones
   * @param {Phaser.Scene} scene - Escena de Phaser
   */
  constructor(scene) {
    super(scene);
    
    this.eventContainer = null;
    this.create();
  }

  /**
   * Crea el contenedor de eventos
   */
  create() {
    const { width, height } = this.scene.cameras.main;
    
    // Contenedor para eventos
    this.eventContainer = {
      panel: this.scene.add.rectangle(width / 2, height / 2, 400, 300, 0x000000, 0.8),
      title: this.scene.add.text(width / 2, height / 2 - 100, '', {
        font: 'bold 24px Arial',
        fill: '#ffffff'
      }),
      description: this.scene.add.text(width / 2, height / 2, '', {
        font: '16px Arial',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 360 }
      })
    };
    
    // Configurar propiedades
    this.eventContainer.panel.setScrollFactor(0);
    this.eventContainer.panel.setDepth(100);
    this.eventContainer.title.setOrigin(0.5);
    this.eventContainer.title.setScrollFactor(0);
    this.eventContainer.title.setDepth(101);
    this.eventContainer.description.setOrigin(0.5);
    this.eventContainer.description.setScrollFactor(0);
    this.eventContainer.description.setDepth(101);
    
    // Añadir al mapa de elementos
    this.elements.set('event_panel', this.eventContainer.panel);
    this.elements.set('event_title', this.eventContainer.title);
    this.elements.set('event_description', this.eventContainer.description);
    
    // Inicialmente oculto
    this.hide();
  }

  /**
   * Muestra un evento
   * @param {Object} eventConfig - Configuración del evento
   */
  showEvent(eventConfig) {
    // Mostrar contenedor
    this.show();
    
    // Actualizar textos
    this.eventContainer.title.setText(eventConfig.title);
    this.eventContainer.description.setText(eventConfig.description);
    
    // Animación de entrada
    this.scene.tweens.add({
      targets: [
        this.eventContainer.panel,
        this.eventContainer.title,
        this.eventContainer.description
      ],
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
    
    // Auto-ocultar después de la duración
    this.scene.time.delayedCall(eventConfig.duration || 2000, () => {
      this.hideEvent();
    });
  }

  /**
   * Oculta el contenedor de eventos
   */
  hideEvent() {
    // Animación de salida
    this.scene.tweens.add({
      targets: [
        this.eventContainer.panel,
        this.eventContainer.title,
        this.eventContainer.description
      ],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.hide();
      }
    });
  }

  /**
   * Muestra notificación de subida de nivel
   * @param {number} level - Nuevo nivel
   */
  showLevelUpMessage(level) {
    const { width, height } = this.scene.cameras.main;
    
    // Texto de nivel
    const levelText = this.scene.add.text(width / 2, height / 2 - 50, `¡NIVEL ${level}!`, {
      font: 'bold 32px Arial',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6
    });
    levelText.setOrigin(0.5);
    levelText.setScrollFactor(0);
    levelText.setDepth(100);
    
    // Animación
    this.scene.tweens.add({
      targets: levelText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.scene.tweens.add({
          targets: levelText,
          y: height / 2 - 100,
          alpha: 0,
          duration: 1000,
          delay: 500,
          onComplete: () => {
            levelText.destroy();
          }
        });
      }
    });
  }

  /**
   * Muestra mensaje al completar un loop
   * @param {Object} data - Datos del loop completado
   */
  showLoopCompletedMessage(data) {
    const { width, height } = this.scene.cameras.main;
    
    // Fondo
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setScrollFactor(0);
    overlay.setDepth(95);
    
    // Título
    const title = this.scene.add.text(width / 2, height / 2 - 100, '¡LOOP COMPLETADO!', {
      font: 'bold 36px Arial',
      fill: '#ffffff'
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(96);
    
    // Recompensas
    const rewardText = this.scene.add.text(width / 2, height / 2, 'Recompensas:', {
      font: 'bold 24px Arial',
      fill: '#ffffff'
    });
    rewardText.setOrigin(0.5);
    rewardText.setScrollFactor(0);
    rewardText.setDepth(96);
    
    // Detalles de recompensas
    const reward = data.reward;
    const details = this.scene.add.text(width / 2, height / 2 + 50, 
      `Oro: +${reward.gold}\nExperiencia: +${reward.experience}`, {
      font: '20px Arial',
      fill: '#ffff00',
      align: 'center'
    });
    details.setOrigin(0.5);
    details.setScrollFactor(0);
    details.setDepth(96);
    
    // Mensaje de transición
    const transitionText = this.scene.add.text(width / 2, height / 2 + 150, 'Volviendo a la base...', {
      font: '16px Arial',
      fill: '#aaaaaa'
    });
    transitionText.setOrigin(0.5);
    transitionText.setScrollFactor(0);
    transitionText.setDepth(96);
    
    // Auto-destruir después de la transición
    this.scene.time.delayedCall(2000, () => {
      overlay.destroy();
      title.destroy();
      rewardText.destroy();
      details.destroy();
      transitionText.destroy();
    });
  }

  /**
   * Muestra notificación temporal
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones de personalización
   */
  showNotification(message, options = {}) {
    this.showToast(message, options);
  }

  /**
   * Muestra mensaje de pausa
   */
  showPauseMessage() {
    const { width, height } = this.scene.cameras.main;
    
    // Texto de pausa
    if (!this.elements.has('pause_text')) {
      const pauseText = this.scene.add.text(width / 2, height / 2, 'PAUSA', {
        font: 'bold 32px Arial',
        fill: '#ffffff'
      });
      pauseText.setOrigin(0.5);
      pauseText.setScrollFactor(0);
      pauseText.setDepth(90);
      
      // Fondo semitransparente
      const pauseOverlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3);
      pauseOverlay.setScrollFactor(0);
      pauseOverlay.setDepth(89);
      
      this.elements.set('pause_text', pauseText);
      this.elements.set('pause_overlay', pauseOverlay);
    } else {
      this.elements.get('pause_text').setVisible(true);
      this.elements.get('pause_overlay').setVisible(true);
    }
  }

  /**
   * Oculta mensaje de pausa
   */
  hidePauseMessage() {
    if (this.elements.has('pause_text')) {
      this.elements.get('pause_text').setVisible(false);
      this.elements.get('pause_overlay').setVisible(false);
    }
  }

  /**
   * Muestra mensaje de Game Over
   */
  showGameOverMessage() {
    const { width, height } = this.scene.cameras.main;
    
    // Overlay de game over
    const gameOverOverlay = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0
    );
    
    // Texto de game over
    const gameOverText = this.scene.add.text(
      width / 2,
      height / 2 - 50,
      'GAME OVER',
      {
        font: 'bold 48px Arial',
        fill: '#ff0000'
      }
    );
    gameOverText.setOrigin(0.5);
    
    // Texto de reinicio
    const restartText = this.scene.add.text(
      width / 2,
      height / 2 + 50,
      'Presiona R para reiniciar',
      {
        font: '24px Arial',
        fill: '#ffffff'
      }
    );
    restartText.setOrigin(0.5);
    
    // Animación de overlay
    this.scene.tweens.add({
      targets: gameOverOverlay,
      alpha: 0.7,
      duration: 1000
    });
    
    // Guardar referencia
    this.elements.set('game_over_overlay', gameOverOverlay);
    this.elements.set('game_over_text', gameOverText);
    this.elements.set('restart_text', restartText);
  }
}