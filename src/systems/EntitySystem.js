// src/systems/EntitySystem.js
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';

export default class EntitySystem {
  constructor(scene) {
    this.scene = scene;
    this.entities = new Map();
    this.player = null;
    this.enemies = [];
    this.nextEntityId = 1;
    this.speedMultiplier = 1;
    this.isPaused = false;
  }

  /**
   * Crea el jugador en la escena
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {Object} stats - Estadísticas iniciales del jugador
   * @returns {Player} Instancia del jugador
   */
  createPlayer(x, y, stats = {}) {
    // Crear jugador
    this.player = new Player(this.scene, x, y, stats);
    
    // Añadir a la lista de entidades
    this.entities.set('player', this.player);
    
    console.log(`EntitySystem: Jugador creado en (${x}, ${y}) con estadísticas:`, 
                `salud=${stats.health || 'default'}`, 
                `ataque=${stats.attack || 'default'}`);
    
    return this.player;
  }

  /**
   * Crea un enemigo en la escena
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {string} type - Tipo de enemigo
   * @param {Object} stats - Estadísticas del enemigo
   * @returns {Enemy} Instancia del enemigo
   */
  createEnemy(x, y, type, stats = {}) {
    const enemyId = `enemy_${this.nextEntityId++}`;
    const enemy = new Enemy(this.scene, x, y, type, stats);
    
    // Añadir a las listas
    this.entities.set(enemyId, enemy);
    this.enemies.push(enemy);
    
    // Log para depuración (limitado a no saturar la consola)
    if (this.enemies.length % 5 === 0) {
      console.log(`EntitySystem: Enemigo #${this.enemies.length} (${type}) creado en (${x}, ${y})`);
    }
    
    return enemy;
  }

  /**
   * Elimina una entidad del sistema
   * @param {string} entityId - ID de la entidad
   * @returns {boolean} - True si se eliminó correctamente
   */
  removeEntity(entityId) {
    if (!this.entities.has(entityId)) return false;
    
    const entity = this.entities.get(entityId);
    
    // Si es un enemigo, eliminarlo de la lista de enemigos
    if (entity instanceof Enemy) {
      const index = this.enemies.indexOf(entity);
      if (index >= 0) {
        this.enemies.splice(index, 1);
      }
    }
    
    // Destruir la entidad y eliminarla del mapa
    entity.destroy();
    this.entities.delete(entityId);
    
    return true;
  }

  /**
   * Configura el multiplicador de velocidad
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
    console.log(`EntitySystem: Multiplicador de velocidad establecido a ${multiplier}x`);
  }
  
  /**
   * Establece el estado de pausa
   * @param {boolean} isPaused - Si está pausado
   */
  setPaused(isPaused) {
    this.isPaused = isPaused;
    console.log(`EntitySystem: ${isPaused ? 'Pausado' : 'Reanudado'}`);
  }

  /**
   * Busca un enemigo cercano al jugador
   * @param {number} range - Rango máximo de detección
   * @returns {Enemy|null} Enemigo encontrado o null
   */
  findNearestEnemy(range = 100) {
    if (!this.player || this.enemies.length === 0) return null;
    
    let nearestEnemy = null;
    let shortestDistance = range;
    
    for (const enemy of this.enemies) {
      if (!enemy.isActive()) continue;
      
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return nearestEnemy;
  }

  /**
   * Genera enemigos en el camino según condiciones
   * @param {Array} path - Array de puntos que forman el camino
   * @param {number} minDistance - Distancia mínima entre enemigos
   * @param {Function} conditions - Función que evalúa si generar un enemigo
   */
  spawnEnemiesOnPath(path, minDistance = 100, conditions = null) {
    if (!path || path.length === 0) return;
    
    // Distancia acumulada desde el último enemigo
    let distanceSinceLastEnemy = 0;
    let lastPoint = path[0];
    let enemiesCreated = 0;
    
    // Tipos de enemigos disponibles para generación
    const enemyTypes = ['slime', 'skeleton', 'goblin'];
    
    // Recorrer los puntos del camino
    for (let i = 1; i < path.length; i++) {
      const point = path[i];
      
      // Calcular distancia al punto anterior
      const segmentDistance = Phaser.Math.Distance.Between(
        lastPoint.x, lastPoint.y,
        point.x, point.y
      );
      
      distanceSinceLastEnemy += segmentDistance;
      
      // Si superamos la distancia mínima, evaluar si generamos un enemigo
      if (distanceSinceLastEnemy >= minDistance) {
        // Por defecto, 20% de probabilidad de generar enemigo
        const shouldSpawn = conditions ? conditions(point, i, path) : Math.random() < 0.2;
        
        if (shouldSpawn) {
          // Elegir tipo de enemigo al azar
          const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          
          // Estadísticas básicas según tipo
          const stats = this.getEnemyStatsByType(enemyType);
          
          // Crear el enemigo
          this.createEnemy(point.x, point.y, enemyType, stats);
          enemiesCreated++;
          
          // Reiniciar la distancia
          distanceSinceLastEnemy = 0;
        }
      }
      
      lastPoint = point;
    }
    
    console.log(`EntitySystem: ${enemiesCreated} enemigos creados en el camino`);
  }

  /**
   * Obtiene estadísticas básicas según el tipo de enemigo
   * @param {string} type - Tipo de enemigo
   * @returns {Object} Objeto con estadísticas
   */
  getEnemyStatsByType(type) {
    const baseStats = {
      health: 10,
      maxHealth: 10,
      attack: 1,
      defense: 0,
      speed: 1,
      experience: 5,
      gold: 1
    };
    
    switch (type) {
      case 'slime':
        return {
          ...baseStats,
          health: 8,
          maxHealth: 8,
          attack: 1,
          defense: 0,
          speed: 0.8,
          experience: 3,
          gold: 1
        };
      case 'skeleton':
        return {
          ...baseStats,
          health: 12,
          maxHealth: 12,
          attack: 2,
          defense: 1,
          speed: 1.2,
          experience: 7,
          gold: 2
        };
      case 'goblin':
        return {
          ...baseStats,
          health: 10,
          maxHealth: 10,
          attack: 1.5,
          defense: 0.5,
          speed: 1.5,
          experience: 5,
          gold: 3
        };
      default:
        return baseStats;
    }
  }

  /**
   * Actualiza todas las entidades
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    // No actualizar si está pausado
    if (this.isPaused) return;
    
    // Verificar delta muy grande
    if (delta > 500) {
      console.warn(`EntitySystem: Delta time anormalmente alto: ${delta}ms. Limitando a 500ms.`);
      delta = 500;
    }
    
    // Aplicar multiplicador de velocidad
    const adjustedDelta = delta * this.speedMultiplier;
    
    // Log ocasional para depuración
    if (Math.random() < 0.01) {
      console.log(`EntitySystem: update con delta=${delta}ms, ajustado=${adjustedDelta}ms (x${this.speedMultiplier})`);
    }
    
    // Actualizar el jugador
    if (this.player && this.player.active) {
      this.player.update(adjustedDelta);
    }
    
    // Actualizar enemigos
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(adjustedDelta);
      }
    }
  }
}