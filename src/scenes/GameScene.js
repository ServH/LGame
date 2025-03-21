// src/scenes/GameScene.js - Mejora de integración con BaseScene
import Phaser from 'phaser';
import GameManager from '../managers/GameManager';
import EventManager from '../managers/EventManager';
import InputManager from '../managers/InputManager';
import { globalRegistry } from '../managers/SystemRegistry';
import SystemIntegration from '../systems/SystemIntegration';

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
    this.baseUpgrades = data.baseUpgrades || null;
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
    
    // Asegurar que los sistemas estén correctamente conectados
    SystemIntegration.connectAllSystems(this);
    
    // Inicializar gestor de entrada
    this.inputManager = new InputManager(this, this.gameManager);
    this.inputManager.initialize();
    
    // Configurar cámara
    this.cameras.main.setBackgroundColor('#111111');
    
    // Crear path inicial
    this.createInitialPath();
    
    // Crear jugador
    this.createPlayer();
    
    // Aplicar mejoras de la base si existen
    if (this.baseUpgrades) {
      this.applyBaseUpgrades();
    }
    
    // Generar enemigos en el path
    this.entitySystem.spawnEnemiesOnPath(
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
    const keys = this.registry.getAll();
    Object.keys(keys).forEach((key) => {
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
    // Ajustar valores iniciales para evitar problemas de movimiento
    this.pathSystem.movementSpeed = 80; // Incrementado para mejor respuesta
    this.pathSystem.nodeReachedDistance = 15; // Aumentado para evitar saltos
    
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
    
    // Log para depuración
    console.log('Sistemas inicializados con valores: ' +
                `pathSpeed=${this.pathSystem.movementSpeed}, ` +
                `nodeDistance=${this.pathSystem.nodeReachedDistance}`);
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
    
    console.log(`Camino generado con ${path.length} nodos`);
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
    
    console.log(`Jugador creado en posición (${startPoint.x}, ${startPoint.y})`);
    return this.player;
  }
  
  /**
   * Aplica las mejoras de la base al juego
   */
  applyBaseUpgrades() {
    if (!this.baseUpgrades || !this.player) return;
    
    // Aplicar bonificaciones según las mejoras de la base
    if (this.baseUpgrades.campfire) {
      // Mejora de campfire - aumenta regeneración de vida
      const healRate = this.baseUpgrades.campfire * 0.002;
      
      // Crear un evento que cura al jugador periódicamente
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (this.player && this.player.isActive()) {
            const healing = healRate * this.player.stats.maxHealth;
            this.player.heal(healing);
            // Log de depuración ocasional
            if (Math.random() < 0.05) {
              console.log(`Curación pasiva: ${healing.toFixed(2)} (${healRate * 100}% de ${this.player.stats.maxHealth})`);
            }
          }
        },
        loop: true
      });
    }
    
    if (this.baseUpgrades.forge) {
      // Mejora de forge - aumenta daño del jugador
      const attackBonus = this.baseUpgrades.forge * 0.05;
      this.player.statsManager.stats.attack *= (1 + attackBonus);
      console.log(`Bonificación de ataque aplicada: +${(attackBonus * 100).toFixed(0)}%`);
    }
    
    if (this.baseUpgrades.library) {
      // Mejora de biblioteca - aumenta experiencia ganada
      const expBonus = this.baseUpgrades.library * 0.1;
      
      // Interceptar el evento de experiencia ganada
      this.events.on('player-gained-experience', (amount) => {
        const bonus = Math.floor(amount * expBonus);
        if (bonus > 0) {
          this.player.addExperience(bonus);
          this.events.emit('show-combat-notification', 
            `+${bonus} EXP (bonus)`, {
              color: '#ffff00',
              fontSize: 12,
              x: this.player.x + 20,
              y: this.player.y - 20
          });
        }
      });
      
      console.log(`Bonificación de experiencia aplicada: +${(expBonus * 100).toFixed(0)}%`);
    }
  }

  /**
   * Establece la velocidad del juego
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setGameSpeed(multiplier) {
    console.log(`GameScene: Solicitud de cambio de velocidad a ${multiplier}x`);
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
      if (this.player.equipment && typeof this.player.equipment.addItem === 'function') {
        this.player.equipment.addItem(item);
      } else {
        // Fallback si no existe el sistema de equipamiento
        this.player.inventory = this.player.inventory || [];
        this.player.inventory.push(item);
      }
      
      // Notificar a la UI
      this.events.emit('player-item-obtained', item);
    });
    
    // Evento de nodo alcanzado para eventos aleatorios
    this.events.on('path-node-reached', (nodeIndex) => {
      // Probabilidad de evento aleatorio (5%)
      if (Math.random() < 0.05) {
        this.eventManager.createRandomEvent(nodeIndex);
      }
      
      // Log ocasional para depuración
      if (Math.random() < 0.1) {
        console.log(`Nodo ${nodeIndex} alcanzado, velocidad actual: ${this.gameManager.speedMultiplier}x`);
      }
    });
  }

/**
 * Actualiza el estado del juego
 * @param {number} time - Tiempo actual
 * @param {number} delta - Tiempo transcurrido desde el último frame
 */
update(time, delta) {
  // SOLUCIÓN DE EMERGENCIA: Siempre usar un delta fijo
  const FIXED_DELTA = 16.66; // 60fps constante
  
  // Actualizar gestor del juego con delta fijo
  this.gameManager.update(time, FIXED_DELTA);
  
  // Actualizar registro global con delta fijo
  globalRegistry.updateAll(time, FIXED_DELTA);
  
  // Verificar rendimiento cada pocos segundos
  if (Math.floor(time/1000) % 5 === 0 && Math.floor(time) % 1000 < 20) {
    const fps = 1000 / delta;
    if (fps < 30) {
      console.warn(`Rendimiento bajo: ${fps.toFixed(1)} FPS - Usando delta fijo: ${FIXED_DELTA}ms`);
    }
  }
}
}