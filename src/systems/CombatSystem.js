// src/systems/CombatSystem.js
/**
 * Sistema que maneja todas las interacciones de combate
 */
export default class CombatSystem {
  /**
   * Inicializa el sistema de combate
   * @param {Phaser.Scene} scene - Escena de Phaser
   */
  constructor(scene) {
    this.scene = scene;
    this.activeCombats = new Map();
    this.combatEffects = new Map();
    this.damageNumbers = [];
    this.autoCombat = true;
    
    // Referencias a otros sistemas
    this.entitySystem = null;
    this.combatEffectsSystem = null;
    
    // Registrar eventos
    this.scene.events.on('combat-started', this.handleCombatStarted, this);
    this.scene.events.on('entity-died', this.handleEntityDied, this);
  }

  /**
   * Sincroniza referencias con otros sistemas
   * @param {Function} getSystem - Función para obtener sistemas
   */
  syncReferences(getSystem) {
    this.entitySystem = getSystem('entity');
    this.combatEffectsSystem = getSystem('effects');
  }

  /**
   * Inicializa el sistema con datos del juego
   * @param {Object} gameData - Datos iniciales
   */
  initialize(gameData) {
    // Nada específico por ahora
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
    if (victor && victor.type === 'player' && defeated && defeated.type === 'enemy') {
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
    if (player.equipment && typeof player.equipment.addItem === 'function') {
      player.equipment.addItem(item);
    } else {
      // Fallback si no existe el sistema de equipamiento
      player.inventory = player.inventory || [];
      player.inventory.push(item);
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
    
    // Probabilidad de crítico
    const critChance = attacker.stats.critChance || 0.05;
    const isCritical = Math.random() < critChance;
    
    if (isCritical) {
      const critMultiplier = attacker.stats.critMultiplier || 1.5;
      damage = Math.floor(damage * critMultiplier);
    }
    
    // Aplicar daño
    const damageResult = defender.takeDamage(damage, attacker);
    const actualDamage = damageResult.damage || damage;
    
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
    
    // Usar el sistema de efectos si está disponible
    if (this.combatEffectsSystem) {
      this.combatEffectsSystem.createImpact(
        defender.x,
        defender.y,
        { size: 0.8, color: 0xff5555 }
      );
    }
  }

  /**
   * Alterna el modo de combate automático
   */
  toggleAutoCombat() {
    this.autoCombat = !this.autoCombat;
    this.scene.events.emit('combat-auto-toggled', this.autoCombat);
  }

  /**
   * Pausa temporalmente el combate
   */
  pauseCombat() {
    // Implementar lógica de pausa específica del combate
    this.scene.events.emit('combat-paused');
  }

  /**
   * Intenta huir del combate actual
   */
  attemptFlee() {
    const player = this.entitySystem?.player;
    if (!player || !player.targetEnemy) return false;
    
    // Probabilidad de éxito basada en velocidad del jugador vs enemigo
    const enemy = player.targetEnemy;
    const fleeChance = 0.3 + Math.max(0, (player.stats.speed - enemy.stats.speed) * 0.1);
    
    if (Math.random() < fleeChance) {
      // Éxito al huir
      player.inCombat = false;
      player.targetEnemy = null;
      
      // Terminar todos los combates del jugador
      this.activeCombats.forEach((combat, combatId) => {
        if (combat.attacker === player || combat.defender === player) {
          this.endCombat(combatId, null, null);
        }
      });
      
      this.scene.events.emit('player-fled-combat');
      return true;
    } else {
      // Fallo al huir
      this.scene.events.emit('player-failed-flee');
      return false;
    }
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
   * Crea una armadura con estadísticas aleatorias
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
    
    // Crear objeto de armadura
    return {
      id: `armor_${Date.now()}`,
      name: name,
      type: 'armor',
      subType: armorType.slot,
      rarity: rarity,
      defenseBonus: finalDefense,
      healthBonus: finalHealth,
      level: level,
      description: `Un ${armorType.name.toLowerCase()} de nivel ${level}`,
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

  /**
   * Actualiza el estado de los combates activos
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
    
    // Gestionar combate automático si está activado
    if (this.autoCombat) {
      this.updateAutoCombat(delta);
    }
  }
  
  /**
   * Actualiza la lógica de combate automático
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  updateAutoCombat(delta) {
    this.activeCombats.forEach((combat, combatId) => {
      const { attacker, defender, lastAttackTime, lastDefendTime } = combat;
      
      // Actualizar tiempo desde el último ataque
      const now = this.scene.time.now;
      
      // Verificar cooldown del atacante
      if (attacker.isActive() && defender.isActive()) {
        // Si es el jugador y tiene cooldown de acción
        if (attacker.type === 'player' && attacker.actionCooldown <= 0) {
          attacker.attack(defender);
          combat.lastAttackTime = now;
        }
        // Si es un enemigo y tiene cooldown de acción
        else if (attacker.type === 'enemy' && attacker.actionCooldown <= 0) {
          attacker.attack(defender);
          combat.lastDefendTime = now;
        }
      }
    });
  }
}