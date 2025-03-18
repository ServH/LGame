// src/scenes/UIScene.js
import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    
    // Referencias a elementos UI
    this.playerStats = {
      health: null,
      level: null,
      experience: null,
      gold: null
    };
    
    // Referencias a elementos de la interfaz
    this.speedControls = null;
    this.tileControls = null;
    this.eventContainer = null;
    
    // Estado del UI
    this.currentSpeed = 1;
    this.selectedTileType = null;
  }

  create() {
    // Obtener dimensiones de la pantalla
    const { width, height } = this.cameras.main;
    
    // Crear panel de stats del jugador
    this.createPlayerStatsPanel(10, 10, 200, 120);
    
    // Crear controles de velocidad
    this.createSpeedControls(width - 200, 10, 190, 50);
    
    // Crear panel de tiles
    this.createTilePanel(10, height - 110, 300, 100);
    
    // Crear contenedor para eventos
    this.createEventContainer(width / 2, height / 2, 400, 300);
    
    // Registrar eventos
    this.registerEvents();
    
    console.log('UIScene iniciada');
  }

  /**
   * Registra eventos para comunicación con otras escenas
   */
  registerEvents() {
    // Cuando se crea el jugador
    this.game.events.on('player-created', (player) => {
      this.updatePlayerStats(player.stats);
    });
    
    // Cuando cambian las stats del jugador
    this.game.events.on('player-stats-changed', (stats) => {
      this.updatePlayerStats(stats);
    });
    
    // Cuando sube de nivel
    this.game.events.on('player-leveled-up', (level) => {
      this.showLevelUpMessage(level);
    });
    
    // Cuando gana oro
    this.game.events.on('player-gained-gold', (amount, total) => {
      this.updateGold(total);
    });
    
    // Cuando gana experiencia
    this.game.events.on('player-gained-experience', (amount, total) => {
      this.updateExperience(total);
    });
    
    // Cuando cambia la velocidad del juego
    this.game.events.on('game-speed-changed', (speed) => {
      this.updateSpeedControls(speed);
    });
    
    // Cuando se pausa el juego
    this.game.events.on('game-paused', () => {
      this.showPauseMessage();
    });
    
    // Cuando se reanuda el juego
    this.game.events.on('game-resumed', () => {
      this.hidePauseMessage();
    });
    
    // Cuando se activa el modo de colocación de tiles
    this.game.events.on('tile-placement-mode-activated', (tileType) => {
      this.updateTileControls(tileType);
    });
    
    // Cuando se desactiva el modo de colocación de tiles
    this.game.events.on('tile-placement-mode-deactivated', () => {
      this.updateTileControls(null);
    });
    
    // Cuando se coloca un tile
    this.game.events.on('tile-placed', (tile) => {
      this.showTilePlacedMessage(tile);
    });
    
    // Cuando ocurre un evento
    this.game.events.on('event-triggered', (eventConfig) => {
      this.showEvent(eventConfig);
    });
    
    // Cuando muere el jugador
    this.game.events.on('player-died', () => {
      this.showGameOverMessage();
    });
    
    // Cuando se completa un loop
    this.game.events.on('loop-completed', (data) => {
      this.showLoopCompletedMessage(data);
    });
  }

  /**
   * Crea el panel de estadísticas del jugador
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} width - Ancho
   * @param {number} height - Alto
   */
  createPlayerStatsPanel(x, y, width, height) {
    // Fondo del panel
    const panel = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0.7);
    panel.setOrigin(0.5);
    panel.setScrollFactor(0);
    
    // Borde
    const border = this.add.rectangle(x + width / 2, y + height / 2, width, height);
    border.setOrigin(0.5);
    border.setScrollFactor(0);
    border.setStrokeStyle(2, 0xaaaaaa);
    
    // Título
    const title = this.add.text(x + 10, y + 10, 'JUGADOR', {
      font: 'bold 16px Arial',
      fill: '#ffffff'
    });
    title.setScrollFactor(0);
    
    // Stats
    this.playerStats.health = this.add.text(x + 10, y + 35, 'Vida: 20/20', {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.playerStats.health.setScrollFactor(0);
    
    this.playerStats.level = this.add.text(x + 10, y + 55, 'Nivel: 1', {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.playerStats.level.setScrollFactor(0);
    
    this.playerStats.experience = this.add.text(x + 10, y + 75, 'Exp: 0/10', {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.playerStats.experience.setScrollFactor(0);
    
    this.playerStats.gold = this.add.text(x + 10, y + 95, 'Oro: 0', {
      font: '14px Arial',
      fill: '#ffff00'
    });
    this.playerStats.gold.setScrollFactor(0);
  }

  /**
   * Crea los controles de velocidad
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} width - Ancho
   * @param {number} height - Alto
   */
  createSpeedControls(x, y, width, height) {
    // Fondo del panel
    const panel = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0.7);
    panel.setOrigin(0.5);
    panel.setScrollFactor(0);
    
    // Borde
    const border = this.add.rectangle(x + width / 2, y + height / 2, width, height);
    border.setOrigin(0.5);
    border.setScrollFactor(0);
    border.setStrokeStyle(2, 0xaaaaaa);
    
    // Título
    const title = this.add.text(x + 10, y + 10, 'VELOCIDAD', {
      font: 'bold 14px Arial',
      fill: '#ffffff'
    });
    title.setScrollFactor(0);
    
    // Botones de velocidad
    this.speedControls = {
      buttons: {},
      currentSpeed: 1
    };
    
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
      
      // Botón
      const button = this.add.rectangle(
        buttonX + buttonWidth / 2,
        startY + buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        0x444444
      );
      button.setScrollFactor(0);
      button.setInteractive();
      
      // Texto
      const text = this.add.text(
        buttonX + buttonWidth / 2,
        startY + buttonHeight / 2,
        speed.label,
        {
          font: '12px Arial',
          fill: '#ffffff'
        }
      );
      text.setOrigin(0.5);
      text.setScrollFactor(0);
      
      // Eventos
      button.on('pointerover', () => {
        if (this.speedControls.currentSpeed !== speed.value) {
          button.setFillStyle(0x666666);
        }
      });
      
      button.on('pointerout', () => {
        if (this.speedControls.currentSpeed !== speed.value) {
          button.setFillStyle(0x444444);
        }
      });
      
      button.on('pointerdown', () => {
        // Cambiar velocidad en la escena principal
        this.scene.get('GameScene').setGameSpeed(speed.value);
      });
      
      // Guardar referencia
      this.speedControls.buttons[speed.key] = { button, text };
      
      // Marcar botón activo
      if (speed.value === 1) {
        button.setFillStyle(0x008800);
      }
    });
    
    // Atajos de teclado
    const speedText = this.add.text(x + 10, y + startY + buttonHeight + 5, '(teclas 1-3, ESPACIO)', {
      font: '10px Arial',
      fill: '#aaaaaa'
    });
    speedText.setScrollFactor(0);
  }

  /**
   * Crea el panel de selección de tiles
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} width - Ancho
   * @param {number} height - Alto
   */
  createTilePanel(x, y, width, height) {
    // Fondo del panel
    const panel = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0.7);
    panel.setOrigin(0.5);
    panel.setScrollFactor(0);
    
    // Borde
    const border = this.add.rectangle(x + width / 2, y + height / 2, width, height);
    border.setOrigin(0.5);
    border.setScrollFactor(0);
    border.setStrokeStyle(2, 0xaaaaaa);
    
    // Título
    const title = this.add.text(x + 10, y + 10, 'TILES (Presiona T)', {
      font: 'bold 14px Arial',
      fill: '#ffffff'
    });
    title.setScrollFactor(0);
    
    // Contenedor de tiles
    this.tileControls = {
      buttons: {},
      selectedType: null,
      isActive: false
    };
    
    const tileSize = 32;
    const tileSpacing = 10;
    const startX = x + 20;
    const startY = y + 40;
    
    const tiles = [
      { key: 'grass', color: 0x55aa55, label: 'Hierba (G)' },
      { key: 'rock', color: 0x888888, label: 'Roca (R)' },
      { key: 'thorn', color: 0xaa5555, label: 'Espinas (H)' },
      { key: 'lamp', color: 0xffff77, label: 'Lámpara (L)' }
    ];
    
    tiles.forEach((tileInfo, index) => {
      const tileX = startX + index * (tileSize + tileSpacing);
      
      // Tile
      const tile = this.add.rectangle(
        tileX + tileSize / 2,
        startY + tileSize / 2,
        tileSize - 4,
        tileSize - 4,
        tileInfo.color,
        0.4 // Semitransparente hasta que se active
      );
      tile.setScrollFactor(0);
      tile.setInteractive();
      
      // Borde
      const tileBorder = this.add.rectangle(
        tileX + tileSize / 2,
        startY + tileSize / 2,
        tileSize,
        tileSize
      );
      tileBorder.setScrollFactor(0);
      tileBorder.setStrokeStyle(1, 0x666666);
      
      // Etiqueta
      const label = this.add.text(
        tileX + tileSize / 2,
        startY + tileSize + 8,
        tileInfo.label,
        {
          font: '10px Arial',
          fill: '#cccccc'
        }
      );
      label.setOrigin(0.5, 0);
      label.setScrollFactor(0);
      
      // Eventos
      tile.on('pointerdown', () => {
        if (this.tileControls.isActive) {
          // Activar tile en la escena principal
          this.scene.get('GameScene').tileSystem.activatePlacementMode(tileInfo.key);
        } else {
          // Primero activar modo colocación
          this.scene.get('GameScene').toggleTilePlacementMode();
          
          // Luego seleccionar este tile
          setTimeout(() => {
            this.scene.get('GameScene').tileSystem.activatePlacementMode(tileInfo.key);
          }, 100);
        }
      });
      
      // Guardar referencia
      this.tileControls.buttons[tileInfo.key] = { tile, tileBorder, label };
    });
  }

  /**
   * Crea el contenedor para mostrar eventos
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} width - Ancho
   * @param {number} height - Alto
   */
  createEventContainer(x, y, width, height) {
    // Contenedor para eventos
    this.eventContainer = {
      panel: null,
      title: null,
      description: null,
      isVisible: false
    };
    
    // Elementos ocultos inicialmente
    this.eventContainer.panel = this.add.rectangle(x, y, width, height, 0x000000, 0.8);
    this.eventContainer.panel.setScrollFactor(0);
    this.eventContainer.panel.setDepth(100);
    this.eventContainer.panel.setVisible(false);
    
    this.eventContainer.title = this.add.text(x, y - height / 3, '', {
      font: 'bold 24px Arial',
      fill: '#ffffff'
    });
    this.eventContainer.title.setOrigin(0.5);
    this.eventContainer.title.setScrollFactor(0);
    this.eventContainer.title.setDepth(101);
    this.eventContainer.title.setVisible(false);
    
    this.eventContainer.description = this.add.text(x, y, '', {
      font: '16px Arial',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 40 }
    });
    this.eventContainer.description.setOrigin(0.5);
    this.eventContainer.description.setScrollFactor(0);
    this.eventContainer.description.setDepth(101);
    this.eventContainer.description.setVisible(false);
  }

  /**
   * Actualiza las estadísticas del jugador
   * @param {Object} stats - Estadísticas actualizadas
   */
  updatePlayerStats(stats) {
    if (stats.health !== undefined && stats.maxHealth !== undefined) {
      this.playerStats.health.setText(`Vida: ${Math.ceil(stats.health)}/${stats.maxHealth}`);
      
      // Cambiar color según salud
      const healthRatio = stats.health / stats.maxHealth;
      let color = '#ffffff';
      
      if (healthRatio < 0.3) color = '#ff0000';
      else if (healthRatio < 0.6) color = '#ffaa00';
      
      this.playerStats.health.setStyle({ fill: color });
    }
    
    if (stats.level !== undefined) {
      this.playerStats.level.setText(`Nivel: ${stats.level}`);
    }
    
    if (stats.experience !== undefined && stats.experienceToNextLevel !== undefined) {
      this.playerStats.experience.setText(`Exp: ${Math.floor(stats.experience)}/${stats.experienceToNextLevel}`);
    }
    
    if (stats.gold !== undefined) {
      this.playerStats.gold.setText(`Oro: ${stats.gold}`);
    }
  }

  /**
   * Actualiza la visualización de oro
   * @param {number} gold - Cantidad total de oro
   */
  updateGold(gold) {
    this.playerStats.gold.setText(`Oro: ${gold}`);
    
    // Efecto de parpadeo
    this.tweens.add({
      targets: this.playerStats.gold,
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      duration: 200
    });
  }

  /**
   * Actualiza la visualización de experiencia
   * @param {number} experience - Cantidad total de experiencia
   */
  updateExperience(experience) {
    // Se actualiza automáticamente en updatePlayerStats
    // Aquí podríamos añadir efectos visuales adicionales
  }

  /**
   * Actualiza los controles de velocidad
   * @param {number} speed - Nueva velocidad
   */
  updateSpeedControls(speed) {
    const oldSpeed = this.speedControls.currentSpeed;
    this.speedControls.currentSpeed = speed;
    
    // Resetear color del botón anterior
    const speedKeys = ['pause', 'normal', 'fast', 'superfast'];
    const oldSpeedKey = speedKeys[speedKeys.findIndex(k => 
      this.speedControls.buttons[k]?.value === oldSpeed
    ) || 1]; // Normal por defecto
    
    const newSpeedKey = speedKeys[speedKeys.findIndex(k => {
      if (k === 'pause' && speed === 0) return true;
      if (k === 'normal' && speed === 1) return true;
      if (k === 'fast' && speed === 2) return true;
      if (k === 'superfast' && speed === 4) return true;
      return false;
    }) || 1]; // Normal por defecto
    
    // Actualizar colores
    if (this.speedControls.buttons[oldSpeedKey]) {
      this.speedControls.buttons[oldSpeedKey].button.setFillStyle(0x444444);
    }
    
    if (this.speedControls.buttons[newSpeedKey]) {
      this.speedControls.buttons[newSpeedKey].button.setFillStyle(0x008800);
    }
  }

  /**
   * Muestra mensaje de pausa
   */
  showPauseMessage() {
    const { width, height } = this.cameras.main;
    
    // Texto de pausa
    if (!this.pauseText) {
      this.pauseText = this.add.text(width / 2, height / 2, 'PAUSA', {
        font: 'bold 32px Arial',
        fill: '#ffffff'
      });
      this.pauseText.setOrigin(0.5);
      this.pauseText.setScrollFactor(0);
      this.pauseText.setDepth(90);
      
      // Fondo semitransparente
      this.pauseOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3);
      this.pauseOverlay.setScrollFactor(0);
      this.pauseOverlay.setDepth(89);
    } else {
      this.pauseText.setVisible(true);
      this.pauseOverlay.setVisible(true);
    }
  }

  /**
   * Oculta mensaje de pausa
   */
  hidePauseMessage() {
    if (this.pauseText) {
      this.pauseText.setVisible(false);
      this.pauseOverlay.setVisible(false);
    }
  }

  /**
   * Actualiza los controles de selección de tiles
   * @param {string|null} tileType - Tipo de tile seleccionado o null
   */
  updateTileControls(tileType) {
    // Actualizar estado
    const wasActive = this.tileControls.isActive;
    this.tileControls.isActive = tileType !== null;
    this.tileControls.selectedType = tileType;
    
    // Resetear todos los tiles a semitransparentes
    Object.values(this.tileControls.buttons).forEach(({ tile, tileBorder }) => {
      tile.setAlpha(this.tileControls.isActive ? 0.8 : 0.4);
      tileBorder.setStrokeStyle(1, 0x666666);
    });
    
    // Resaltar el tile seleccionado
    if (tileType && this.tileControls.buttons[tileType]) {
      const { tile, tileBorder } = this.tileControls.buttons[tileType];
      tile.setAlpha(1);
      tileBorder.setStrokeStyle(2, 0xffffff);
    }
    
    // Mostrar mensaje si se activa/desactiva el modo
    if (wasActive !== this.tileControls.isActive) {
      const message = this.tileControls.isActive
        ? 'Modo de colocación de tiles activado'
        : 'Modo de colocación de tiles desactivado';
      
      this.showToast(message, 1500);
    }
  }

  /**
   * Muestra un mensaje cuando se coloca un tile
   * @param {Object} tile - Tile colocado
   */
  showTilePlacedMessage(tile) {
    // Obtener nombre del tile
    let tileName = 'desconocido';
    
    switch (tile.type) {
      case 'grass': tileName = 'Hierba'; break;
      case 'rock': tileName = 'Roca'; break;
      case 'thorn': tileName = 'Espinas'; break;
      case 'lamp': tileName = 'Lámpara'; break;
    }
    
    this.showToast(`Tile colocado: ${tileName}`, 1000);
  }

  /**
   * Muestra un mensaje de tostada
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  showToast(message, duration = 2000) {
    const { width, height } = this.cameras.main;
    
    // Crear texto
    const toast = this.add.text(width / 2, height - 50, message, {
      font: '14px Arial',
      fill: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    });
    toast.setOrigin(0.5);
    toast.setScrollFactor(0);
    toast.setDepth(110);
    
    // Animación de entrada
    this.tweens.add({
      targets: toast,
      y: height - 80,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
    
    // Eliminar después de la duración
    setTimeout(() => {
      this.tweens.add({
        targets: toast,
        y: height - 50,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          toast.destroy();
        }
      });
    }, duration);
  }

  /**
   * Muestra un evento
   * @param {Object} eventConfig - Configuración del evento
   */
  showEvent(eventConfig) {
    // Mostrar contenedor
    this.eventContainer.panel.setVisible(true);
    this.eventContainer.title.setVisible(true);
    this.eventContainer.description.setVisible(true);
    this.eventContainer.isVisible = true;
    
    // Actualizar textos
    this.eventContainer.title.setText(eventConfig.title);
    this.eventContainer.description.setText(eventConfig.description);
    
    // Animación de entrada
    this.tweens.add({
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
    setTimeout(() => {
      this.hideEvent();
    }, eventConfig.duration || 2000);
  }

  /**
   * Oculta el contenedor de eventos
   */
  hideEvent() {
    if (!this.eventContainer.isVisible) return;
    
    // Animación de salida
    this.tweens.add({
      targets: [
        this.eventContainer.panel,
        this.eventContainer.title,
        this.eventContainer.description
      ],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.eventContainer.panel.setVisible(false);
        this.eventContainer.title.setVisible(false);
        this.eventContainer.description.setVisible(false);
        this.eventContainer.isVisible = false;
      }
    });
  }

  /**
   * Muestra mensaje de game over
   */
  showGameOverMessage() {
    // Ya implementado en GameScene
  }

  /**
   * Muestra mensaje cuando se completa un loop
   * @param {Object} data - Datos del loop completado
   */
  showLoopCompletedMessage(data) {
    const { width, height } = this.cameras.main;
    
    // Fondo
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setScrollFactor(0);
    overlay.setDepth(95);
    
    // Título
    const title = this.add.text(width / 2, height / 2 - 100, '¡LOOP COMPLETADO!', {
      font: 'bold 36px Arial',
      fill: '#ffffff'
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(96);
    
    // Recompensas
    const rewardText = this.add.text(width / 2, height / 2, 'Recompensas:', {
      font: 'bold 24px Arial',
      fill: '#ffffff'
    });
    rewardText.setOrigin(0.5);
    rewardText.setScrollFactor(0);
    rewardText.setDepth(96);
    
    // Detalles de recompensas
    const reward = data.reward;
    const details = this.add.text(width / 2, height / 2 + 50, 
      `Oro: +${reward.gold}\nExperiencia: +${reward.experience}`, {
      font: '20px Arial',
      fill: '#ffff00',
      align: 'center'
    });
    details.setOrigin(0.5);
    details.setScrollFactor(0);
    details.setDepth(96);
    
    // Mensaje de transición
    const transitionText = this.add.text(width / 2, height / 2 + 150, 'Volviendo a la base...', {
      font: '16px Arial',
      fill: '#aaaaaa'
    });
    transitionText.setOrigin(0.5);
    transitionText.setScrollFactor(0);
    transitionText.setDepth(96);
    
    // Auto-destruir después de la transición
    setTimeout(() => {
      overlay.destroy();
      title.destroy();
      rewardText.destroy();
      details.destroy();
      transitionText.destroy();
    }, 2000);
  }

  /**
   * Muestra mensaje de subida de nivel
   * @param {number} level - Nuevo nivel
   */
  showLevelUpMessage(level) {
    const { width, height } = this.cameras.main;
    
    // Texto de nivel
    const levelText = this.add.text(width / 2, height / 2 - 50, `¡NIVEL ${level}!`, {
      font: 'bold 32px Arial',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6
    });
    levelText.setOrigin(0.5);
    levelText.setScrollFactor(0);
    levelText.setDepth(100);
    
    // Animación
    this.tweens.add({
      targets: levelText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.tweens.add({
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
  // Extensiones para UIScene.js - Añadir estas funciones

/**
 * Crea el panel de información de combate
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} width - Ancho
 * @param {number} height - Alto
 */
createCombatInfoPanel(x, y, width, height) {
  // Fondo del panel
  this.combatInfoPanel = {
    background: this.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      0x000000,
      0.7
    ),
    title: this.add.text(
      x + 10,
      y + 10,
      'COMBATE',
      {
        font: 'bold 14px Arial',
        fill: '#ffffff'
      }
    ),
    status: this.add.text(
      x + 10,
      y + 35,
      'No hay combate activo',
      {
        font: '12px Arial',
        fill: '#aaaaaa'
      }
    ),
    enemyInfo: this.add.text(
      x + 10,
      y + 55,
      '',
      {
        font: '12px Arial',
        fill: '#ffffff'
      }
    ),
    controls: []
  };
  
  // Botones de control
  const controlLabels = [
    { text: 'Auto', key: 'auto' },
    { text: 'Pausa', key: 'pause' },
    { text: 'Huir', key: 'flee' }
  ];
  
  // Crear botones de control
  controlLabels.forEach((control, index) => {
    const buttonX = x + 20 + index * (width / 3);
    const buttonY = y + height - 25;
    
    // Fondo del botón
    const button = this.add.rectangle(
      buttonX,
      buttonY,
      width / 3 - 15,
      20,
      0x444444
    );
    button.setInteractive();
    
    // Texto del botón
    const text = this.add.text(
      buttonX,
      buttonY,
      control.text,
      {
        font: '10px Arial',
        fill: '#ffffff'
      }
    );
    text.setOrigin(0.5);
    
    // Eventos
    button.on('pointerover', () => {
      button.setFillStyle(0x666666);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x444444);
    });
    
    button.on('pointerdown', () => {
      this.handleCombatControl(control.key);
    });
    
    // Añadir al panel
    this.combatInfoPanel.controls.push({ button, text, key: control.key });
  });
  
  // Inicialmente invisible
  this.setCombatPanelVisible(false);
}

/**
 * Muestra u oculta el panel de combate
 * @param {boolean} visible - Si debe ser visible
 */
setCombatPanelVisible(visible) {
  if (!this.combatInfoPanel) return;
  
  this.combatInfoPanel.background.setVisible(visible);
  this.combatInfoPanel.title.setVisible(visible);
  this.combatInfoPanel.status.setVisible(visible);
  this.combatInfoPanel.enemyInfo.setVisible(visible);
  
  this.combatInfoPanel.controls.forEach(control => {
    control.button.setVisible(visible);
    control.text.setVisible(visible);
  });
}

/**
 * Actualiza la información de combate
 * @param {Object} combatInfo - Información del combate actual
 */
updateCombatInfo(combatInfo) {
  if (!this.combatInfoPanel) return;
  
  // Si no hay combate activo
  if (!combatInfo) {
    this.combatInfoPanel.status.setText('No hay combate activo');
    this.combatInfoPanel.enemyInfo.setText('');
    return;
  }
  
  // Actualizar estado
  const { enemy, isAutoCombat } = combatInfo;
  
  this.combatInfoPanel.status.setText(`Estado: ${isAutoCombat ? 'Automático' : 'Manual'}`);
  
  // Información del enemigo
  if (enemy && enemy.isActive()) {
    let enemyInfo = `${enemy.enemyType || 'Enemigo'} Nv.${enemy.stats.level || 1}\n`;
    enemyInfo += `Vida: ${Math.ceil(enemy.stats.health)}/${enemy.stats.maxHealth}\n`;
    enemyInfo += `Atq: ${enemy.stats.attack.toFixed(1)} Def: ${enemy.stats.defense.toFixed(1)}`;
    
    this.combatInfoPanel.enemyInfo.setText(enemyInfo);
  } else {
    this.combatInfoPanel.enemyInfo.setText('');
  }
  
  // Actualizar botones según estado
  this.combatInfoPanel.controls.forEach(control => {
    if (control.key === 'auto') {
      control.text.setStyle({ 
        fill: isAutoCombat ? '#ffff00' : '#ffffff' 
      });
    }
  });
}

/**
 * Maneja los controles de combate
 * @param {string} controlKey - Clave del control activado
 */
handleCombatControl(controlKey) {
  // Obtener referencia a la escena principal
  const gameScene = this.scene.get('GameScene');
  
  switch (controlKey) {
    case 'auto':
      // Alternar modo automático
      gameScene.combatSystem.toggleAutoCombat();
      break;
    case 'pause':
      // Pausar combate
      gameScene.combatSystem.pauseCombat();
      break;
    case 'flee':
      // Intentar huir del combate
      gameScene.combatSystem.attemptFlee();
      break;
  }
}

/**
 * Muestra una notificación de combate
 * @param {string} text - Texto de la notificación
 * @param {Object} options - Opciones de la notificación
 */
showCombatNotification(text, options = {}) {
  const {
    duration = 2000,
    color = '#ffffff',
    fontSize = 14,
    x = this.cameras.main.width / 2,
    y = this.cameras.main.height / 2
  } = options;
  
  // Crear texto
  const notification = this.add.text(x, y, text, {
    font: `${fontSize}px Arial`,
    fill: color,
    stroke: '#000000',
    strokeThickness: 3
  });
  notification.setOrigin(0.5);
  notification.setDepth(200);
  
  // Animar aparición
  notification.setAlpha(0);
  this.tweens.add({
    targets: notification,
    alpha: 1,
    y: y - 20,
    duration: 300,
    onComplete: () => {
      // Mantener visible
      this.time.delayedCall(duration, () => {
        // Animar desaparición
        this.tweens.add({
          targets: notification,
          alpha: 0,
          y: y - 40,
          duration: 300,
          onComplete: () => {
            notification.destroy();
          }
        });
      });
    }
  });
}

// Extensiones para CombatSystem.js - Mejoras de control

/**
 * Pausa el combate actual
 */
pauseCombat() {
  // Guardar estado de auto combate para restaurar al reanudar
  this._autoCombatState = this.autoCombat;
  this.autoCombat = false;
  
  // Notificar
  this.scene.events.emit('combat-paused');
  
  // Mostrar mensaje
  if (this.scene.events) {
    this.scene.events.emit('show-combat-notification', 'Combate en pausa', {
      color: '#ffff00'
    });
  }
}

/**
 * Reanuda el combate
 */
resumeCombat() {
  // Restaurar estado de auto combate
  this.autoCombat = this._autoCombatState || false;
  
  // Notificar
  this.scene.events.emit('combat-resumed');
  
  // Mostrar mensaje
  if (this.scene.events) {
    this.scene.events.emit('show-combat-notification', 'Combate reanudado', {
      color: '#00ff00'
    });
  }
}

/**
 * Alterna el modo de combate automático
 */
toggleAutoCombat() {
  this.autoCombat = !this.autoCombat;
  
  // Notificar
  this.scene.events.emit('combat-auto-toggled', this.autoCombat);
  
  // Mostrar mensaje
  if (this.scene.events) {
    this.scene.events.emit('show-combat-notification', 
      `Modo ${this.autoCombat ? 'automático' : 'manual'} activado`, {
      color: this.autoCombat ? '#00ff00' : '#ffff00'
    });
  }
}

/**
 * Intenta huir del combate actual
 * @returns {boolean} - Si tuvo éxito la huida
 */
attemptFlee() {
  // Verificar si hay combate activo
  if (!this.activeCombats.size) return false;
  
  // Obtener el primer combate activo (para simplicidad)
  const combatId = this.activeCombats.keys().next().value;
  const combat = this.activeCombats.get(combatId);
  
  if (!combat) return false;
  
  // Probabilidad base de huida
  let fleeChance = 0.6; // 60% base
  
  // Modificadores
  if (combat.attacker.type === 'player') {
    // La velocidad del jugador influye
    fleeChance += (combat.attacker.stats.speed - combat.defender.stats.speed) * 0.1;
    
    // Penalización si el enemigo es un jefe
    if (combat.defender.isBoss) {
      fleeChance *= 0.5;
    }
  }
  
  // Limitar entre 0.1 (10%) y 0.9 (90%)
  fleeChance = Math.max(0.1, Math.min(0.9, fleeChance));
  
  // Intentar huir
  const success = Math.random() < fleeChance;
  
  if (success) {
    // Huida exitosa
    this.endCombat(combatId, null, null);
    
    // Notificar éxito
    if (this.scene.events) {
      this.scene.events.emit('show-combat-notification', '¡Huida exitosa!', {
        color: '#00ff00'
      });
    }
    
    // Evento de huida
    this.scene.events.emit('combat-fled', true);
  } else {
    // Falló la huida
    if (this.scene.events) {
      this.scene.events.emit('show-combat-notification', 'No puedes huir', {
        color: '#ff0000'
      });
    }
    
    // Evento de huida fallida
    this.scene.events.emit('combat-fled', false);
    
    // Penalización: el enemigo ataca inmediatamente
    if (combat.defender.isActive() && combat.attacker.type === 'player') {
      this.scene.time.delayedCall(200, () => {
        combat.defender.attack(combat.attacker);
      });
    }
  }
  
  return success;
}

// Inicialización del sistema de combate mejorado (añadir al constructor)
/* 
  // Estado del combate automático
  this.autoCombat = true;
  
  // Conexión con la UI
  this.setupCombatUI();
*/

/**
 * Configura la conexión con la interfaz de usuario
 */
setupCombatUI() {
  // Eventos para la UI
  this.scene.events.on('show-combat-notification', (text, options) => {
    // Reenviar a la escena UI
    this.scene.scene.get('UIScene').showCombatNotification(text, options);
  });
  
  // Actualizar UI cuando cambia el estado de combate
  this.scene.events.on('combat-started', (attacker, defender) => {
    // Mostrar panel de combate
    const ui = this.scene.scene.get('UIScene');
    if (ui.setCombatPanelVisible) {
      ui.setCombatPanelVisible(true);
      
      // Actualizar información
      if (ui.updateCombatInfo) {
        ui.updateCombatInfo({
          enemy: attacker.type === 'player' ? defender : attacker,
          isAutoCombat: this.autoCombat
        });
      }
    }
    
    // Mostrar notificación
    const enemyName = (attacker.type === 'player' ? defender : attacker).enemyType || 'Enemigo';
    this.scene.events.emit('show-combat-notification', 
      `¡Combate iniciado!\n${enemyName}`, {
      color: '#ff0000',
      duration: 1500
    });
  });
  
  // Actualizar cuando finaliza el combate
  this.scene.events.on('entity-died', (entity) => {
    if (entity.type === 'enemy' && this.activeCombats.size === 0) {
      // Ocultar panel si no quedan combates activos
      const ui = this.scene.scene.get('UIScene');
      if (ui.setCombatPanelVisible) {
        ui.setCombatPanelVisible(false);
      }
    }
  });
  
  // Actualizar cuando cambia el modo automático
  this.scene.events.on('combat-auto-toggled', (isAuto) => {
    const ui = this.scene.scene.get('UIScene');
    if (ui.updateCombatInfo && this.activeCombats.size > 0) {
      // Obtener el primer combate activo
      const combatId = this.activeCombats.keys().next().value;
      const combat = this.activeCombats.get(combatId);
      
      ui.updateCombatInfo({
        enemy: combat.attacker.type === 'player' ? combat.defender : combat.attacker,
        isAutoCombat: isAuto
      });
    }
  });
}

// Modificaciones a la función de actualización para manejar combate automático
/*
update(delta) {
  // Actualizar líneas de combate (código existente)
  
  // Gestionar combate automático
  if (this.autoCombat) {
    this.updateAutoCombat(delta);
  }
}
*/

/**
 * Actualiza la lógica de combate automático
 * @param {number} delta - Tiempo transcurrido
 */
updateAutoCombat(delta) {
  // Procesar cada combate activo
  this.activeCombats.forEach((combat) => {
    const { attacker, defender } = combat;
    
    // Solo manejar combates donde el jugador es atacante
    if (attacker.type === 'player' && attacker.isActive() && defender.isActive()) {
      // Verificar si puede atacar
      if (attacker.actionCooldown <= 0) {
        // Atacar automáticamente
        attacker.attack(defender);
      }
    }
  });
}
}