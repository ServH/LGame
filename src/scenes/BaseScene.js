// src/scenes/BaseScene.js
import Phaser from 'phaser';
import BaseManager from '../managers/BaseManager';
import BasePersistenceService from '../managers/BasePersistenceService';
import BaseUIManager from '../ui/BaseUIManager';
import BaseStructureManager from '../managers/BaseStructureManager';
import BaseTransitionService from '../managers/BaseTransitionService';

export default class BaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BaseScene' });
  }

  /**
   * Recibe datos de la escena anterior
   */
  init(data) {
    // Inicializar servicios
    this.persistenceService = new BasePersistenceService();
    this.transitionService = new BaseTransitionService(this);
    
    // Cargar datos del jugador o usar datos por defecto
    this.playerData = data.player || {
      health: 20,
      maxHealth: 20,
      attack: 3,
      defense: 1,
      speed: 1.2,
      level: 1,
      experience: 0,
      experienceToNextLevel: 10,
      gold: 0
    };
    
    // Datos de recompensa de la expedición
    this.rewardData = data.reward || null;
    
    // Cargar mejoras guardadas
    this.baseUpgrades = this.persistenceService.loadBaseUpgrades();
  }

  create() {
    // Configurar cámara y fondo
    this.cameras.main.setBackgroundColor('#111111');
    
    // Inicializar gestores
    this.baseManager = new BaseManager(this, this.baseUpgrades, this.playerData);
    this.structureManager = new BaseStructureManager(this, this.baseManager);
    this.uiManager = new BaseUIManager(this, this.baseManager);
    
    // Crear entorno visual
    this.createEnvironment();
    
    // Mostrar mensaje inicial
    if (this.rewardData) {
      this.uiManager.showWelcomeMessage(this.rewardData);
      this.baseManager.applyRewards(this.rewardData);
    } else {
      this.uiManager.showWelcomeMessage();
    }
    
    // Configurar controles
    this.setupControls();
    
    console.log('BaseScene iniciada');
  }

  /**
   * Crea el entorno visual de la base
   */
  createEnvironment() {
    // Crear fondo
    this.uiManager.createBackground();
    
    // Crear estructuras
    this.structureManager.createStructures();
    
    // Crear UI
    this.uiManager.createUI(this.playerData);
  }

  /**
   * Configura los controles de la escena
   */
  setupControls() {
    // Tecla de escape para cancelar menús
    this.input.keyboard.on('keydown-ESC', () => {
      this.uiManager.closeActiveMenus();
    });
    
    // Tecla Enter para iniciar expedición
    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.uiManager.hasActiveMenus() && !this.transitionService.isTransitioning()) {
        this.startNewExpedition();
      }
    });
  }

  /**
   * Inicia una nueva expedición
   */
  startNewExpedition() {
    if (this.transitionService.isTransitioning()) return;
      
    try {
      // Guardar mejoras antes de salir
      this.persistenceService.saveBaseUpgrades(this.baseManager.getUpgrades());
      
      // Recopilar datos correctamente
      const data = { 
        playerData: this.baseManager.getPlayerData(),
        baseUpgrades: this.baseManager.getUpgrades()
      };
      
      console.log("Transición a GameScene con datos:", data);
      
      // Iniciar transición a escena de juego
      this.transitionService.transitionToScene('GameScene', data);
    } catch (e) {
      console.error("Error al iniciar expedición:", e);
    }
  }
}