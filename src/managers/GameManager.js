// src/managers/GameManager.js
import { globalRegistry } from './SystemRegistry';

/**
 * Gestor principal del juego que coordina los sistemas y el estado global
 */
export default class GameManager {
  /**
   * Inicializa el gestor del juego
   * @param {Phaser.Scene} scene - Escena principal del juego
   */
  constructor(scene) {
    this.scene = scene;
    this.systems = new Map();
    this.gameState = 'initializing'; // initializing, playing, paused, defeat, victory
    this.speedMultiplier = 1;
    this.isPaused = false;
    this.loopCount = 0;
    this.stats = {
      loops: 0,
      kills: 0,
      tilesPlaced: 0,
      totalGold: 0,
      totalExperience: 0
    };
    
    // Registrar eventos
    this.registerEvents();
    
    console.log("GameManager inicializado con speedMultiplier:", this.speedMultiplier);
  }

  /**
   * Registra eventos globales
   */
  registerEvents() {
    // Escuchar eventos importantes
    this.scene.events.on('entity-died', this.handleEntityDied, this);
    this.scene.events.on('tile-placed', this.handleTilePlaced, this);
    this.scene.events.on('combat-rewards-granted', this.handleRewards, this);
  }

  /**
   * Inicializa el juego con datos del jugador
   * @param {Object} playerData - Datos iniciales del jugador
   */
  initializeGame(playerData) {
    // Configurar estado inicial
    this.gameState = 'playing';
    
    // Inicializar el registro global con los datos
    globalRegistry.initializeAll({ playerData });
    
    // Sincronizar referencias entre sistemas
    globalRegistry.syncSystemReferences();
    
    // Emitir evento de inicio
    this.scene.events.emit('game-initialized', playerData);
    
    console.log("Juego inicializado con playerData:", playerData);
  }

  /**
   * Registra un sistema en el gestor
   * @param {string} name - Nombre único del sistema
   * @param {Object} system - Instancia del sistema
   */
  registerSystem(name, system) {
    this.systems.set(name, system);
    globalRegistry.register(name, system);
    console.log(`Sistema '${name}' registrado`);
  }

  /**
   * Obtiene un sistema por su nombre
   * @param {string} name - Nombre del sistema
   * @returns {Object|null} Sistema solicitado o null si no existe
   */
  getSystem(name) {
    return this.systems.get(name) || null;
  }

  /**
   * Actualiza el estado del juego
   * @param {number} time - Tiempo actual
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(time, delta) {
    // Si el juego está pausado, no actualizar
    if (this.gameState === 'paused') return;
    
    // Log para tiempo muy grande (posible pérdida de frames)
    if (delta > 500) {
      console.warn(`Delta time anormalmente alto: ${delta}ms. Posible pérdida de frames.`);
    }
    
    // Actualizar todos los sistemas que tengan método update
    this.systems.forEach((system, name) => {
      if (system.update) {
        // Pasar el delta ajustado por el multiplicador de velocidad
        const adjustedDelta = delta * this.speedMultiplier;
        
        // Log ocasional para verificar deltas por sistema
        if (Math.random() < 0.002) {
          console.log(`Update ${name}: delta=${delta}, adjustedDelta=${adjustedDelta}, speedMultiplier=${this.speedMultiplier}`);
        }
        
        system.update(time, adjustedDelta);
      }
    });
  }

  /**
   * Alterna el estado de pausa del juego
   */
  togglePause() {
    if (this.gameState === 'playing') {
      this.setPaused(true);
    } else if (this.gameState === 'paused') {
      this.setPaused(false);
    }
  }

  /**
   * Establece el estado de pausa
   * @param {boolean} paused - Si el juego debe estar pausado
   */
  setPaused(paused) {
    this.isPaused = paused;
    this.gameState = paused ? 'paused' : 'playing';
    console.log(`Juego ${paused ? 'pausado' : 'reanudado'}`);
    
    // Propagarlo a todos los sistemas
    this.systems.forEach(system => {
      if (system.setPaused) {
        system.setPaused(paused);
      }
    });
    
    // Propagar a través del registro global
    globalRegistry.setPaused(paused);
    
    // Emitir evento
    if (paused) {
      this.scene.events.emit('game-paused');
    } else {
      this.scene.events.emit('game-resumed');
    }
  }

  /**
   * Establece la velocidad del juego
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setGameSpeed(multiplier) {
    // Asegurarse de que sea un valor válido
    multiplier = Math.max(0, multiplier);
    console.log(`GameManager: Cambiando velocidad del juego a ${multiplier}x`);
    
    // Si es 0, pausar el juego
    if (multiplier === 0) {
      this.setPaused(true);
      return;
    } else if (this.isPaused) {
      // Si estaba pausado, reanudar
      this.setPaused(false);
    }
    
    this.speedMultiplier = multiplier;
    
    // Propagar a los sistemas
    this.systems.forEach((system, name) => {
      if (system.setSpeedMultiplier) {
        console.log(`Aplicando multiplicador ${multiplier}x a sistema: ${name}`);
        system.setSpeedMultiplier(multiplier);
      }
    });
    
    // Propagar a través del registro global
    globalRegistry.setSpeedMultiplier(multiplier);
    
    // Emitir evento
    this.scene.events.emit('game-speed-changed', multiplier);
  }

  /**
   * Gestiona la derrota del jugador
   */
  handlePlayerDefeat() {
    if (this.gameState === 'defeat') return;
    
    this.gameState = 'defeat';
    this.setPaused(true);
    
    // Emitir evento
    this.scene.events.emit('player-died');
    console.log("El jugador ha sido derrotado");
  }

  /**
   * Gestiona la finalización de un loop
   */
  handleLoopCompletion() {
    // Incrementar contadores
    this.loopCount++;
    this.stats.loops++;
    
    console.log(`Loop #${this.loopCount} completado`);
    
    // Calcular recompensas por completar el loop
    const player = this.getSystem('entity')?.player;
    
    if (player) {
      // Base de recompensas para el loop
      const baseGold = 10 + (player.stats.level * 5);
      const baseExperience = 5 + (player.stats.level * 3);
      
      // Bonificaciones según el nivel del jugador y el número de loops
      const goldMultiplier = 1 + (this.loopCount * 0.1);
      const expMultiplier = 1 + (this.loopCount * 0.05);
      
      const gold = Math.floor(baseGold * goldMultiplier);
      const experience = Math.floor(baseExperience * expMultiplier);
      
      // Actualizar estadísticas globales
      this.stats.totalGold += gold;
      this.stats.totalExperience += experience;
      
      // Calcular recompensas totales
      const reward = {
        gold,
        experience,
        items: []
      };
      
      console.log(`Recompensas de loop: ${gold} oro, ${experience} exp`);
      
      // Emitir evento con recompensas
      this.scene.events.emit('loop-completed', { 
        loopNumber: this.loopCount,
        reward
      });
      
      // Transición a la base con los datos obtenidos
      this.scene.time.delayedCall(2000, () => {
        this.transitionToBase({
          player: player.statsManager ? player.statsManager.stats : player.stats,
          reward
        });
      });
    }
  }

  /**
   * Transiciona a la escena de base
   * @param {Object} data - Datos a pasar a la escena de base
   */
  transitionToBase(data) {
    // Transición con fundido a negro
    console.log("Iniciando transición a BaseScene con datos:", data);
    
    this.scene.cameras.main.fade(1000, 0, 0, 0, false, (camera, progress) => {
      if (progress === 1) {
        // Iniciar escena de base con datos recopilados
        this.scene.scene.start('BaseScene', data);
      }
    });
  }

  /**
   * Reinicia el juego tras una derrota
   */
  restartGame() {
    if (this.gameState !== 'defeat') return;
    
    console.log("Reiniciando juego...");
    
    // Reiniciar todos los sistemas
    this.systems.forEach(system => {
      if (system.reset) {
        system.reset();
      }
    });
    
    // Reiniciar a través del registro global
    globalRegistry.resetAll();
    
    // Reiniciar escena
    this.scene.scene.restart();
  }

  /**
   * Maneja la muerte de una entidad
   * @param {Entity} entity - Entidad que murió
   * @param {Entity} killer - Entidad que causó la muerte
   */
  handleEntityDied(entity, killer) {
    // Si muere el jugador, game over
    if (entity && entity.type === 'player') {
      this.handlePlayerDefeat();
      return;
    }
    
    // Incrementar contador de kills si el jugador mata a un enemigo
    if (entity && entity.type === 'enemy' && killer && killer.type === 'player') {
      this.stats.kills++;
      console.log(`Enemigo eliminado: ${entity.enemyType || 'desconocido'}, total kills: ${this.stats.kills}`);
    }
  }

  /**
   * Maneja la colocación de un tile
   * @param {Object} tile - Tile colocado
   */
  handleTilePlaced(tile) {
    this.stats.tilesPlaced++;
    console.log(`Tile colocado: ${tile.type}, total tiles: ${this.stats.tilesPlaced}`);
  }

  /**
   * Maneja las recompensas obtenidas
   * @param {Object} rewardInfo - Información de recompensas
   */
  handleRewards(rewardInfo) {
    if (rewardInfo.rewards) {
      this.stats.totalGold += rewardInfo.rewards.gold || 0;
      this.stats.totalExperience += rewardInfo.rewards.experience || 0;
      console.log(`Recompensas obtenidas: ${rewardInfo.rewards.gold || 0} oro, ${rewardInfo.rewards.experience || 0} exp`);
    }
  }

  /**
   * Dispara un evento en el juego
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventConfig - Configuración del evento
   */
  triggerEvent(eventType, eventConfig) {
    console.log(`Evento disparado: ${eventType}`, eventConfig);
    
    // Aplicar efectos del evento
    if (eventConfig.effect) {
      eventConfig.effect();
    }
    
    // Emitir evento
    this.scene.events.emit('event-triggered', eventConfig);
  }
}