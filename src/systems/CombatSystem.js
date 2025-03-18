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
}