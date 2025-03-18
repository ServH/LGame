// src/entities/enemy/EnemyTypes.js
/**
 * Definiciones de tipos de enemigos con sus estadísticas base y propiedades
 */
export const EnemyTypes = {
    // Enemigo básico (slime)
    slime: {
      name: 'Slime',
      stats: {
        health: 8,
        maxHealth: 8,
        attack: 1,
        defense: 0,
        speed: 0.8,
        experience: 3,
        gold: 1,
        critChance: 0.03,
        critMultiplier: 1.3,
        level: 1
      },
      properties: {
        size: { width: 12, height: 8 },
        color: 0x55ff55,
        aggroRange: 80,
        dropChance: 0.15
      }
    },
    
    // Esqueleto
    skeleton: {
      name: 'Skeleton',
      stats: {
        health: 12,
        maxHealth: 12,
        attack: 2,
        defense: 1,
        speed: 1.2,
        experience: 7,
        gold: 2,
        critChance: 0.05,
        critMultiplier: 1.4,
        level: 2
      },
      properties: {
        size: { width: 14, height: 16 },
        color: 0xaaaaaa,
        aggroRange: 120,
        dropChance: 0.18
      }
    },
    
    // Goblin
    goblin: {
      name: 'Goblin',
      stats: {
        health: 10,
        maxHealth: 10,
        attack: 1.5,
        defense: 0.5,
        speed: 1.5,
        experience: 5,
        gold: 3,
        critChance: 0.04,
        critMultiplier: 1.3,
        level: 1
      },
      properties: {
        size: { width: 12, height: 14 },
        color: 0x77cc77,
        aggroRange: 100,
        dropChance: 0.2
      }
    },
    
    // Murciélago
    bat: {
      name: 'Bat',
      stats: {
        health: 6,
        maxHealth: 6,
        attack: 1.2,
        defense: 0,
        speed: 1.8,
        experience: 4,
        gold: 1,
        critChance: 0.03,
        critMultiplier: 1.2,
        level: 2
      },
      properties: {
        size: { width: 10, height: 6 },
        color: 0x555555,
        aggroRange: 150,
        dropChance: 0.12,
        flying: true
      }
    },
    
    // Araña
    spider: {
      name: 'Spider',
      stats: {
        health: 8,
        maxHealth: 8,
        attack: 1.6,
        defense: 0.2,
        speed: 1.6,
        experience: 6,
        gold: 2,
        critChance: 0.06,
        critMultiplier: 1.5,
        level: 3
      },
      properties: {
        size: { width: 12, height: 6 },
        color: 0x000000,
        aggroRange: 110,
        dropChance: 0.22,
        poisonChance: 0.2
      }
    },
    
    // Lobo
    wolf: {
      name: 'Wolf',
      stats: {
        health: 14,
        maxHealth: 14,
        attack: 2.2,
        defense: 0.5,
        speed: 1.7,
        experience: 8,
        gold: 2,
        critChance: 0.07,
        critMultiplier: 1.6,
        level: 4
      },
      properties: {
        size: { width: 16, height: 10 },
        color: 0x777777,
        aggroRange: 140,
        dropChance: 0.25
      }
    },
    
    // Troll
    troll: {
      name: 'Troll',
      stats: {
        health: 25,
        maxHealth: 25,
        attack: 3,
        defense: 1.5,
        speed: 0.7,
        experience: 15,
        gold: 6,
        critChance: 0.1,
        critMultiplier: 1.8,
        level: 5
      },
      properties: {
        size: { width: 18, height: 20 },
        color: 0x55aa55,
        aggroRange: 90,
        dropChance: 0.35,
        stunChance: 0.15
      }
    },
    
    // Fantasma
    ghost: {
      name: 'Ghost',
      stats: {
        health: 12,
        maxHealth: 12,
        attack: 2.5,
        defense: 0.2,
        speed: 1.4,
        experience: 12,
        gold: 4,
        critChance: 0.06,
        critMultiplier: 1.4,
        level: 6
      },
      properties: {
        size: { width: 14, height: 18 },
        color: 0xccccff,
        aggroRange: 130,
        dropChance: 0.3,
        ethereal: true,
        opacity: 0.7
      }
    }
  };
  
  /**
   * Definiciones de tipos de jefes con sus estadísticas especiales
   */
  export const BossTypes = {
    // Rey Goblin
    goblin_king: {
      name: 'Goblin King',
      baseType: 'goblin',
      stats: {
        health: 50,
        maxHealth: 50,
        attack: 6,
        defense: 2,
        speed: 0.8,
        experience: 50,
        gold: 30,
        critChance: 0.1,
        critMultiplier: 2.0,
        level: 5
      },
      properties: {
        size: { width: 18, height: 22 },
        color: 0x55cc55,
        scale: 1.5,
        aggroRange: 150,
        dropChance: 1.0,
        minions: {
          type: 'goblin',
          count: 3,
          spawnInterval: 15000
        }
      },
      abilities: [
        {
          name: 'summonReinforcements',
          cooldown: 15000,
          initialCooldown: 5000
        },
        {
          name: 'warCry',
          cooldown: 20000,
          initialCooldown: 8000
        }
      ]
    },
    
    // Reina Slime
    slime_queen: {
      name: 'Slime Queen',
      baseType: 'slime',
      stats: {
        health: 100,
        maxHealth: 100,
        attack: 5,
        defense: 1,
        speed: 0.6,
        experience: 65,
        gold: 35,
        critChance: 0.08,
        critMultiplier: 1.5,
        level: 6
      },
      properties: {
        size: { width: 24, height: 18 },
        color: 0x00ffaa,
        scale: 2.2,
        aggroRange: 120,
        dropChance: 1.0,
        poisonChance: 0.3
      },
      abilities: [
        {
          name: 'split',
          cooldown: 30000,
          initialCooldown: 10000,
          healthThreshold: 0.5
        },
        {
          name: 'acidSplash',
          cooldown: 8000,
          initialCooldown: 3000
        }
      ]
    },
    
    // Lord Esqueleto
    skeleton_lord: {
      name: 'Skeleton Lord',
      baseType: 'skeleton',
      stats: {
        health: 70,
        maxHealth: 70,
        attack: 8,
        defense: 4,
        speed: 0.7,
        experience: 80,
        gold: 40,
        critChance: 0.15,
        critMultiplier: 1.8,
        level: 8
      },
      properties: {
        size: { width: 18, height: 24 },
        color: 0xbbbbbb,
        scale: 1.8,
        aggroRange: 160,
        dropChance: 1.0
      },
      abilities: [
        {
          name: 'boneStorm',
          cooldown: 12000,
          initialCooldown: 4000
        },
        {
          name: 'undeadSummoning',
          cooldown: 25000,
          initialCooldown: 8000
        }
      ]
    }
  };
  
  /**
   * Escala las estadísticas de un enemigo según su nivel
   * @param {Object} baseStats - Estadísticas base
   * @param {number} targetLevel - Nivel objetivo
   * @returns {Object} Estadísticas escaladas
   */
  export function scaleEnemyStatsByLevel(baseStats, targetLevel) {
    if (targetLevel <= 1) return { ...baseStats };
    
    const levelFactor = targetLevel - 1;
    
    return {
      ...baseStats,
      level: targetLevel,
      health: Math.round(baseStats.health * (1 + levelFactor * 0.2)),
      maxHealth: Math.round(baseStats.maxHealth * (1 + levelFactor * 0.2)),
      attack: Math.round(baseStats.attack * (1 + levelFactor * 0.15) * 100) / 100,
      defense: Math.round(baseStats.defense * (1 + levelFactor * 0.1) * 100) / 100,
      speed: Math.round((baseStats.speed + levelFactor * 0.05) * 100) / 100,
      experience: Math.round(baseStats.experience * (1 + levelFactor * 0.3)),
      gold: Math.round(baseStats.gold * (1 + levelFactor * 0.25)),
      critChance: Math.min(0.5, Math.round((baseStats.critChance + levelFactor * 0.005) * 100) / 100)
    };
  }
  
  /**
   * Obtiene un tipo de enemigo aleatorio del nivel especificado
   * @param {number} maxLevel - Nivel máximo disponible
   * @returns {string} Clave del tipo de enemigo
   */
  export function getRandomEnemyType(maxLevel) {
    // Filtrar tipos de enemigos disponibles según nivel
    const availableTypes = Object.entries(EnemyTypes)
      .filter(([_, data]) => data.stats.level <= maxLevel)
      .map(([type, _]) => type);
    
    // Seleccionar uno aleatorio
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }