// src/systems/CombatSystem.js
export default class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeCombats = new Map();
    this.combatEffects = new Map();
    this.damageNumbers = [];
    
    // Registrar eventos
    this.scene.events.on('combat-started', this.handleCombatStarted, this);
    this.scene.events.on('entity-died', this.handleEntityDied, this);
  }

  /**
   * Maneja el inicio de un combate
   * @param {Entity} attacker - Entidad atacante
   * @param {Entity} defender - Entidad defensora
   */
  handleCombatStarted(attacker, defender) {
    const combatId = `${attacker.id}_vs_${defender.id}`;
    
    // No duplicar combates
    if (this.activeCombats.has(combatId)) return;
    
    // Registrar combate activo
    this.activeCombats.set(combatId, {
      attacker,
      defender,
      startTime: this.scene.time.now,
      lastAttackTime: 0,
      lastDefendTime: 0
    });
    
    // Crear efectos visuales de combate
    this.createCombatEffects(combatId, attacker, defender);
    
    console.log(`Combate iniciado: ${attacker.type} vs ${defender.type}`);
  }

  /**
   * Maneja la muerte de una entidad
   * @param {Entity} entity - Entidad que murió
   * @param {Entity} killer - Entidad que causó la muerte
   */
  handleEntityDied(entity, killer) {
    // Buscar y finalizar todos los combates que involucren a esta entidad
    this.activeCombats.forEach((combat, combatId) => {
      if (combat.attacker === entity || combat.defender === entity) {
        this.endCombat(combatId, entity, killer);
      }
    });
  }

  /**
   * Crea efectos visuales para el combate
   * @param {string} combatId - ID del combate
   * @param {Entity} attacker - Entidad atacante
   * @param {Entity} defender - Entidad defensora
   */
  createCombatEffects(combatId, attacker, defender) {
    // Línea de combate que une a las entidades
    const line = this.scene.add.line(
      0, 0,
      attacker.x, attacker.y,
      defender.x, defender.y,
      0xdd0000, 0.3
    );
    line.setOrigin(0, 0);
    
    // Efecto pulsante en la línea
    this.scene.tweens.add({
      targets: line,
      alpha: { from: 0.3, to: 0.7 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Guardar referencias a los efectos
    this.combatEffects.set(combatId, { line });
  }

  /**
   * Finaliza un combate
   * @param {string} combatId - ID del combate
   * @param {Entity} defeated - Entidad derrotada
   * @param {Entity} victor - Entidad victoriosa
   */
  endCombat(combatId, defeated, victor) {
    // Eliminar del registro de combates activos
    this.activeCombats.delete(combatId);
    
    // Eliminar efectos visuales
    if (this.combatEffects.has(combatId)) {
      const effects = this.combatEffects.get(combatId);
      
      if (effects.line) {
        this.scene.tweens.add({
          targets: effects.line,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            effects.line.destroy();
          }
        });
      }
      
      this.combatEffects.delete(combatId);
    }
    
    // Recompensas de combate si el jugador ganó
    if (victor && victor.type === 'player' && defeated.type === 'enemy') {
      this.grantCombatRewards(victor, defeated);
    }
    
    console.log(`Combate finalizado: ${combatId}`);
  }

  /**
   * Otorga recompensas por victoria en combate
   * @param {Entity} player - Jugador que ganó
   * @param {Entity} enemy - Enemigo derrotado
   */
  grantCombatRewards(player, enemy) {
    // La experiencia y oro básicos ya se manejan en Entity.die()
    
    // Probabilidad de drop de objetos
    if (Math.random() < 0.2) { // 20% de probabilidad
      this.dropItem(player, enemy);
    }
  }

  /**
   * Determina y entrega un objeto al jugador
   * @param {Entity} player - Jugador que recibe el objeto
   * @param {Entity} enemy - Enemigo que dejó caer el objeto
   */
  dropItem(player, enemy) {
    // Tipos de objetos posibles: weapon, armor, accessory
    const itemTypes = ['weapon', 'armor', 'accessory'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    // Rareza basada en nivel del enemigo (si existe) o aleatoria
    const enemyLevel = enemy.stats.level || 1;
    const rarityRoll = Math.random() + (enemyLevel / 10);
    
    let rarity, color;
    if (rarityRoll > 0.9) {
      rarity = 'raro';
      color = 0xaa00ff; // Púrpura
    } else if (rarityRoll > 0.7) {
      rarity = 'inusual';
      color = 0x0088ff; // Azul
    } else {
      rarity = 'común';
      color = 0xaaaaaa; // Gris
    }
    
    // Crear objeto según tipo
    let item;
    switch (itemType) {
      case 'weapon':
        item = this.createWeapon(rarity, enemyLevel);
        break;
      case 'armor':
        item = this.createArmor(rarity, enemyLevel);
        break;
      case 'accessory':
        item = this.createAccessory(rarity, enemyLevel);
        break;
    }
    
    // Mostrar mensaje de objeto obtenido
    this.scene.events.emit('item-dropped', item, enemy.x, enemy.y);
    
    // Efecto visual
    const itemSprite = this.scene.add.circle(enemy.x, enemy.y, 5, color);
    this.scene.tweens.add({
      targets: itemSprite,
      y: '-=20',
      alpha: { from: 1, to: 0 },
      duration: 1000,
      onComplete: () => {
        itemSprite.destroy();
      }
    });
    
    // Añadir al inventario
    player.inventory.push(item);
  }

  /**
   * Crea un arma con estadísticas aleatorias
   * @param {string} rarity - Rareza del arma
   * @param {number} level - Nivel base para escalar estadísticas
   * @returns {Object} Objeto de arma
   */
  createWeapon(rarity, level) {
    const rarityMultiplier = rarity === 'raro' ? 1.5 : (rarity === 'inusual' ? 1.2 : 1);
    const baseAttack = Math.max(1, Math.floor(level * 0.8 * rarityMultiplier));
    
    const weaponTypes = ['Espada', 'Hacha', 'Maza', 'Daga'];
    const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    
    return {
      id: `weapon_${Date.now()}`,
      name: `${rarity === 'raro' ? 'Magnífica' : (rarity === 'inusual' ? 'Afilada' : '')} ${weaponType}`,
      type: 'weapon',
      rarity: rarity,
      attackBonus: baseAttack,
      description: `Una ${weaponType.toLowerCase()} de nivel ${level}`,
      levelReq: Math.max(1, level - 1)
    };
  }

  /**
   * Crea una armadura con estadísticas aleatorias
   * @param {string} rarity - Rareza de la armadura
   * @param {number} level - Nivel base para escalar estadísticas
   * @returns {Object} Objeto de armadura
   */
  createArmor(rarity, level) {
    const rarityMultiplier = rarity === 'raro' ? 1.5 : (rarity === 'inusual' ? 1.2 : 1);
    const baseDefense = Math.max(1, Math.floor(level * 0.6 * rarityMultiplier));
    const healthBonus = Math.floor(level * rarityMultiplier);
    
    const armorTypes = ['Casco', 'Peto', 'Guantes', 'Botas'];
    const armorType = armorTypes[Math.floor(Math.random() * armorTypes.length)];
    
    return {
      id: `armor_${Date.now()}`,
      name: `${rarity === 'raro' ? 'Formidable' : (rarity === 'inusual' ? 'Resistente' : '')} ${armorType}`,
      type: 'armor',
      rarity: rarity,
      defenseBonus: baseDefense,
      healthBonus: healthBonus,
      description: `Un ${armorType.toLowerCase()} de nivel ${level}`,
      levelReq: Math.max(1, level - 1)
    };
  }

  /**
   * Crea un accesorio con estadísticas aleatorias
   * @param {string} rarity - Rareza del accesorio
   * @param {number} level - Nivel base para escalar estadísticas
   * @returns {Object} Objeto de accesorio
   */
  createAccessory(rarity, level) {
    const rarityMultiplier = rarity === 'raro' ? 1.5 : (rarity === 'inusual' ? 1.2 : 1);
    
    const accessoryTypes = ['Anillo', 'Amuleto', 'Cinturón', 'Capa'];
    const accessoryType = accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)];
    
    // Determinar qué bonificación dar
    const bonusType = Math.floor(Math.random() * 3);
    let item = {
      id: `accessory_${Date.now()}`,
      name: `${rarity === 'raro' ? 'Místico' : (rarity === 'inusual' ? 'Encantado' : '')} ${accessoryType}`,
      type: 'accessory',
      rarity: rarity,
      description: `Un ${accessoryType.toLowerCase()} de nivel ${level}`,
      levelReq: Math.max(1, level - 1)
    };
    
    // Aplicar bonificación según tipo
    switch (bonusType) {
      case 0: // Bonificación de velocidad
        item.speedBonus = Math.max(0.1, (level * 0.05 * rarityMultiplier)).toFixed(1);
        item.description += ` que aumenta la velocidad`;
        break;
      case 1: // Bonificación de salud
        item.healthBonus = Math.floor(level * 1.2 * rarityMultiplier);
        item.description += ` que aumenta la salud`;
        break;
      case 2: // Bonificación mixta
        item.attackBonus = Math.floor(level * 0.3 * rarityMultiplier);
        item.defenseBonus = Math.floor(level * 0.3 * rarityMultiplier);
        item.description += ` que mejora el ataque y la defensa`;
        break;
    }
    
    return item;
  }

  /**
   * Muestra números de daño flotantes
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} amount - Cantidad de daño
   * @param {boolean} isCrit - Si es daño crítico
   */
  showDamageNumber(x, y, amount, isCrit = false) {
    const text = this.scene.add.text(x, y, isCrit ? `¡${amount}!` : amount.toString(), {
      font: isCrit ? 'bold 18px Arial' : '16px Arial',
      fill: isCrit ? '#ff0000' : '#ff5555',
      stroke: '#000000',
      strokeThickness: 2
    });
    text.setOrigin(0.5, 0.5);
    
    // Animación flotante
    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      scale: isCrit ? 1.2 : 0.8,
      duration: 1000,
      onComplete: () => {
        text.destroy();
      }
    });
    
    this.damageNumbers.push(text);
  }

  /**
   * Realiza un ataque entre dos entidades
   * @param {Entity} attacker - Entidad atacante
   * @param {Entity} defender - Entidad defensora
   * @returns {Object} Resultado del ataque
   */
  performAttack(attacker, defender) {
    if (!attacker.isActive() || !defender.isActive()) return null;

    // Calcular daño base
    let damage = attacker.stats.attack;
    
    // Modificadores de equipo
    if (attacker.equipment) {
      if (attacker.equipment.weapon && attacker.equipment.weapon.attackBonus) {
        damage += attacker.equipment.weapon.attackBonus;
      }
    }
    
    // Probabilidad de crítico (10%)
    const isCritical = Math.random() < 0.1;
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Aplicar daño
    const actualDamage = defender.takeDamage(damage, attacker);
    
    // Mostrar número de daño
    this.showDamageNumber(defender.x, defender.y, actualDamage, isCritical);
    
    // Efectos visuales de ataque
    this.showAttackEffect(attacker, defender);
    
    return {
      damage: actualDamage,
      isCritical,
      killed: defender.stats.health <= 0
    };
  }

  /**
   * Muestra efectos visuales durante un ataque
   * @param {Entity} attacker - Entidad atacante
   * @param {Entity} defender - Entidad defensora
   */
  showAttackEffect(attacker, defender) {
    // Línea de ataque (rápida)
    const line = this.scene.add.line(
      0, 0,
      attacker.x, attacker.y,
      defender.x, defender.y,
      0xffff00, 0.6
    );
    line.setOrigin(0, 0);
    
    // Animación de desvanecimiento
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        line.destroy();
      }
    });
    
    // Flash en el defensor
    if (defender.sprite) {
      this.scene.tweens.add({
        targets: defender.sprite,
        alpha: 0.3,
        yoyo: true,
        duration: 100
      });
    }
    
    // Partículas de impacto
    const particles = this.scene.add.particles(0, 0, 'placeholder', {
      x: defender.x,
      y: defender.y,
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 5,
      emitting: false
    });
    particles.explode();
    
    // Auto-destruir emisor después de la animación
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * Actualiza todos los combates activos
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    // Actualizar posiciones de líneas de combate
    this.combatEffects.forEach((effects, combatId) => {
      const combat = this.activeCombats.get(combatId);
      if (combat && effects.line) {
        effects.line.setTo(
          combat.attacker.x, combat.attacker.y,
          combat.defender.x, combat.defender.y
        );
      }
      
    });
    
  }
  // Extensiones para CombatSystem.js - Añadir estas funciones

/**
 * Calcula el daño basado en las estadísticas y modificadores
 * @param {Entity} attacker - Entidad atacante
 * @param {Entity} defender - Entidad defensora
 * @returns {Object} Información del daño calculado
 */
calculateDamage(attacker, defender) {
  // Daño base
  let damage = attacker.stats.attack;
  
  // Modificadores de equipo del atacante
  if (attacker.equipment) {
    if (attacker.equipment.weapon && attacker.equipment.weapon.attackBonus) {
      damage += attacker.equipment.weapon.attackBonus;
    }
  }
  
  // Verificar crítico
  const critChance = attacker.stats.critChance || 0.05;
  const isCritical = Math.random() < critChance;
  
  // Aplicar multiplicador de crítico
  if (isCritical) {
    const critMultiplier = attacker.stats.critMultiplier || 1.5;
    damage *= critMultiplier;
  }
  
  // Considerar defensa del defensor
  const defense = defender.stats.defense || 0;
  let actualDamage = Math.max(1, Math.floor(damage - defense));
  
  // Verificar modificadores de estado
  attacker.statusEffects.forEach(effect => {
    if (effect.modifyDamage) {
      actualDamage = effect.modifyDamage(actualDamage, attacker, defender);
    }
  });
  
  defender.statusEffects.forEach(effect => {
    if (effect.modifyDamageTaken) {
      actualDamage = effect.modifyDamageTaken(actualDamage, defender, attacker);
    }
  });
  
  return {
    raw: damage,
    final: Math.floor(actualDamage),
    isCritical,
    defense: defense
  };
}

/**
 * Genera un conjunto de enemigos con una distribución específica
 * @param {number} count - Cantidad de enemigos
 * @param {Object} options - Opciones de generación
 * @returns {Array} Listado de enemigos generados
 */
generateEnemyGroup(count, options = {}) {
  const {
    minLevel = 1,
    maxLevel = this.player?.stats.level || 1,
    position = null,
    radius = 100,
    types = ['slime', 'goblin', 'skeleton']
  } = options;
  
  const enemies = [];
  
  // Posición base si no se proporciona
  let baseX = position ? position.x : this.scene.cameras.main.width / 2;
  let baseY = position ? position.y : this.scene.cameras.main.height / 2;
  
  // Distribuir enemigos
  for (let i = 0; i < count; i++) {
    // Calcular posición
    const angle = (i / count) * Math.PI * 2;
    const distance = radius * (0.5 + Math.random() * 0.5);
    const x = baseX + Math.cos(angle) * distance;
    const y = baseY + Math.sin(angle) * distance;
    
    // Determinar tipo (mayoría del mismo tipo, algunos variados)
    let enemyType;
    if (i === 0 || Math.random() < 0.7) {
      // Tipo principal para este grupo
      enemyType = types[Math.floor(Math.random() * types.length)];
    } else {
      // Variaciones ocasionales
      const availableTypes = types.filter(t => t !== enemies[0].enemyType);
      enemyType = availableTypes.length > 0 
        ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
        : types[Math.floor(Math.random() * types.length)];
    }
    
    // Determinar nivel
    const level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
    
    // Ajustar estadísticas según nivel
    const baseStats = this.scene.entitySystem.getEnemyStatsByType(enemyType);
    const stats = {
      ...baseStats,
      level: level,
      health: baseStats.health + (level - 1) * 2,
      maxHealth: baseStats.health + (level - 1) * 2,
      attack: baseStats.attack + (level - 1) * 0.5,
      defense: baseStats.defense + (level - 1) * 0.3,
      experience: baseStats.experience + (level - 1) * 2,
      gold: baseStats.gold + (level - 1)
    };
    
    // Crear enemigo
    const enemy = this.scene.entitySystem.createEnemy(x, y, enemyType, stats);
    enemies.push(enemy);
    
    // Crear relación de grupo (los enemigos se alertan entre sí)
    if (i > 0) {
      enemy.groupId = enemies[0].id;
    }
  }
  
  return enemies;
}

/**
 * Crea un jefe especial 
 * @param {Object} position - Posición donde colocar el jefe
 * @param {string} type - Tipo de jefe
 * @returns {Enemy} Instancia del jefe
 */
createBoss(position, type = 'goblin_king') {
  // Determinar estadísticas especiales según el tipo
  let bossStats, bossType, bossSize;
  
  switch (type) {
    case 'goblin_king':
      bossType = 'goblin';
      bossSize = 1.5;
      bossStats = {
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
      };
      break;
      
    case 'skeleton_lord':
      bossType = 'skeleton';
      bossSize = 1.8;
      bossStats = {
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
      };
      break;
      
    case 'slime_queen':
      bossType = 'slime';
      bossSize = 2.2;
      bossStats = {
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
      };
      break;
      
    default:
      bossType = 'goblin';
      bossSize = 1.5;
      bossStats = {
        health: 40,
        maxHealth: 40,
        attack: 5,
        defense: 2,
        speed: 1,
        experience: 40,
        gold: 25,
        level: 4
      };
  }
  
  // Crear enemigo base
  const boss = this.scene.entitySystem.createEnemy(
    position.x,
    position.y,
    bossType,
    bossStats
  );
  
  // Marcar como jefe
  boss.isBoss = true;
  boss.bossType = type;
  
  // Ajustar tamaño
  boss.setScale(bossSize);
  
  // Añadir comportamientos especiales según tipo
  this.addBossBehaviors(boss);
  
  // Crear efecto de aparición
  if (this.scene.combatEffectsSystem) {
    this.scene.combatEffectsSystem.createBossSpawnEffect(boss);
  }
  
  // Notificar aparición del jefe
  this.scene.events.emit('boss-spawned', boss);
  
  return boss;
}

/**
 * Añade comportamientos especiales a un jefe
 * @param {Enemy} boss - Jefe al que añadir comportamientos
 */
addBossBehaviors(boss) {
  // Comportamientos específicos según tipo de jefe
  switch (boss.bossType) {
    case 'goblin_king':
      // Habilidad: Llamar refuerzos
      boss.behaviors.push({
        name: 'summonReinforcements',
        cooldown: 15000,
        currentCooldown: 5000,
        execute: () => {
          // Crear 2-3 goblins alrededor del jefe
          const count = 2 + Math.floor(Math.random());
          const minions = this.generateEnemyGroup(count, {
            position: { x: boss.x, y: boss.y },
            radius: 50,
            types: ['goblin'],
            minLevel: boss.stats.level - 2,
            maxLevel: boss.stats.level - 1
          });
          
          // Crear efecto visual
          if (this.scene.combatEffectsSystem) {
            this.scene.combatEffectsSystem.createSummonEffect(boss, minions);
          }
          
          return true;
        }
      });
      break;
      
    case 'skeleton_lord':
      // Habilidad: Tormenta de huesos
      boss.behaviors.push({
        name: 'boneStorm',
        cooldown: 12000,
        currentCooldown: 4000,
        execute: (target) => {
          if (!target || !target.isActive()) return false;
          
          // Daño en área
          const entitiesInRange = [target]; // Inicialmente solo el objetivo
          
          // Lanzar 5-8 proyectiles
          const projectileCount = 5 + Math.floor(Math.random() * 3);
          
          for (let i = 0; i < projectileCount; i++) {
            // Determinar objetivo aleatorio en rango cercano al jugador
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 60;
            const targetX = target.x + Math.cos(angle) * distance;
            const targetY = target.y + Math.sin(angle) * distance;
            
            // Crear proyectil
            const projectile = this.scene.add.circle(boss.x, boss.y, 5, 0xffffff);
            projectile.setDepth(10);
            
            // Animar proyectil
            this.scene.tweens.add({
              targets: projectile,
              x: targetX,
              y: targetY,
              duration: 400 + Math.random() * 200,
              onComplete: () => {
                // Efecto de impacto
                if (this.scene.combatEffectsSystem) {
                  this.scene.combatEffectsSystem.createImpact(
                    targetX,
                    targetY,
                    { size: 0.7, color: 0xaaaaaa }
                  );
                }
                
                // Daño en el punto de impacto
                if (target.isActive()) {
                  const damageInfo = this.calculateDamage(boss, target);
                  target.takeDamage(damageInfo.final * 0.3, boss); // 30% del daño normal
                  this.showDamageNumber(targetX, targetY, damageInfo.final * 0.3, false);
                }
                
                projectile.destroy();
              }
            });
          }
          
          return true;
        }
      });
      break;
      
    case 'slime_queen':
      // Habilidad: División (al perder cierta cantidad de vida, se divide en slimes más pequeños)
      boss.behaviors.push({
        name: 'split',
        cooldown: 30000, // Largo cooldown para que no ocurra con frecuencia
        currentCooldown: 10000,
        execute: () => {
          // Solo dividirse si tiene menos de 50% de vida
          if (boss.stats.health > boss.stats.maxHealth * 0.5) return false;
          
          // Crear 3-4 slimes pequeños
          const count = 3 + Math.floor(Math.random());
          const minions = this.generateEnemyGroup(count, {
            position: { x: boss.x, y: boss.y },
            radius: 30,
            types: ['slime'],
            minLevel: boss.stats.level - 3,
            maxLevel: boss.stats.level - 2
          });
          
          // Cada slime tiene menor vida
          minions.forEach(slime => {
            slime.stats.health = slime.stats.maxHealth * 0.7;
          });
          
          // Efecto visual de división
          if (this.scene.combatEffectsSystem) {
            boss.sprite.setAlpha(0.5);
            this.scene.tweens.add({
              targets: boss.sprite,
              alpha: 1,
              duration: 300,
              onComplete: () => {
                this.scene.combatEffectsSystem.createSplitEffect(boss, minions);
              }
            });
          }
          
          return true;
        }
      });
      break;
  }
}

// Añadir a CombatEffectsSystem.js

/**
 * Crea un efecto visual para la aparición de un jefe
 * @param {Enemy} boss - Jefe que aparece
 */
createBossSpawnEffect(boss) {
  // Crear onda expansiva
  const wave = this.scene.add.circle(boss.x, boss.y, 10, 0xff0000, 0.3);
  wave.setDepth(5);
  
  // Animar onda
  this.scene.tweens.add({
    targets: wave,
    radius: 100,
    alpha: 0,
    duration: 1000,
    ease: 'Sine.easeOut',
    onComplete: () => {
      wave.destroy();
    }
  });
  
  // Flash en el jefe
  if (boss.sprite) {
    this.scene.tweens.add({
      targets: boss.sprite,
      alpha: 0.3,
      yoyo: true,
      repeat: 3,
      duration: 150
    });
  }
  
  // Partículas de aparición
  const particles = this.scene.add.particles(boss.x, boss.y, 'placeholder', {
    speed: { min: 50, max: 200 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 800,
    quantity: 40,
    emitting: false
  });
  
  particles.explode();
  
  // Eliminar emisor después de la animación
  this.scene.time.delayedCall(800, () => {
    particles.destroy();
  });
  
  // Texto de alerta
  const bossText = this.scene.add.text(boss.x, boss.y - 40, '¡JEFE!', {
    font: 'bold 24px Arial',
    fill: '#ff0000',
    stroke: '#000000',
    strokeThickness: 4
  });
  bossText.setOrigin(0.5);
  bossText.setDepth(20);
  
  // Animar texto
  this.scene.tweens.add({
    targets: bossText,
    y: boss.y - 80,
    alpha: 0,
    duration: 2000,
    ease: 'Power2',
    onComplete: () => {
      bossText.destroy();
    }
  });
}

/**
 * Crea un efecto para la invocación de minions
 * @param {Enemy} summoner - Enemigo que invoca
 * @param {Array} minions - Minions invocados
 */
createSummonEffect(summoner, minions) {
  minions.forEach((minion, index) => {
    // Posición inicial cerca del invocador
    const originalX = minion.x;
    const originalY = minion.y;
    minion.x = summoner.x;
    minion.y = summoner.y;
    minion.alpha = 0.2;
    
    // Animar aparición
    this.scene.tweens.add({
      targets: minion,
      x: originalX,
      y: originalY,
      alpha: 1,
      duration: 500 + index * 100,
      ease: 'Power2',
      onComplete: () => {
        // Crear círculo de aparición
        const circle = this.scene.add.circle(
          originalX,
          originalY,
          10,
          0x00ff00,
          0.5
        );
        
        // Animar círculo
        this.scene.tweens.add({
          targets: circle,
          radius: 30,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            circle.destroy();
          }
        });
      }
    });
  });
}

/**
 * Crea un efecto para la división de un enemigo
 * @param {Enemy} parent - Enemigo que se divide
 * @param {Array} children - Enemigos resultantes
 */
createSplitEffect(parent, children) {
  // Partículas en el punto de división
  const particles = this.scene.add.particles(parent.x, parent.y, 'placeholder', {
    speed: { min: 30, max: 80 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.5, end: 0 },
    tint: 0x00ff00,
    lifespan: 600,
    quantity: 20,
    emitting: false
  });
  
  particles.explode();
  
  // Líneas de conexión entre el padre y los hijos
  children.forEach(child => {
    const line = this.scene.add.line(
      0, 0,
      parent.x, parent.y,
      child.x, child.y,
      0x00ff00,
      0.8
    );
    line.setOrigin(0, 0);
    
    // Desvanecer línea
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        line.destroy();
      }
    });
    
    // Hacer que el hijo sea inicialmente pequeño y crezca
    child.setScale(0.3);
    this.scene.tweens.add({
      targets: child,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  });
  
  // Eliminar partículas después de la animación
  this.scene.time.delayedCall(600, () => {
    particles.destroy();
  });
}
// Mejoras al sistema de recompensas de combate - Añadir a CombatSystem.js

/**
 * Sistema mejorado de recompensas de combate
 * @param {Entity} player - Jugador ganador
 * @param {Entity} enemy - Enemigo derrotado
 */
grantCombatRewards(player, enemy) {
  // Verificar si es un jugador válido
  if (!player || player.type !== 'player' || !player.isActive()) return;
  
  // Calcular recompensas base
  const baseExp = enemy.stats.experience || 0;
  const baseGold = enemy.stats.gold || 0;
  
  // Bonificaciones según tipo y nivel del enemigo
  let expMultiplier = 1.0;
  let goldMultiplier = 1.0;
  
  // Bonificación por nivel del enemigo respecto al jugador
  const levelDiff = (enemy.stats.level || 1) - player.stats.level;
  if (levelDiff > 0) {
    // Enemigo de mayor nivel
    expMultiplier += levelDiff * 0.2;
    goldMultiplier += levelDiff * 0.15;
  }
  
  // Bonificación por tipo de enemigo especial
  if (enemy.isBoss) {
    expMultiplier *= 2.5;
    goldMultiplier *= 3.0;
  }
  
  // Calcular recompensas finales
  const experience = Math.floor(baseExp * expMultiplier);
  const gold = Math.floor(baseGold * goldMultiplier);
  
  // Otorgar experiencia y oro
  player.addExperience(experience);
  player.addGold(gold);
  
  // Probabilidad de drop de objetos
  this.rollForItemDrop(player, enemy);
  
  // Emitir evento de recompensa
  this.scene.events.emit('combat-rewards-granted', {
    player,
    enemy,
    rewards: {
      experience,
      gold,
      originalExp: baseExp,
      originalGold: baseGold,
      expMultiplier,
      goldMultiplier
    }
  });
}

/**
 * Determina si un enemigo deja caer un objeto
 * @param {Entity} player - Jugador que recibe el objeto
 * @param {Entity} enemy - Enemigo derrotado
 */
rollForItemDrop(player, enemy) {
  // Probabilidad base según tipo de enemigo
  let dropChance = 0.15; // 15% para enemigos normales
  
  // Enemigos especiales tienen mayor probabilidad
  if (enemy.isBoss) {
    dropChance = 1.0; // 100% para jefes
  } else if (enemy.stats.level > player.stats.level) {
    dropChance += (enemy.stats.level - player.stats.level) * 0.05; // +5% por nivel superior
  }
  
  // Ajustar probabilidad según estadísticas del jugador (futura característica)
  
  // Verificar si obtiene objeto
  if (Math.random() < dropChance) {
    this.generateItemDrop(player, enemy);
  }
}

/**
 * Genera un objeto para el drop
 * @param {Entity} player - Jugador que recibe el objeto
 * @param {Entity} enemy - Enemigo derrotado
 */
generateItemDrop(player, enemy) {
  // Determinar tipo de objeto
  const itemTypes = ['weapon', 'armor', 'accessory'];
  const weights = [0.4, 0.3, 0.3]; // 40% armas, 30% armaduras, 30% accesorios
  
  // Selección ponderada
  let roll = Math.random();
  let itemType;
  
  if (roll < weights[0]) {
    itemType = itemTypes[0];
  } else if (roll < weights[0] + weights[1]) {
    itemType = itemTypes[1];
  } else {
    itemType = itemTypes[2];
  }
  
  // Determinar rareza
  let rarity;
  roll = Math.random();
  
  if (enemy.isBoss) {
    // Jefes tienen mayor probabilidad de objetos raros
    if (roll < 0.6) rarity = 'raro';
    else rarity = 'inusual';
  } else {
    // Enemigos normales
    if (roll < 0.1) rarity = 'raro';
    else if (roll < 0.3) rarity = 'inusual';
    else rarity = 'común';
  }
  
  // Nivel del objeto (basado en nivel del enemigo con variación)
  const itemLevel = Math.max(1, Math.floor(enemy.stats.level * (0.8 + Math.random() * 0.4)));
  
  // Crear objeto según tipo
  let item;
  
  switch (itemType) {
    case 'weapon':
      item = this.createWeapon(rarity, itemLevel);
      break;
    case 'armor':
      item = this.createArmor(rarity, itemLevel);
      break;
    case 'accessory':
      item = this.createAccessory(rarity, itemLevel);
      break;
  }
  
  // Añadir variaciones especiales para jefes
  if (enemy.isBoss && item) {
    // Sufijo especial
    const specialSuffixes = [
      'del Rey', 'del Conquistador', 'de la Reina', 
      'del Destructor', 'del Campeón', 'del Cazador'
    ];
    const suffix = specialSuffixes[Math.floor(Math.random() * specialSuffixes.length)];
    item.name = `${item.name} ${suffix}`;
    
    // Estadística adicional
    switch (Math.floor(Math.random() * 3)) {
      case 0:
        item.critChanceBonus = Math.round(rarity === 'raro' ? 0.05 : 0.03 * 100) / 100;
        item.description += ` con +${item.critChanceBonus * 100}% prob. crítico`;
        break;
      case 1:
        item.lifeStealBonus = Math.round(rarity === 'raro' ? 0.08 : 0.05 * 100) / 100;
        item.description += ` con +${item.lifeStealBonus * 100}% robo de vida`;
        break;
      case 2:
        item.dodgeBonus = Math.round(rarity === 'raro' ? 0.06 : 0.04 * 100) / 100;
        item.description += ` con +${item.dodgeBonus * 100}% evasión`;
        break;
    }
  }
  
  // Mostrar mensaje de objeto obtenido
  this.scene.events.emit('item-dropped', item, enemy.x, enemy.y);
  
  // Añadir al inventario
  player.inventory.push(item);
  
  return item;
}

// Modificaciones a los métodos de creación de objetos existentes

/**
 * Crea un arma con estadísticas aleatorias (versión mejorada)
 * @param {string} rarity - Rareza del arma
 * @param {number} level - Nivel base para escalar estadísticas
 * @returns {Object} Objeto de arma
 */
createWeapon(rarity, level) {
  const rarityMultiplier = rarity === 'raro' ? 1.5 : (rarity === 'inusual' ? 1.2 : 1);
  const baseAttack = Math.max(1, Math.floor(level * 0.8 * rarityMultiplier));
  
  // Tipos de armas con sus propios modificadores
  const weaponTypes = [
    { name: 'Espada', attackMod: 1.0, speedMod: 1.0 },
    { name: 'Hacha', attackMod: 1.2, speedMod: 0.8 },
    { name: 'Daga', attackMod: 0.7, speedMod: 1.3 },
    { name: 'Maza', attackMod: 1.1, speedMod: 0.9 },
    { name: 'Arco', attackMod: 0.9, speedMod: 1.1 }
  ];
  
  // Seleccionar tipo aleatorio
  const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
  
  // Prefijos según rareza
  const prefixes = {
    común: ['', '', 'Simple', 'Básica', 'Robusta'],
    inusual: ['Afilada', 'Fuerte', 'Precisa', 'Rápida', 'Confiable'],
    raro: ['Magnífica', 'Legendaria', 'Ancestral', 'Devastadora', 'Suprema']
  };
  
  // Seleccionar prefijo
  const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
  
  // Nombre del arma
  const name = prefix ? `${prefix} ${weaponType.name}` : weaponType.name;
  
  // Calcular ataque final basado en modificadores
  const finalAttack = Math.floor(baseAttack * weaponType.attackMod);
  
  // Probabilidad de bonificación extra según rareza
  let critBonus = 0;
  let speedBonus = 0;
  
  if (rarity === 'raro' || (rarity === 'inusual' && Math.random() < 0.5)) {
    // Añadir bonificación crítica o de velocidad
    if (Math.random() < 0.5) {
      critBonus = rarity === 'raro' ? 0.05 : 0.03;
    } else {
      speedBonus = rarity === 'raro' ? 0.1 : 0.05;
    }
  }
  
  // Crear objeto de arma
  return {
    id: `weapon_${Date.now()}`,
    name: name,
    type: 'weapon',
    subType: weaponType.name.toLowerCase(),
    rarity: rarity,
    attackBonus: finalAttack,
    speedBonus: speedBonus,
    critChanceBonus: critBonus,
    level: level,
    description: `Un${weaponType.name.charAt(0) === 'A' || weaponType.name.charAt(0) === 'E' ? 'a' : ''}a ${weaponType.name.toLowerCase()} de nivel ${level}`,
    levelReq: Math.max(1, level - 1)
  };
}

/**
 * Crea una armadura con estadísticas aleatorias (versión mejorada)
 * @param {string} rarity - Rareza de la armadura
 * @param {number} level - Nivel base para escalar estadísticas
 * @returns {Object} Objeto de armadura
 */
createArmor(rarity, level) {
  const rarityMultiplier = rarity === 'raro' ? 1.5 : (rarity === 'inusual' ? 1.2 : 1);
  const baseDefense = Math.max(1, Math.floor(level * 0.6 * rarityMultiplier));
  const healthBonus = Math.floor(level * rarityMultiplier);
  
  // Tipos de armadura
  const armorTypes = [
    { name: 'Casco', defenseMod: 0.7, healthMod: 0.5, slot: 'head' },
    { name: 'Coraza', defenseMod: 1.3, healthMod: 1.2, slot: 'chest' },
    { name: 'Guantes', defenseMod: 0.5, healthMod: 0.3, slot: 'hands' },
    { name: 'Botas', defenseMod: 0.6, healthMod: 0.4, slot: 'feet' },
    { name: 'Escudo', defenseMod: 1.0, healthMod: 0.8, slot: 'offhand' }
  ];
  
  // Seleccionar tipo aleatorio
  const armorType = armorTypes[Math.floor(Math.random() * armorTypes.length)];
  
  // Prefijos según rareza
  const prefixes = {
    común: ['', '', 'Simple', 'Básico', 'Robusto'],
    inusual: ['Reforzado', 'Resistente', 'Fiable', 'Templado', 'Forjado'],
    raro: ['Formidable', 'Mítico', 'Indestructible', 'Glorioso', 'Magnífico']
  };
  
  // Seleccionar prefijo
  const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
  
  // Nombre de la armadura
  const name = prefix ? `${prefix} ${armorType.name}` : armorType.name;
  
  // Calcular defensa y salud basadas en modificadores
  const finalDefense = Math.floor(baseDefense * armorType.defenseMod);
  const finalHealth = Math.floor(healthBonus * armorType.healthMod);
  
  // Bonificación extra según rareza
  let extraBonus = null;
  let extraDesc = '';
  
  if (rarity === 'raro' || (rarity === 'inusual' && Math.random() < 0.4)) {
    // Tipo de bonificación
    const bonusType = Math.floor(Math.random() * 3);
    
    switch (bonusType) {
      case 0: // Resistencia elemental
        extraBonus = {
          type: 'elementalResist',
          value: rarity === 'raro' ? 0.2 : 0.1,
          element: ['fuego', 'hielo', 'rayo'][Math.floor(Math.random() * 3)]
        };
        extraDesc = ` (${extraBonus.value * 100}% resist. ${extraBonus.element})`;
        break;
      case 1: // Regeneración
        extraBonus = {
          type: 'healthRegen',
          value: rarity === 'raro' ? 0.2 : 0.1
        };
        extraDesc = ` (regen. ${extraBonus.value} vida/s)`;
        break;
      case 2: // Reflejo de daño
        extraBonus = {
          type: 'damageReflect',
          value: rarity === 'raro' ? 0.15 : 0.07
        };
        extraDesc = ` (refleja ${extraBonus.value * 100}% daño)`;
        break;
    }
  }
  
  // Crear objeto de armadura
  return {
    id: `armor_${Date.now()}`,
    name: name,
    type: 'armor',
    subType: armorType.slot,
    rarity: rarity,
    defenseBonus: finalDefense,
    healthBonus: finalHealth,
    extraBonus: extraBonus,
    level: level,
    description: `Un ${armorType.name.toLowerCase()} de nivel ${level}${extraDesc}`,
    levelReq: Math.max(1, level - 1)
  };
}

/**
 * Crea un accesorio con estadísticas aleatorias (versión mejorada)
 * @param {string} rarity - Rareza del accesorio
 * @param {number} level - Nivel base para escalar estadísticas
 * @returns {Object} Objeto de accesorio
 */
createAccessory(rarity, level) {
  const rarityMultiplier = rarity === 'raro' ? 1.5 : (rarity === 'inusual' ? 1.2 : 1);
  
  // Tipos de accesorios
  const accessoryTypes = [
    { name: 'Anillo', slot: 'finger', effect: 'stat' },
    { name: 'Amuleto', slot: 'neck', effect: 'resist' },
    { name: 'Cinturón', slot: 'waist', effect: 'utility' },
    { name: 'Capa', slot: 'back', effect: 'stat' },
    { name: 'Brazalete', slot: 'wrist', effect: 'resist' }
  ];
  
  // Seleccionar tipo aleatorio
  const accessoryType = accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)];
  
  // Prefijos según rareza
  const prefixes = {
    común: ['', '', 'Simple', 'Básico'],
    inusual: ['Encantado', 'Armonioso', 'Elegante', 'Imbuido'],
    raro: ['Místico', 'Celestial', 'Arcano', 'Trascendental']
  };
  
  // Seleccionar prefijo
  const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
  
  // Nombre del accesorio
  const name = prefix ? `${prefix} ${accessoryType.name}` : accessoryType.name;
  
  // Determinar efecto principal basado en tipo y nivel
  let primaryEffect = {};
  let description = '';
  
  switch (accessoryType.effect) {
    case 'stat': // Mejora estadísticas
      const statType = Math.floor(Math.random() * 4);
      switch (statType) {
        case 0: // Velocidad
          primaryEffect = {
            speedBonus: +(Math.max(0.1, (level * 0.05 * rarityMultiplier)).toFixed(1))
          };
          description = `que aumenta la velocidad en ${primaryEffect.speedBonus}`;
          break;
        case 1: // Salud
          primaryEffect = {
            healthBonus: Math.floor(level * 1.2 * rarityMultiplier)
          };
          description = `que aumenta la salud en ${primaryEffect.healthBonus}`;
          break;
        case 2: // Ataque
          primaryEffect = {
            attackBonus: Math.floor(level * 0.5 * rarityMultiplier)
          };
          description = `que aumenta el ataque en ${primaryEffect.attackBonus}`;
          break;
        case 3: // Defensa
          primaryEffect = {
            defenseBonus: Math.floor(level * 0.4 * rarityMultiplier)
          };
          description = `que aumenta la defensa en ${primaryEffect.defenseBonus}`;
          break;
      }
      break;
      
    case 'resist': // Resistencias
      const resistType = Math.floor(Math.random() * 3);
      const resistElements = ['fuego', 'hielo', 'rayo'];
      const resistValue = +(Math.max(0.1, (0.15 * rarityMultiplier)).toFixed(2));
      
      primaryEffect = {
        resistType: resistElements[resistType],
        resistValue: resistValue
      };
      
      description = `que otorga ${resistValue * 100}% de resistencia a ${resistElements[resistType]}`;
      break;
      
    case 'utility': // Utilidad
      const utilityType = Math.floor(Math.random() * 3);
      switch (utilityType) {
        case 0: // Probabilidad de crítico
          primaryEffect = {
            critChanceBonus: +(Math.max(0.02, (0.03 * rarityMultiplier)).toFixed(2))
          };
          description = `que aumenta la prob. crítico en ${primaryEffect.critChanceBonus * 100}%`;
          break;
        case 1: // Multiplicador de crítico
          primaryEffect = {
            critMultiplierBonus: +(Math.max(0.1, (0.15 * rarityMultiplier)).toFixed(1))
          };
          description = `que aumenta el daño crítico en ${primaryEffect.critMultiplierBonus * 100}%`;
          break;
        case 2: // Robo de vida
          primaryEffect = {
            lifeStealBonus: +(Math.max(0.03, (0.05 * rarityMultiplier)).toFixed(2))
          };
          description = `que otorga ${primaryEffect.lifeStealBonus * 100}% de robo de vida`;
          break;
      }
      break;
  }
  
  // Combinar propiedades
  return {
    id: `accessory_${Date.now()}`,
    name: name,
    type: 'accessory',
    subType: accessoryType.slot,
    rarity: rarity,
    level: level,
    description: `Un ${accessoryType.name.toLowerCase()} de nivel ${level} ${description}`,
    levelReq: Math.max(1, level - 1),
    ...primaryEffect
  };
}

// Mejoras al sistema de generación de enemigos - Añadir a EntitySystem.js

/**
 * Genera enemigos más complejos y variados
 * @param {Array} path - Puntos del camino donde generar enemigos
 * @param {number} minDistance - Distancia mínima entre enemigos
 * @param {Function} conditions - Función para evaluar generación
 */
spawnComplexEnemies(path, minDistance = 100, conditions = null) {
  if (!path || path.length === 0) return;
  
  // Distancia acumulada desde el último enemigo
  let distanceSinceLastEnemy = 0;
  let lastPoint = path[0];
  
  // Obtener nivel del jugador para escalar enemigos
  const playerLevel = this.player ? this.player.stats.level : 1;
  
  // Tipos de enemigos y sus pesos según progresión
  const enemyPool = [
    { type: 'slime', weight: 10, minLevel: 1 },
    { type: 'goblin', weight: 8, minLevel: 1 },
    { type: 'skeleton', weight: 6, minLevel: 2 },
    { type: 'bat', weight: 7, minLevel: 2 },
    { type: 'spider', weight: 5, minLevel: 3 },
    { type: 'wolf', weight: 4, minLevel: 4 },
    { type: 'troll', weight: 2, minLevel: 5 },
    { type: 'ghost', weight: 2, minLevel: 6 }
  ];
  
  // Filtrar por nivel disponible
  const availableEnemies = enemyPool.filter(e => e.minLevel <= playerLevel + 2);
  
  // Calcular suma total de pesos
  const totalWeight = availableEnemies.reduce((sum, enemy) => sum + enemy.weight, 0);
  
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
          this.spawnEnemyGroup(point.x, point.y, {
            minLevel: Math.max(1, playerLevel - 1),
            maxLevel: playerLevel + 1,
            count: Math.floor(2 + Math.random() * 3) // 2-4 enemigos
          });
        } else {
          // Generar enemigo individual
          // Seleccionar tipo usando pesos
          let randomValue = Math.random() * totalWeight;
          let selectedType = availableEnemies[0].type;
          
          for (const enemy of availableEnemies) {
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
          
          // Ajustar estadísticas según nivel
          const baseStats = this.getEnemyStatsByType(selectedType);
          const stats = this.scaleEnemyStatsByLevel(baseStats, enemyLevel);
          
          // Crear enemigo
          this.createEnemy(point.x, point.y, selectedType, stats);
        }
        
        // Reiniciar la distancia
        distanceSinceLastEnemy = 0;
      }
    }
    
    lastPoint = point;
  }
  
  // Añadir jefes en puntos estratégicos del camino
  this.spawnBosses(path, playerLevel);
}

/**
 * Genera un grupo de enemigos relacionados
 * @param {number} x - Posición X central
 * @param {number} y - Posición Y central
 * @param {Object} options - Opciones de generación
 */
spawnEnemyGroup(x, y, options = {}) {
  const {
    minLevel = 1,
    maxLevel = 1,
    count = 3,
    radius = 50,
    typeDistribution = 'same' // 'same', 'mixed', o 'leader'
  } = options;
  
  // Determinar tipo principal para el grupo
  const availableTypes = ['slime', 'goblin', 'skeleton', 'bat', 'spider'];
  const filteredTypes = availableTypes.filter(type => {
    const minLevelForType = {
      'slime': 1, 'goblin': 1, 'skeleton': 2, 'bat': 2, 'spider': 3
    }[type] || 1;
    
    return minLevel >= minLevelForType;
  });
  
  // Tipo principal aleatorio entre los disponibles
  const mainType = filteredTypes[Math.floor(Math.random() * filteredTypes.length)];
  
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
        const otherTypes = filteredTypes.filter(t => t !== mainType);
        if (otherTypes.length > 0) {
          enemyType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
        }
      }
    } else if (typeDistribution === 'leader' && i === 0) {
      // Primer enemigo es "líder" y puede ser de tipo superior
      const leaderTypes = filteredTypes.filter(t => {
        const minLevelForType = {
          'slime': 1, 'goblin': 1, 'skeleton': 2, 'bat': 2, 'spider': 3
        }[t] || 1;
        
        return minLevelForType > (minLevelForType[mainType] || 1);
      });
      
      if (leaderTypes.length > 0) {
        enemyType = leaderTypes[Math.floor(Math.random() * leaderTypes.length)];
      }
    }
    
    // Determinar nivel
    let enemyLevel;
    if (typeDistribution === 'leader' && i === 0) {
      // Líder es de nivel más alto
      enemyLevel = Math.min(maxLevel + 1, maxLevel);
    } else {
      // Nivel aleatorio en el rango
      enemyLevel = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
    }
    
    // Ajustar estadísticas según nivel
    const baseStats = this.getEnemyStatsByType(enemyType);
    const stats = this.scaleEnemyStatsByLevel(baseStats, enemyLevel);
    
    // Crear enemigo
    const enemy = this.createEnemy(enemyX, enemyY, enemyType, stats);
    
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
  this.setupGroupBehavior(enemies, groupId);
  
  return enemies;
}

/**
 * Configura comportamiento de grupo entre enemigos
 * @param {Array} enemies - Listado de enemigos del grupo
 * @param {string} groupId - ID del grupo
 */
setupGroupBehavior(enemies, groupId) {
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
          this.scene.time.delayedCall(100 + index * 150, () => {
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
 * Genera jefes en puntos estratégicos del camino
 * @param {Array} path - Puntos del camino
 * @param {number} playerLevel - Nivel actual del jugador
 */
spawnBosses(path, playerLevel) {
  // Si el camino es demasiado corto, no generar jefes
  if (path.length < 15) return;
  
  // Determinar cantidad de jefes (1-2 dependiendo del nivel)
  const bossCount = playerLevel >= 5 ? 2 : 1;
  
  // Tipos de jefes disponibles según nivel
  const availableBossTypes = [];
  
  if (playerLevel >= 1) availableBossTypes.push('goblin_king');
  if (playerLevel >= 4) availableBossTypes.push('slime_queen');
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
    
    // Usar sistema de combate para crear el jefe
    if (this.scene.combatSystem) {
      this.scene.combatSystem.createBoss(position, bossType);
    }
  });
}

/**
 * Escala las estadísticas según nivel
 * @param {Object} baseStats - Estadísticas base
 * @param {number} level - Nivel objetivo
 * @returns {Object} Estadísticas escaladas
 */
scaleEnemyStatsByLevel(baseStats, level) {
  if (level <= 1) return baseStats;
  
  const levelFactor = level - 1;
  
  return {
    ...baseStats,
    level: level,
    health: Math.round(baseStats.health * (1 + levelFactor * 0.2)),
    maxHealth: Math.round(baseStats.maxHealth * (1 + levelFactor * 0.2)),
    attack: Math.round(baseStats.attack * (1 + levelFactor * 0.15)),
    defense: Math.round(baseStats.defense * (1 + levelFactor * 0.1)),
    speed: Math.round((baseStats.speed + levelFactor * 0.05) * 100) / 100,
    experience: Math.round(baseStats.experience * (1 + levelFactor * 0.3)),
    gold: Math.round(baseStats.gold * (1 + levelFactor * 0.25)),
    critChance: Math.round((baseStats.critChance + levelFactor * 0.005) * 100) / 100
  };
  
}
// Mejoras al sistema de recompensas de combate - Añadir a CombatSystem.js

/**
 * Sistema mejorado de recompensas de combate
 * @param {Entity} player - Jugador ganador
 * @param {Entity} enemy - Enemigo derrotado
 */
grantCombatRewards(player, enemy) {
  // Verificar si es un jugador válido
  if (!player || player.type !== 'player' || !player.isActive()) return;
  
  // Calcular recompensas base
  const baseExp = enemy.stats.experience || 0;
  const baseGold = enemy.stats.gold || 0;
  
  // Bonificaciones según tipo y nivel del enemigo
  let expMultiplier = 1.0;
  let goldMultiplier = 1.0;
  
  // Bonificación por nivel del enemigo respecto al jugador
  const levelDiff = (enemy.stats.level || 1) - player.stats.level;
  if (levelDiff > 0) {
    // Enemigo de mayor nivel
    expMultiplier += levelDiff * 0.2;
    goldMultiplier += levelDiff * 0.15;
  }
  
  // Bonificación por tipo de enemigo especial
  if (enemy.isBoss) {
    expMultiplier *= 2.5;
    goldMultiplier *= 3.0;
  }
  
  // Calcular recompensas finales
  const experience = Math.floor(baseExp * expMultiplier);
  const gold = Math.floor(baseGold * goldMultiplier);
  
  // Otorgar experiencia y oro
  player.addExperience(experience);
  player.addGold(gold);
  
  // Probabilidad de drop de objetos
  this.rollForItemDrop(player, enemy);
  
  // Emitir evento de recompensa
  this.scene.events.emit('combat-rewards-granted', {
    player,
    enemy,
    rewards: {
      experience,
      gold,
      originalExp: baseExp,
      originalGold: baseGold,
      expMultiplier,
      goldMultiplier
    }
  });
}

/**
 * Determina si un enemigo deja caer un objeto
 * @param {Entity} player - Jugador que recibe el objeto
 * @param {Entity} enemy - Enemigo derrotado
 */
rollForItemDrop(player, enemy) {
  // Probabilidad base según tipo de enemigo
  let dropChance = 0.15; // 15% para enemigos normales
  
  // Enemigos especiales tienen mayor probabilidad
  if (enemy.isBoss) {
    dropChance = 1.0; // 100% para jefes
  } else if (enemy.stats.level > player.stats.level) {
    dropChance += (enemy.stats.level - player.stats.level) * 0.05; // +5% por nivel superior
  }
  
  // Ajustar probabilidad según estadísticas del jugador (futura característica)
  
  // Verificar si obtiene objeto
  if (Math.random() < dropChance) {
    this.generateItemDrop(player, enemy);
  }
}

/**
 * Genera un objeto para el drop
 * @param {Entity} player - Jugador que recibe el objeto
 * @param {Entity} enemy - Enemigo derrotado
 */
generateItemDrop(player, enemy) {
  // Determinar tipo de objeto
  const itemTypes = ['weapon', 'armor', 'accessory'];
  const weights = [0.4, 0.3, 0.3]; // 40% armas, 30% armaduras, 30% accesorios
  
  // Selección ponderada
  let roll = Math.random();
  let itemType;
  
  if (roll < weights[0]) {
    itemType = itemTypes[0];
  } else if (roll < weights[0] + weights[1]) {
    itemType = itemTypes[1];
  } else {
    itemType = itemTypes[2];
  }
  
  // Determinar rareza
  let rarity;
  roll = Math.random();
  
  if (enemy.isBoss) {
    // Jefes tienen mayor probabilidad de objetos raros
    if (roll < 0.6) rarity = 'raro';
    else rarity = 'inusual';
  } else {
    // Enemigos normales
    if (roll < 0.1) rarity = 'raro';
    else if (roll < 0.3) rarity = 'inusual';
    else rarity = 'común';
  }
  
  // Nivel del objeto (basado en nivel del enemigo con variación)
  const itemLevel = Math.max(1, Math.floor(enemy.stats.level * (0.8 + Math.random() * 0.4)));
  
  // Crear objeto según tipo
  let item;
  
  switch (itemType) {
    case 'weapon':
      item = this.createWeapon(rarity, itemLevel);
      break;
    case 'armor':
      item = this.createArmor(rarity, itemLevel);
      break;
    case 'accessory':
      item = this.createAccessory(rarity, itemLevel);
      break;
  }
  
  // Añadir variaciones especiales para jefes
  if (enemy.isBoss && item) {
    // Sufijo especial
    const specialSuffixes = [
      'del Rey', 'del Conquistador', 'de la Reina', 
      'del Destructor', 'del Campeón', 'del Cazador'
    ];
    const suffix = specialSuffixes[Math.floor(Math.random() * specialSuffixes.length)];
    item.name = `${item.name} ${suffix}`;
    
    // Estadística adicional
    switch (Math.floor(Math.random() * 3)) {
      case 0:
        item.critChanceBonus = Math.round(rarity === 'raro' ? 0.05 : 0.03 * 100) / 100;
        item.description += ` con +${item.critChanceBonus * 100}% prob. crítico`;
        break;
      case 1:
        item.lifeStealBonus = Math.round(rarity === 'raro' ? 0.08 : 0.05 * 100) / 100;
        item.description += ` con +${item.lifeStealBonus * 100}% robo de vida`;
        break;
      case 2:
        item.dodgeBonus = Math.round(rarity === 'raro' ? 0.06 : 0.04 * 100) / 100;
        item.description += ` con +${item.dodgeBonus * 100}% evasión`;
        break;
    }
  }
  
  // Mostrar mensaje de objeto obtenido
  this.scene.events.emit('item-dropped', item, enemy.x, enemy.y);
  
  // Añadir al inventario
  player.inventory.push(item);
  
  return item;
}

// Modificaciones a los métodos de creación de objetos existentes

/**
 * Crea un arma con estadísticas aleatorias (versión mejorada)
 * @param {string} rarity - Rareza del arma
 * @param {number} level - Nivel base para escalar estadísticas
 * @returns {Object} Objeto de arma
 */
createWeapon(rarity, level) {
  const rarityMultiplier = rarity === 'raro' ? 1.5 : (rarity === 'inusual' ? 1.2 : 1);
  const baseAttack = Math.max(1, Math.floor(level * 0.8 * rarityMultiplier));
}
}
