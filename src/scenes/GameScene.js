// src/scenes/GameScene.js
import Phaser from 'phaser';
import GameManager from '../managers/GameManager';
import EventManager from '../managers/EventManager';
import InputManager from '../managers/InputManager';
import { globalRegistry } from '../managers/SystemRegistry';

// Sistemas
import PathSystem from '../systems/PathSystem';
import EntitySystem from '../systems/EntitySystem';
import TimeSystem from '../systems/TimeSystem';
import TileSystem from '../systems/TileSystem';
import CombatSystem from '../systems/CombatSystem';
import CombatEffectsSystem from '../systems/CombatEffectsSystem';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Recibe datos de la escena anterior
   * @param {Object} data - Datos recibidos
   */
  init(data) {
    this.playerData = data.playerData || null;
  }

  create() {
    // Iniciar la UI
    this.scene.launch('UIScene');
    
    // Inicializar gestor del juego
    this.gameManager = new GameManager(this);
    
    // Inicializar registro de sistemas
    this.setupRegistry();
    
    // Inicializar sistemas
    this.initSystems();
    
    // Inicializar gestor de entrada
    this.inputManager = new InputManager(this, this.gameManager);
    this.inputManager.initialize();
    
    // Configurar cámara
    this.cameras.main.setBackgroundColor('#111111');
    
    // Crear path inicial
    this.createInitialPath();
    
    // Crear jugador
    this.createPlayer();
    
    // Generar enemigos en el path
    this.entitySystem.populatePath(
      this.pathSystem.path,
      120,
      (point, index, path) => {
        const progress = index / path.length;
        return Math.random() < (0.15 + progress * 0.3);
      }
    );
    
    // Iniciar el ciclo día/noche
    this.timeSystem.setDayDuration(60000); // 1 minuto = 1 día completo
    
    // Registrar eventos de sistema
    this.setupEvents();
    
    // Iniciar el loop automático
    this.pathSystem.startLoop(this.player);
    this.events.emit('loop-started');
    
    // Iniciar gestor de eventos
    this.eventManager = new EventManager(this, this.gameManager);
    
    // Inicializar datos del juego
    this.gameManager.initializeGame(this.playerData);
    
    console.log('GameScene iniciada');
  }

  /**
   * Configura el registro global de sistemas
   */
  setupRegistry() {
    // Limpiar registro en caso de reinicio
    this.registry.forEach((value, key) => {
      this.registry.remove(key);
    });
    
    // Registrar gestor del juego para acceso global
    this.registry.set('gameManager', this.gameManager);
  }

  /**
   * Inicializa todos los sistemas del juego
   */
  initSystems() {
    // Sistema de camino
    this.pathSystem = new PathSystem(this);
    this.gameManager.registerSystem('path', this.pathSystem);
    globalRegistry.register('path', this.pathSystem);
    
    // Sistema de tiempo (día/noche)
    this.timeSystem = new TimeSystem(this);
    this.timeSystem.createTimeIndicator(700, 30, 120);
    this.gameManager.registerSystem('time', this.timeSystem);
    globalRegistry.register('time', this.timeSystem);
    
    // Sistema de efectos de combate
    this.combatEffectsSystem = new CombatEffectsSystem(this);
    this.gameManager.registerSystem('effects', this.combatEffectsSystem);
    globalRegistry.register('effects', this.combatEffectsSystem);
    
    // Sistema de combate
    this.combatSystem = new CombatSystem(this);
    this.gameManager.registerSystem('combat', this.combatSystem);
    globalRegistry.register('combat', this.combatSystem);
    
    // Sistema de entidades
    this.entitySystem = new EntitySystem(this);
    this.gameManager.registerSystem('entity', this.entitySystem);
    globalRegistry.register('entity', this.entitySystem);
    
    // Sistema de tiles
    this.tileSystem = new TileSystem(this);
    this.gameManager.registerSystem('tile', this.tileSystem);
    globalRegistry.register('tile', this.tileSystem);
    
    // Sincronizar referencias entre sistemas
    globalRegistry.syncSystemReferences();
  }

  /**
   * Crea el camino inicial
   */
  createInitialPath() {
    // Generar un camino rectangular
    const path = this.pathSystem.generateRectangularPath(
      400, // centro X
      300, // centro Y
      500, // ancho
      400, // alto
      40   // número de nodos
    );
    
    return path;
  }

  /**
   * Crea al jugador
   */
  createPlayer() {
    // Posición inicial (primer punto del camino)
    const startPoint = this.pathSystem.path[0];
    
    // Estadísticas del jugador (desde la escena anterior o predeterminadas)
    const stats = this.playerData || {
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
    
    // Crear jugador
    this.player = this.entitySystem.createPlayer(
      startPoint.x,
      startPoint.y,
      stats
    );
    
    // Comunicar al UI que el jugador se ha creado
    this.events.emit('player-created', this.player);
    
    return this.player;
  }

  /**
   * Establece la velocidad del juego
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setGameSpeed(multiplier) {
    this.gameManager.setGameSpeed(multiplier);
  }

  /**
   * Alterna el modo de colocación de tiles
   */
  toggleTilePlacementMode() {
    if (this.tileSystem.tilePlacementMode) {
      this.tileSystem.deactivatePlacementMode();
    } else {
      // Por defecto, seleccionar el primer tipo de tile
      this.tileSystem.activatePlacementMode('grass');
    }
  }

  /**
   * Registra eventos de sistema
   */
  setupEvents() {
    // Escuchar evento de loop completado
    this.events.on('loop-completed', () => {
      this.gameManager.handleLoopCompletion();
    });
    
    // Eventos de items y equipamiento
    this.events.on('item-dropped', (item, x, y) => {
      // Efecto visual
      if (this.combatEffectsSystem) {
        this.combatEffectsSystem.createItemDropEffect(x, y, {
          rarity: item.rarity,
          duration: 1500
        });
      }
      
      // Añadir al inventario del jugador
      this.player.equipment.addItem(item);
      
      // Notificar a la UI
      this.events.emit('player-item-obtained', item);
    });
    
    // Evento de nodo alcanzado para eventos aleatorios
    this.events.on('path-node-reached', (nodeIndex) => {
      // Probabilidad de evento aleatorio (5%)
      if (Math.random() < 0.05) {
        this.eventManager.createRandomEvent(nodeIndex);
      }
    });
  }

  /**
   * Actualiza el estado del juego
   * @param {number} time - Tiempo actual
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(time, delta) {
    // Actualizar gestor del juego
    this.gameManager.update(time, delta);
    
    // Actualizar registro global
    globalRegistry.updateAll(time, delta);
  }
}