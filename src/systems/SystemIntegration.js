// src/systems/SystemIntegration.js
import { globalRegistry } from '../managers/SystemRegistry';

/**
 * Módulo para manejar la integración entre sistemas
 * Proporciona funciones de utilidad para conectar diferentes sistemas y resolver
 * potenciales referencias circulares
 */
export default class SystemIntegration {
  /**
   * Conecta todos los sistemas registrados
   * @param {Phaser.Scene} scene - Escena principal
   */
  static connectAllSystems(scene) {
    // Obtener todos los sistemas registrados
    const systems = globalRegistry.getAll();
    
    // Asignar referencias cruzadas
    this.connectPathWithEntities(scene);
    this.connectCombatWithEffects(scene);
    this.connectTilesWithPath(scene);
    this.connectTimeWithTiles(scene);
    
    // Notificar conexión completa
    scene.events.emit('systems-connected');
    console.log('Todos los sistemas han sido conectados');
  }

  /**
   * Conecta el sistema de camino con el sistema de entidades
   * @param {Phaser.Scene} scene - Escena principal
   */
  static connectPathWithEntities(scene) {
    const pathSystem = globalRegistry.get('path');
    const entitySystem = globalRegistry.get('entity');
    
    if (!pathSystem || !entitySystem) {
      console.warn('No se pudo conectar pathSystem con entitySystem: Alguno no está registrado');
      return;
    }
    
    // Vincular referencias
    pathSystem.entitySystem = entitySystem;
    entitySystem.pathSystem = pathSystem;
    
    // Configurar eventos de comunicación
    scene.events.on('path-node-reached', (nodeIndex) => {
      // Notificar a las entidades que se ha alcanzado un nodo
      const playerPosition = { 
        x: entitySystem.player?.x, 
        y: entitySystem.player?.y 
      };
      
      // Aplicar efectos de tiles al jugador cuando pasa sobre ellos
      const tileSystem = globalRegistry.get('tile');
      if (tileSystem && entitySystem.player) {
        tileSystem.checkEntityTileInteraction(entitySystem.player, playerPosition.x, playerPosition.y);
      }
      
      // Emitir evento de posición actualizada
      scene.events.emit('entity-moved', entitySystem.player, playerPosition.x, playerPosition.y);
    });
  }

  /**
   * Conecta el sistema de combate con el sistema de efectos visuales
   * @param {Phaser.Scene} scene - Escena principal
   */
  static connectCombatWithEffects(scene) {
    const combatSystem = globalRegistry.get('combat');
    const effectsSystem = globalRegistry.get('effects');
    
    if (!combatSystem || !effectsSystem) {
      console.warn('No se pudo conectar combatSystem con effectsSystem: Alguno no está registrado');
      return;
    }
    
    // Vincular referencias
    combatSystem.combatEffectsSystem = effectsSystem;
    
    // Eventos de comunicación
    scene.events.on('combat-started', (attacker, defender) => {
      // Notificar para efectos visuales
      if (attacker.type === 'player') {
        effectsSystem.createAttackEffect(attacker, defender, { color: 0x00ff00 });
      } else {
        effectsSystem.createAttackEffect(attacker, defender, { color: 0xff0000 });
      }
    });
    
    scene.events.on('entity-died', (entity, killer) => {
      // Crear efecto de muerte
      effectsSystem.createDeathEffect(entity);
    });
  }
  
  /**
   * Conecta el sistema de tiles con el sistema de camino
   * @param {Phaser.Scene} scene - Escena principal
   */
  static connectTilesWithPath(scene) {
    const tileSystem = globalRegistry.get('tile');
    const pathSystem = globalRegistry.get('path');
    
    if (!tileSystem || !pathSystem) {
      console.warn('No se pudo conectar tileSystem con pathSystem: Alguno no está registrado');
      return;
    }
    
    // Vincular referencias
    tileSystem.pathSystem = pathSystem;
    
    // Eventos de comunicación
    scene.events.on('tile-placed', (tile) => {
      // Comprobar si está cerca del camino
      const isNearPath = tileSystem.isAdjacentToPath(tile.gridX, tile.gridY);
      
      // Aplicar efecto si es relevante
      if (isNearPath && tile.effects.onPlace) {
        tile.effects.onPlace(tile);
      }
    });
  }
  
  /**
   * Conecta el sistema de tiempo con el sistema de tiles
   * @param {Phaser.Scene} scene - Escena principal
   */
  static connectTimeWithTiles(scene) {
    const timeSystem = globalRegistry.get('time');
    const tileSystem = globalRegistry.get('tile');
    
    if (!timeSystem || !tileSystem) {
      console.warn('No se pudo conectar timeSystem con tileSystem: Alguno no está registrado');
      return;
    }
    
    // Eventos de comunicación
    scene.events.on('day-started', () => {
      tileSystem.onDayChange(true);
    });
    
    scene.events.on('night-started', () => {
      tileSystem.onDayChange(false);
    });
  }
  
  /**
   * Establece las referencias iniciales para un sistema
   * @param {string} systemName - Nombre del sistema
   * @param {Object} system - Instancia del sistema
   */
  static setupInitialReferences(systemName, system) {
    switch (systemName) {
      case 'entity':
        system.combatSystem = globalRegistry.get('combat');
        system.pathSystem = globalRegistry.get('path');
        system.combatEffectsSystem = globalRegistry.get('effects');
        break;
        
      case 'combat':
        system.entitySystem = globalRegistry.get('entity');
        system.combatEffectsSystem = globalRegistry.get('effects');
        break;
        
      case 'path':
        system.entitySystem = globalRegistry.get('entity');
        break;
        
      case 'tile':
        system.pathSystem = globalRegistry.get('path');
        break;
    }
  }
}