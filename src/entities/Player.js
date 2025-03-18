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
    
    // Estado de combate
    this.inCombat = false;
    this.targetEnemy = null;
  }

  /**
   * Actualiza el jugador
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    super.update(delta);
    
    // Gestión de combate automático
    if (this.inCombat && this.targetEnemy && this.targetEnemy.isActive()) {
      if (this.actionCooldown <= 0) {
        this.attack(this.targetEnemy);
      }
    } else {
      this.inCombat = false;
      this.targetEnemy = null;
    }
  }

  /**
   * Inicia combate con un enemigo
   * @param {Enemy} enemy - Enemigo objetivo
   */
  startCombat(enemy) {
    if (!enemy || !enemy.isActive()) return;
    
    this.inCombat = true;
    this.targetEnemy = enemy;
    
    // Notificar al sistema de combate
    this.scene.events.emit('combat-started', this, enemy);
  }

  /**
   * Realiza un ataque a un objetivo
   * @param {Entity} target - Objetivo del ataque
   * @returns {number} Daño causado
   */
  attack(target) {
    if (!target || !target.isActive() || this.actionCooldown > 0) return 0;
    
    // Calcular daño base
    let damage = this.stats.attack;
    
    // Modificadores de equipamiento
    if (this.equipment.weapon) {
      damage += this.equipment.weapon.attackBonus || 0;
    }
    
    // Aplicar daño
    const actualDamage = target.takeDamage(damage, this);
    
    // Cambiar estado y resetear cooldown
    this.setState('attacking');
    
    return actualDamage;
  }

  /**
   * Añade experiencia al jugador
   * @param {number} amount - Cantidad de experiencia
   */
  addExperience(amount) {
    this.stats.experience += amount;
    
    // Mostrar texto de experiencia
    const expText = this.scene.add.text(this.x, this.y - 40, `+${amount} EXP`, {
      font: '12px Arial',
      fill: '#ffff00'
    });
    expText.setOrigin(0.5, 0.5);
    
    // Animación
    this.scene.tweens.add({
      targets: expText,
      y: expText.y - 20,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        expText.destroy();
      }
    });
    
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
    
    // Efectos visuales
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
}