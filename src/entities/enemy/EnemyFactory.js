// src/entities/enemy/EnemyFactory.js
import Enemy from './Enemy';
import { EnemyTypes, BossTypes, scaleEnemyStatsByLevel, getRandomEnemyType } from './EnemyTypes';
import EnemyVisuals from './EnemyVisuals';
import { initBehaviorsForEnemy } from './EnemyBehaviors';

/**
 * Fábrica para crear diferentes tipos de enemigos
 */
export default class EnemyFactory {
  /**
   * Crea un enemigo básico
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} type - Tipo de enemigo (slime, goblin, etc.)
   * @param {Object} statsOverride - Sobrescritura de estadísticas
   * @returns {Enemy} Instancia del enemigo
   */
  static createEnemy(scene, x, y, type = 'slime', statsOverride = {}) {
    // Verificar si el tipo existe, si no usar un tipo por defecto
    if (!EnemyTypes[type]) {
      type = 'slime';
    }
    
    const enemyType = EnemyTypes[type];
    
    // Clonar estadísticas base
    const baseStats = { ...enemyType.stats };
    
    // Aplicar nivel si se especifica
    if (statsOverride.level && statsOverride.level > 1) {
      const scaledStats = scaleEnemyStatsByLevel(baseStats, statsOverride.level);
      Object.assign(baseStats, scaledStats);
    }
    
    // Combinar con sobrescritura de estadísticas
    const finalStats = { ...baseStats, ...statsOverride };
    
    // Crear instancia de enemigo
    const enemy = new Enemy(scene, x, y, type, finalStats);
    
    // Configurar visuales específicas
    EnemyVisuals.createSprite(scene, enemy);
    
    // Inicializar comportamientos
    initBehaviorsForEnemy(enemy, scene);
    
    return enemy;
  }
  
  /**
   * Crea un jefe
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} bossType - Tipo de jefe (goblin_king, etc.)
   * @param {Object} statsOverride - Sobrescritura de estadísticas
   * @returns {Enemy} Instancia del jefe
   */
  static createBoss(scene, x, y, bossType = 'goblin_king', statsOverride = {}) {
    // Verificar si el tipo existe
    if (!BossTypes[bossType]) {
      bossType = 'goblin_king';
    }
    
    const boss = BossTypes[bossType];
    
    // Clonar estadísticas base
    const baseStats = { ...boss.stats };
    
    // Combinar con sobrescritura de estadísticas
    const finalStats = { ...baseStats, ...statsOverride };
    
    // Crear instancia de enemigo con el tipo base
    const enemy = new Enemy(scene, x, y, boss.baseType, finalStats);
    
    // Marcar como jefe
    enemy.isBoss = true;
    enemy.bossType = bossType;
    
    // Aplicar propiedades específicas del jefe
    if (boss.properties.scale) {
      enemy.setScale(boss.properties.scale);
    }
    
    // Configurar visuales
    EnemyVisuals.createSprite(scene, enemy);
    EnemyVisuals.createBossEffects(scene, enemy);
    
    // Inicializar comportamientos de jefe
    initBehaviorsForEnemy(enemy, scene);
    
    // Crear efecto de aparición
    if (scene.combatEffectsSystem) {
      scene.combatEffectsSystem.createBossSpawnEffect(enemy);
    }
    
    // Notificar aparición del jefe
    scene.events.emit('boss-spawned', enemy);
    
    return enemy;
  }
  
  /**
   * Crea un grupo de enemigos relacionados
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {number} x - Posición X central
   * @param {number} y - Posición Y central
   * @param {Object} options - Opciones de generación
   * @returns {Array} Listado de enemigos generados
   */
  static createEnemyGroup(scene, x, y, options = {}) {
    const {
      minLevel = 1,
      maxLevel = 1,
      count = 3,
      radius = 50,
      type = null,
      typeDistribution = 'same' // 'same', 'mixed', o 'leader'
    } = options;
    
    // Determinar tipo principal para el grupo
    let mainType = type;
    
    // Si no se especifica tipo, elegir uno aleatorio
    if (!mainType) {
      mainType = getRandomEnemyType(maxLevel);
    }
    
    // Crear grupo con id común
    const groupId = `group_${Date.now()}`;
    const enemies = [];
    
    for (let i = 0; i < count; i++) {
      // Distribuir en círculo
      const angle = (i / count) * Math.PI * 2;
      const distance = radius * (0.7 + Math.random() * 0.5);
      const enemyX = x + Math.cos(angle) * distance;
      const enemyY = y + Math.sin(angle) * distance;
      
      // Determinar tipo según la distribución
      let enemyType = mainType;
      
      if (typeDistribution === 'mixed') {
        // 30% de probabilidad de tipo diferente
        if (i > 0 && Math.random() < 0.3) {
          const otherType = getRandomEnemyType(maxLevel);
          if (otherType !== mainType) {
            enemyType = otherType;
          }
        }
      }
      
      // Determinar nivel
      let enemyLevel;
      if (typeDistribution === 'leader' && i === 0) {
        // Líder es de nivel más alto
        enemyLevel = maxLevel;
      } else {
        // Nivel aleatorio en el rango
        enemyLevel = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
      }
      
      // Crear enemigo
      const enemy = this.createEnemy(scene, enemyX, enemyY, enemyType, { level: enemyLevel });
      
      // Marcar como parte del grupo
      enemy.groupId = groupId;
      
      // Si es el primer enemigo del grupo, podría ser un "líder"
      if (i === 0 && typeDistribution === 'leader') {
        enemy.isGroupLeader = true;
        
        // Mejorar ligeramente al líder
        enemy.stats.attack *= 1.2;
        enemy.stats.health *= 1.3;
        enemy.stats.maxHealth = enemy.stats.health;
        enemy.stats.experience *= 1.5;
        enemy.stats.gold *= 1.5;
        
        // Hacerlo visualmente distinto
        enemy.setScale(1.2);
      }
      
      enemies.push(enemy);
    }
    
    // Configurar comportamiento de grupo
    this.setupGroupBehavior(scene, enemies, groupId);
    
    return enemies;
  }
  
  /**
   * Configura comportamiento de grupo entre enemigos
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Array} enemies - Listado de enemigos del grupo
   * @param {string} groupId - ID del grupo
   */
  static setupGroupBehavior(scene, enemies, groupId) {
    // Si no hay suficientes enemigos, no es necesario
    if (!enemies || enemies.length < 2) return;
    
    // Configurar alertas de grupo
    enemies.forEach(enemy => {
      // Evento original al entrar en combate
      const originalStartCombat = enemy.startCombat;
      
      // Sobreescribir con comportamiento de grupo
      enemy.startCombat = function(player) {
        // Llamar al método original
        originalStartCombat.call(this, player);
        
        // Si este enemigo forma parte de un grupo, alertar a los demás
        if (this.groupId) {
          // Buscar otros miembros del grupo
          const groupMembers = enemies.filter(e => 
            e !== this && 
            e.isActive() && 
            e.groupId === this.groupId
          );
          
          // Alertar a cada miembro con un pequeño delay
          groupMembers.forEach((member, index) => {
            scene.time.delayedCall(100 + index * 150, () => {
              if (member.isActive() && !member.inCombat) {
                member.alert(3000);
                
                // 50% de probabilidad de unirse al combate inmediatamente
                if (Math.random() < 0.5) {
                  member.startCombat(player);
                }
              }
            });
          });
        }
      };
    });
  }
  
  /**
   * Genera enemigos en el camino según condiciones
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Array} path - Array de puntos que forman el camino
   * @param {number} minDistance - Distancia mínima entre enemigos
   * @param {Function} conditions - Función que evalúa si generar un enemigo
   */
  static populatePath(scene, path, minDistance = 100, conditions = null) {
    if (!path || path.length === 0) return;
    
    // Distancia acumulada desde el último enemigo
    let distanceSinceLastEnemy = 0;
    let lastPoint = path[0];
    
    // Obtener nivel del jugador para escalar enemigos
    const playerLevel = scene.entitySystem?.player?.stats.level || 1;
    
    // Tipos de enemigos y sus pesos según progresión
    const enemyPool = Object.entries(EnemyTypes)
      .filter(([_, data]) => data.stats.level <= playerLevel + 2)
      .map(([type, data]) => ({
        type,
        weight: 10 - Math.max(0, data.stats.level - playerLevel)
      }));
    
    // Calcular suma total de pesos
    const totalWeight = enemyPool.reduce((sum, enemy) => sum + enemy.weight, 0);
    
    // Determinar si generaremos grupos o enemigos individuales
    let groupProbability = 0.2; // 20% de probabilidad base de grupo
    
    // Aumentar probabilidad de grupos según nivel del jugador
    groupProbability += playerLevel * 0.03; // +3% por nivel
    
    // Recorrer puntos del camino para colocar enemigos
    for (let i = 1; i < path.length; i++) {
      const point = path[i];
      
      // Calcular distancia al punto anterior
      const segmentDistance = Phaser.Math.Distance.Between(
        lastPoint.x, lastPoint.y,
        point.x, point.y
      );
      
      distanceSinceLastEnemy += segmentDistance;
      
      // Verificar si es momento de generar un enemigo
      if (distanceSinceLastEnemy >= minDistance) {
        // Por defecto, 30% de probabilidad base + factor de condiciones
        const shouldSpawn = conditions ? conditions(point, i, path) : Math.random() < 0.3;
        
        if (shouldSpawn) {
          // Determinar si generamos un grupo o enemigo individual
          if (Math.random() < groupProbability) {
            // Generar grupo de enemigos
            this.createEnemyGroup(scene, point.x, point.y, {
              minLevel: Math.max(1, playerLevel - 1),
              maxLevel: playerLevel + 1,
              count: Math.floor(2 + Math.random() * 3) // 2-4 enemigos
            });
          } else {
            // Generar enemigo individual
            // Seleccionar tipo usando pesos
            let randomValue = Math.random() * totalWeight;
            let selectedType = enemyPool[0].type;
            
            for (const enemy of enemyPool) {
              randomValue -= enemy.weight;
              if (randomValue <= 0) {
                selectedType = enemy.type;
                break;
              }
            }
            
            // Determinar nivel (generalmente cercano al del jugador)
            const levelVariation = Math.random() < 0.7 
              ? Math.floor(Math.random() * 3) - 1 // 70%: nivel jugador -1/+1
              : Math.floor(Math.random() * 5) - 2; // 30%: nivel jugador -2/+2
            
            const enemyLevel = Math.max(1, playerLevel + levelVariation);
            
            // Crear enemigo
            this.createEnemy(scene, point.x, point.y, selectedType, { level: enemyLevel });
          }
          
          // Reiniciar la distancia
          distanceSinceLastEnemy = 0;
        }
      }
      
      lastPoint = point;
    }
    
    // Añadir jefes en puntos estratégicos del camino si el nivel del jugador es suficiente
    if (playerLevel >= 3) {
      this.populatePathWithBosses(scene, path, playerLevel);
    }
  }
  
  /**
   * Genera jefes en puntos estratégicos del camino
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Array} path - Puntos del camino
   * @param {number} playerLevel - Nivel actual del jugador
   */
  static populatePathWithBosses(scene, path, playerLevel) {
    // Si el camino es demasiado corto, no generar jefes
    if (path.length < 15) return;
    
    // Determinar cantidad de jefes (1-2 dependiendo del nivel)
    const bossCount = playerLevel >= 5 ? 2 : 1;
    
    // Tipos de jefes disponibles según nivel
    const availableBossTypes = [];
    
    if (playerLevel >= 3) availableBossTypes.push('goblin_king');
    if (playerLevel >= 5) availableBossTypes.push('slime_queen');
    if (playerLevel >= 7) availableBossTypes.push('skeleton_lord');
    
    // Si no hay jefes disponibles para el nivel, usar el básico
    if (availableBossTypes.length === 0) {
      availableBossTypes.push('goblin_king');
    }
    
    // Posiciones estratégicas en el camino
    const bossPositions = [];
    
    if (bossCount === 1) {
      // Un jefe a 2/3 del camino
      const index = Math.floor(path.length * 0.66);
      bossPositions.push(path[index]);
    } else {
      // Dos jefes: uno a la mitad y otro cerca del final
      const midIndex = Math.floor(path.length * 0.5);
      const endIndex = Math.floor(path.length * 0.85);
      bossPositions.push(path[midIndex], path[endIndex]);
    }
    
    // Generar cada jefe
    bossPositions.forEach((position, index) => {
      // Seleccionar tipo de jefe
      let bossType;
      
      if (bossCount > 1 && index === 0) {
        // Primer jefe (más débil)
        bossType = 'goblin_king';
      } else {
        // Jefe aleatorio entre los disponibles (o único jefe)
        bossType = availableBossTypes[Math.floor(Math.random() * availableBossTypes.length)];
      }
      
      // Crear jefe
      this.createBoss(scene, position.x, position.y, bossType);
    });
  }
}