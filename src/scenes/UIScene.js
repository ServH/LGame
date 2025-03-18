// src/scenes/UIScene.js
import Phaser from 'phaser';
import PlayerStatsPanel from '../ui/components/PlayerStatsPanel';
import SpeedControlPanel from '../ui/components/SpeedControlPanel';
import CombatPanel from '../ui/components/CombatPanel';
import TileControlPanel from '../ui/components/TileControlPanel';
import NotificationSystem from '../ui/NotificationSystem';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Inicializar componentes de interfaz
    this.initializeComponents();
    
    // Registrar eventos
    this.registerEvents();
    
    console.log('UIScene iniciada');
  }

  /**
   * Inicializa todos los componentes de la UI
   */
  initializeComponents() {
    const { width, height } = this.cameras.main;
    
    // Panel de estadísticas del jugador
    this.playerStatsPanel = new PlayerStatsPanel(this);
    
    // Panel de control de velocidad
    this.speedControlPanel = new SpeedControlPanel(this, {
      x: width - 200,
      y: 10
    });
    
    // Panel de combate
    this.combatPanel = new CombatPanel(this, {
      x: width - 210,
      y: 70
    });
    
    // Panel de control de tiles
    this.tileControlPanel = new TileControlPanel(this, {
      x: 10,
      y: height - 110
    });
    
    // Sistema de notificaciones
    this.notificationSystem = new NotificationSystem(this);
    
    // Configurar callbacks
    this.setupCallbacks();
  }

  /**
   * Configura los callbacks entre componentes
   */
  setupCallbacks() {
    // Callback de cambio de velocidad
    this.speedControlPanel.setSpeedChangeCallback((speed) => {
      this.game.scene.getScene('GameScene').setGameSpeed(speed);
    });
    
    // Callbacks de controles de combate
    this.combatPanel.setControlCallbacks({
      auto: () => {
        this.game.scene.getScene('GameScene').combatSystem.toggleAutoCombat();
      },
      pause: () => {
        this.game.scene.getScene('GameScene').combatSystem.pauseCombat();
      },
      flee: () => {
        this.game.scene.getScene('GameScene').combatSystem.attemptFlee();
      }
    });
    
    // Callback de selección de tiles
    this.tileControlPanel.setTileSelectCallback((action, tileType) => {
      const gameScene = this.game.scene.getScene('GameScene');
      
      if (action === 'activate') {
        gameScene.toggleTilePlacementMode();
      } else if (action === 'select' && tileType) {
        gameScene.tileSystem.activatePlacementMode(tileType);
      }
    });
  }

  /**
   * Registra eventos para comunicación con otras escenas
   */
  registerEvents() {
    // Eventos relacionados con el jugador
    this.game.events.on('player-created', this.onPlayerCreated, this);
    this.game.events.on('player-stats-changed', this.onPlayerStatsChanged, this);
    this.game.events.on('player-leveled-up', this.onPlayerLeveledUp, this);
    this.game.events.on('player-gained-gold', this.onPlayerGainedGold, this);
    this.game.events.on('player-gained-experience', this.onPlayerGainedExperience, this);
    
    // Eventos relacionados con el combate
    this.game.events.on('combat-started', this.onCombatStarted, this);
    this.game.events.on('combat-auto-toggled', this.onCombatAutoToggled, this);
    this.game.events.on('show-combat-notification', this.onShowCombatNotification, this);
    
    // Eventos relacionados con la velocidad del juego
    this.game.events.on('game-speed-changed', this.onGameSpeedChanged, this);
    this.game.events.on('game-paused', this.onGamePaused, this);
    this.game.events.on('game-resumed', this.onGameResumed, this);
    
    // Eventos relacionados con tiles
    this.game.events.on('tile-placement-mode-activated', this.onTilePlacementModeActivated, this);
    this.game.events.on('tile-placement-mode-deactivated', this.onTilePlacementModeDeactivated, this);
    this.game.events.on('tile-placed', this.onTilePlaced, this);
    
    // Eventos del juego
    this.game.events.on('event-triggered', this.onEventTriggered, this);
    this.game.events.on('player-died', this.onPlayerDied, this);
    this.game.events.on('loop-completed', this.onLoopCompleted, this);
  }

  /**
   * Manejadores de eventos
   */
  
  // Eventos del jugador
  onPlayerCreated(player) {
    this.playerStatsPanel.updateStats(player.stats);
  }
  
  onPlayerStatsChanged(stats) {
    this.playerStatsPanel.updateStats(stats);
  }
  
  onPlayerLeveledUp(level) {
    this.notificationSystem.showLevelUpMessage(level);
  }
  
  onPlayerGainedGold(amount, total) {
    this.playerStatsPanel.updateGold(total);
  }
  
  onPlayerGainedExperience(amount, total) {
    this.playerStatsPanel.updateStats({
      experience: total
    });
  }
  
  // Eventos de combate
  onCombatStarted(attacker, defender) {
    // Mostrar panel de combate
    this.combatPanel.show();
    
    // Obtener el enemigo
    const enemy = attacker.type === 'player' ? defender : attacker;
    
    // Actualizar información
    this.combatPanel.updateCombatInfo({
      enemy,
      isAutoCombat: this.game.scene.getScene('GameScene').combatSystem.autoCombat
    });
    
    // Mostrar notificación
    const enemyName = enemy.enemyType || 'Enemigo';
    this.combatPanel.showCombatNotification(
      `¡Combate iniciado!\n${enemyName}`, {
      color: '#ff0000',
      duration: 1500
    });
  }
  
  onCombatAutoToggled(isAuto) {
    // Actualizar panel de combate
    const gameScene = this.game.scene.getScene('GameScene');
    
    if (gameScene.combatSystem.activeCombats.size > 0) {
      // Obtener el primer combate
      const combatId = Array.from(gameScene.combatSystem.activeCombats.keys())[0];
      const combat = gameScene.combatSystem.activeCombats.get(combatId);
      
      if (combat) {
        this.combatPanel.updateCombatInfo({
          enemy: combat.attacker.type === 'player' ? combat.defender : combat.attacker,
          isAutoCombat: isAuto
        });
      }
    }
  }
  
  onShowCombatNotification(text, options) {
    this.combatPanel.showCombatNotification(text, options);
  }
  
  // Eventos de velocidad
  onGameSpeedChanged(speed) {
    this.speedControlPanel.updateSpeed(speed);
  }
  
  onGamePaused() {
    this.notificationSystem.showPauseMessage();
  }
  
  onGameResumed() {
    this.notificationSystem.hidePauseMessage();
  }
  
  // Eventos de tiles
  onTilePlacementModeActivated(tileType) {
    this.tileControlPanel.updateState(true, tileType);
  }
  
  onTilePlacementModeDeactivated() {
    this.tileControlPanel.updateState(false, null);
  }
  
  onTilePlaced(tile) {
    this.tileControlPanel.showTilePlacedMessage(tile);
  }
  
  // Eventos del juego
  onEventTriggered(eventConfig) {
    this.notificationSystem.showEvent(eventConfig);
  }
  
  onPlayerDied() {
    this.notificationSystem.showGameOverMessage();
  }
  
  onLoopCompleted(data) {
    this.notificationSystem.showLoopCompletedMessage(data);
  }
  
  /**
   * Muestra un mensaje de tostada general
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones de personalización
   */
  showToast(message, options = {}) {
    this.notificationSystem.showNotification(message, options);
  }
}