// src/entities/Player.js
import Entity from './Entity';

export default class Player extends Entity {
  constructor(scene, x, y, stats = {}) {
    // Estadísticas base del jugador
    const playerStats = {
      health: 20,
      maxHealth: 20,
      attack: 3,
      defense: 1,
      speed: 1.2,
      level: 1,
      experience: 0,
      experienceToNextLevel: 10,
      gold: 0,
      critChance: 0.08,     // 8% probabilidad de crítico
      critMultiplier: 1.7,  // 70% daño extra en críticos
      ...stats
    };
    
    super(scene, x, y, playerStats);
    
    // Propiedades específicas del jugador
    this.type = 'player';
    this.sprite.setFillStyle(0x00ff00); // Verde para el jugador
    
    // Inventario y equipamiento
    this.inventory = [];
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null
    };
    
    // Habilidades
    this.skills = [];
    this.skillCooldowns = new Map();
    
    // Estado de combate
    this.inCombat = false;
    this.targetEnemy = null;
    this.combatTimer = null;
    
    // Emisor de partículas para efectos
    this.createParticleEmitter();
  }

  /**
   * Crea un emisor de partículas para el jugador
   */
  createParticleEmitter() {
    // Emisor básico para efectos del jugador (desactivado por defecto)
    this.particleEmitter = this.scene.add.particles(0, 0, 'placeholder', {
      x: this.x,
      y: this.y,
      speed: { min: 20, max: 50 },
      scale: { start: 0.4, end: 0 },
      lifespan: 300,
      quantity: 1,
      frequency: -1 // -1 = emisión manual
    });
  }

  /**
   * Actualiza el jugador
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    super.update(delta);
    
    // Actualizar posición de efectos
    if (this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y);
    }
    
    // Gestión de combate automático
    if (this.inCombat && this.targetEnemy && this.targetEnemy.isActive()) {
      if (this.actionCooldown <= 0) {
        this.attack(this.targetEnemy);
      }
    } else if (this.inCombat) {
      this.inCombat = false;
      this.targetEnemy = null;
      
      // Detener timer de combate
      if (this.combatTimer) {
        this.combatTimer.remove();
        this.combatTimer = null;
      }
    }
    
    // Actualizar cooldowns de habilidades
    this.updateSkillCooldowns(delta);
  }

  /**
   * Actualiza los cooldowns de habilidades
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  updateSkillCooldowns(delta) {
    this.skillCooldowns.forEach((cooldown, skillId) => {
      const newCooldown = cooldown - delta;
      if (newCooldown <= 0) {
        this.skillCooldowns.delete(skillId);
        // Notificar que la habilidad está disponible
        this.scene.events.emit('player-skill-ready', skillId);
      } else {
        this.skillCooldowns.set(skillId, newCooldown);
      }
    });
  }

  /**
   * Inicia combate con un enemigo
   * @param {Enemy} enemy - Enemigo objetivo
   */
  startCombat(enemy) {
    if (!enemy || !enemy.isActive()) return;
    
    this.inCombat = true;
    this.targetEnemy = enemy;
    
    // Crear timer de "concentración" que rompe el combate si pasa mucho tiempo
    if (this.combatTimer) {
      this.combatTimer.remove();
    }
    
    this.combatTimer = this.scene.time.delayedCall(10000, () => {
      if (this.inCombat && this.targetEnemy === enemy) {
        // Salir de combate después de 10 segundos si sigue siendo el mismo enemigo
        this.inCombat = false;
        this.targetEnemy = null;
        
        // Notificar
        this.scene.events.emit('combat-timeout', this, enemy);
      }
    });
    
    // Notificar al sistema de combate
    this.scene.events.emit('combat-started', this, enemy);
    
    // Efecto visual de inicio de combate
    this.playStartCombatEffect();
  }

  /**
   * Crea un efecto visual para el inicio de combate
   */
  playStartCombatEffect() {
    if (!this.targetEnemy) return;
    
    // Flash rápido en el sprite
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.7,
      yoyo: true,
      duration: 100,
      repeat: 1
    });
    
    // Emisión de partículas de "iniciativa"
    if (this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y);
      this.particleEmitter.setSpeed({ min: 50, max: 100 });
      this.particleEmitter.setScale({ start: 0.5, end: 0 });
      this.particleEmitter.explode(5);
    }
    
    // Si existe el sistema de efectos de combate, usar eso en su lugar
    if (this.scene.combatEffectsSystem) {
      this.scene.combatEffectsSystem.createImpact(this.x, this.y, {
        size: 0.8,
        color: 0x00ff00,
        particles: 5
      });
    }
  }

  /**
   * Realiza un ataque a un objetivo
   * @param {Entity} target - Objetivo del ataque
   * @returns {Object|number} Resultado del ataque o daño causado (para compatibilidad)
   */
  attack(target) {
    if (!target || !target.isActive() || this.actionCooldown > 0) {
      return { damage: 0, isCritical: false, killed: false };
    }
    
    // Calcular daño base
    let damage = this.stats.attack;
    
    // Modificadores de equipamiento
    if (this.equipment.weapon) {
      damage += this.equipment.weapon.attackBonus || 0;
    }
    
    // Cambiar estado y resetear cooldown
    this.setState('attacking');
    
    // Si existe el sistema de combate, usar eso
    if (this.scene.combatSystem) {
      return this.scene.combatSystem.performAttack(this, target);
    }
    
    // Comportamiento legacy
    const actualDamage = target.takeDamage(damage, this);
    
    // Efecto visual de ataque basic
    this.createBasicAttackEffect(target);
    
    return actualDamage;
  }

  /**
   * Crea un efecto básico de ataque
   * @param {Entity} target - Objetivo del ataque
   */
  createBasicAttackEffect(target) {
    // Flash en el sprite
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 0.9,
      duration: 100,
      yoyo: true
    });
    
    // Línea de ataque
    const line = this.scene.add.line(
      0, 0,
      this.x, this.y,
      target.x, target.y,
      0x00ff00, 0.5
    );
    line.setOrigin(0, 0);
    
    // Desvanecer línea
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        line.destroy();
      }
    });
  }

  /**
   * Usa una habilidad
   * @param {string} skillId - ID de la habilidad
   * @param {Object} targetInfo - Información del objetivo (entidad o posición)
   * @returns {boolean} Si se usó correctamente
   */
  useSkill(skillId, targetInfo = {}) {
    // Buscar la habilidad en la lista
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return false;
    
    // Verificar cooldown
    if (this.skillCooldowns.has(skillId)) return false;
    
    // Verificar costos (mana, etc)
    if (skill.manaCost && this.stats.mana < skill.manaCost) return false;
    
    // Ejecutar efecto de la habilidad
    let success = false;
    if (skill.execute) {
      success = skill.execute(this, targetInfo);
    }
    
    // Si tuvo éxito, aplicar costos y cooldown
    if (success) {
      // Aplicar cooldown
      this.skillCooldowns.set(skillId, skill.cooldown || 5000);
      
      // Aplicar costos
      if (skill.manaCost && this.stats.mana !== undefined) {
        this.stats.mana -= skill.manaCost;
      }
      
      // Notificar
      this.scene.events.emit('player-used-skill', this, skill, targetInfo);
    }
    
    return success;
  }

  /**
   * Añade experiencia al jugador
   * @param {number} amount - Cantidad de experiencia
   */
  addExperience(amount) {
    if (amount <= 0) return;
    
    this.stats.experience += amount;
    
    // Mostrar texto de experiencia
    if (this.scene.combatEffectsSystem) {
      // Usar el sistema de efectos si está disponible
      const text = this.scene.add.text(this.x, this.y - 40, `+${amount} EXP`, {
        font: '12px Arial',
        fill: '#ffff00'
      });
      text.setOrigin(0.5, 0.5);
      
      this.scene.tweens.add({
        targets: text,
        y: text.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => {
          text.destroy();
        }
      });
    } else {
      // Comportamiento legacy
      const expText = this.scene.add.text(this.x, this.y - 40, `+${amount} EXP`, {
        font: '12px Arial',
        fill: '#ffff00'
      });
      expText.setOrigin(0.5, 0.5);
      
      this.scene.tweens.add({
        targets: expText,
        y: expText.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => {
          expText.destroy();
        }
      });
    }
    
    // Comprobar si sube de nivel
    if (this.stats.experience >= this.stats.experienceToNextLevel) {
      this.levelUp();
    }
    
    // Notificar
    this.scene.events.emit('player-gained-experience', amount, this.stats.experience);
  }

  /**
   * Añade oro al jugador
   * @param {number} amount - Cantidad de oro
   */
  addGold(amount) {
    if (amount <= 0) return;
    
    this.stats.gold += amount;
    
    // Mostrar texto de oro
    const goldText = this.scene.add.text(this.x, this.y - 30, `+${amount} Oro`, {
      font: '12px Arial',
      fill: '#ffd700'
    });
    goldText.setOrigin(0.5, 0.5);
    
    // Animación
    this.scene.tweens.add({
      targets: goldText,
      y: goldText.y - 20,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        goldText.destroy();
      }
    });
    
    // Notificar
    this.scene.events.emit('player-gained-gold', amount, this.stats.gold);
  }

  /**
   * Sube de nivel al jugador
   */
  levelUp() {
    // Aumentar nivel
    this.stats.level++;
    
    // Resetear experiencia
    this.stats.experience -= this.stats.experienceToNextLevel;
    
    // Calcular experiencia para el siguiente nivel (fórmula básica)
    this.stats.experienceToNextLevel = Math.floor(this.stats.experienceToNextLevel * 1.5);
    
    // Mejorar estadísticas
    this.stats.maxHealth += 5;
    this.stats.health = this.stats.maxHealth; // Curación completa al subir de nivel
    this.stats.attack += 1;
    this.stats.defense += 0.5;
    
    // Efectos visuales de nivel
    if (this.scene.combatEffectsSystem) {
      this.scene.combatEffectsSystem.createLevelUpEffect(this, this.stats.level);
    } else {
      // Efectos visuales legacy
      const levelUpText = this.scene.add.text(this.x, this.y - 50, '¡NIVEL UP!', {
        font: 'bold 16px Arial',
        fill: '#ffff00'
      });
      levelUpText.setOrigin(0.5, 0.5);
      
      // Animación de nivel
      this.scene.tweens.add({
        targets: levelUpText,
        y: levelUpText.y - 30,
        alpha: 0,
        duration: 2000,
        onComplete: () => {
          levelUpText.destroy();
        }
      });
      
      // Efecto visual en el jugador
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        yoyo: true
      });
    }
    
    // Notificar
    this.scene.events.emit('player-leveled-up', this.stats.level);
  }

  /**
   * Equipa un objeto
   * @param {Object} item - Objeto a equipar
   * @returns {boolean} - Éxito al equipar
   */
  equipItem(item) {
    if (!item || !item.type) return false;
    
    // Verificar nivel requerido
    if (item.levelReq && this.stats.level < item.levelReq) {
      // Notificar nivel insuficiente
      this.scene.events.emit('player-level-too-low', this, item);
      return false;
    }
    
    let slot = null;
    
    // Determinar slot según tipo
    if (item.type === 'weapon') {
      slot = 'weapon';
    } else if (item.type === 'armor') {
      slot = 'armor';
    } else if (item.type === 'accessory') {
      slot = 'accessory';
    }
    
    if (!slot) return false;
    
    // Desequipar item anterior
    if (this.equipment[slot]) {
      this.unequipItem(slot);
    }
    
    // Equipar nuevo
    this.equipment[slot] = item;
    
    // Aplicar bonificaciones
    if (item.healthBonus) this.stats.maxHealth += item.healthBonus;
    if (item.attackBonus) this.stats.attack += item.attackBonus;
    if (item.defenseBonus) this.stats.defense += item.defenseBonus;
    if (item.speedBonus) this.stats.speed += item.speedBonus;
    
    // Efectos visuales de equipamiento
    if (this.scene.combatEffectsSystem) {
      let color;
      switch (item.rarity) {
        case 'raro': color = 0xaa00ff; break;
        case 'inusual': color = 0x0088ff; break;
        default: color = 0xffffff;
      }
      
      this.scene.combatEffectsSystem.createStatusEffect(this, 'buff', 2000);
    }
    
    // Notificar
    this.scene.events.emit('player-equipped-item', item, slot);
    
    return true;
  }

  /**
   * Desequipa un objeto
   * @param {string} slot - Slot a desequipar
   * @returns {Object|null} - Item desequipado
   */
  unequipItem(slot) {
    if (!this.equipment[slot]) return null;
    
    const item = this.equipment[slot];
    
    // Revertir bonificaciones
    if (item.healthBonus) this.stats.maxHealth -= item.healthBonus;
    if (item.attackBonus) this.stats.attack -= item.attackBonus;
    if (item.defenseBonus) this.stats.defense -= item.defenseBonus;
    if (item.speedBonus) this.stats.speed -= item.speedBonus;
    
    // Ajustar vida actual si es necesario
    if (this.stats.health > this.stats.maxHealth) {
      this.stats.health = this.stats.maxHealth;
    }
    
    // Vaciar slot
    this.equipment[slot] = null;
    
    // Notificar
    this.scene.events.emit('player-unequipped-item', item, slot);
    
    return item;
  }

  /**
   * Aprende una nueva habilidad
   * @param {Object} skill - Habilidad a aprender
   * @returns {boolean} Si se pudo aprender
   */
  learnSkill(skill) {
    if (!skill || !skill.id) return false;
    
    // Verificar si ya se tiene
    if (this.skills.some(s => s.id === skill.id)) return false;
    
    // Verificar requisitos (nivel, etc)
    if (skill.levelReq && this.stats.level < skill.levelReq) return false;
    
    // Añadir habilidad
    this.skills.push(skill);
    
    // Efecto visual de aprendizaje
    if (this.scene.combatEffectsSystem) {
      this.scene.combatEffectsSystem.createImpact(this.x, this.y, {
        size: 1.2,
        color: 0xffaa00,
        particles: 10,
        duration: 500
      });
    }
    
    // Notificar
    this.scene.events.emit('player-learned-skill', this, skill);
    
    return true;
  }
}