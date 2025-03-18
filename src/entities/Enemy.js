// src/entities/Enemy.js
import Entity from './Entity';

export default class Enemy extends Entity {
  constructor(scene, x, y, type = 'default', stats = {}) {
    // Estadísticas según tipo (básicas)
    let enemyStats = {
      health: 10,
      maxHealth: 10,
      attack: 1,
      defense: 0,
      speed: 1,
      experience: 5,
      gold: 1
    };
    
    // Ajustar según tipo
    switch (type) {
      case 'slime':
        enemyStats = {
          ...enemyStats,
          health: 8,
          maxHealth: 8,
          attack: 1,
          defense: 0,
          speed: 0.8,
          experience: 3,
          gold: 1
        };
        break;
      case 'skeleton':
        enemyStats = {
          ...enemyStats,
          health: 12,
          maxHealth: 12,
          attack: 2,
          defense: 1,
          speed: 1.2,
          experience: 7,
          gold: 2
        };
        break;
      case 'goblin':
        enemyStats = {
          ...enemyStats,
          health: 10,
          maxHealth: 10,
          attack: 1.5,
          defense: 0.5,
          speed: 1.5,
          experience: 5,
          gold: 3
        };
        break;
    }
    
    // Combinar con stats proporcionados
    super(scene, x, y, {...enemyStats, ...stats});
    
    // Propiedades específicas del enemigo
    this.type = 'enemy';
    this.enemyType = type;
    
    // Configurar visual según tipo
    this.configureSprite();
    
    // Estado de combate
    this.inCombat = false;
    this.targetPlayer = null;
    this.aggroRange = 100; // Rango de detección
  }

  /**
   * Configura el sprite según el tipo de enemigo
   */
  configureSprite() {
    // En el futuro, aquí se cargarán los sprites reales
    // Por ahora, usamos formas con colores distintos
    this.sprite.destroy();
    
    switch (this.enemyType) {
      case 'slime':
        this.sprite = this.scene.add.rectangle(0, 0, 12, 8, 0x55ff55);
        break;
      case 'skeleton':
        this.sprite = this.scene.add.rectangle(0, 0, 14, 16, 0xaaaaaa);
        break;
      case 'goblin':
        this.sprite = this.scene.add.rectangle(0, 0, 12, 14, 0x77cc77);
        break;
      default:
        this.sprite = this.scene.add.rectangle(0, 0, 14, 14, 0xff5555);
    }
    
    this.add(this.sprite);
  }

  /**
   * Actualiza el enemigo
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    super.update(delta);
    
    // Si no está en combate, comprobar si hay jugador cercano
    if (!this.inCombat) {
      const player = this.findPlayer();
      if (player) {
        this.startCombat(player);
      }
    }
    // Si está en combate, actualizar lógica de combate
    else if (this.targetPlayer && this.targetPlayer.isActive()) {
      if (this.actionCooldown <= 0) {
        this.attack(this.targetPlayer);
      }
    } else {
      this.inCombat = false;
      this.targetPlayer = null;
    }
  }

  /**
   * Busca un jugador dentro del rango de detección
   * @returns {Player|null} Jugador encontrado
   */
  findPlayer() {
    const player = this.scene.entitySystem?.player;
    
    if (!player || !player.isActive()) return null;
    
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );
    
    return distance <= this.aggroRange ? player : null;
  }

  /**
   * Inicia combate con el jugador
   * @param {Player} player - Jugador objetivo
   */
  startCombat(player) {
    if (!player || !player.isActive()) return;
    
    this.inCombat = true;
    this.targetPlayer = player;
    
    // También hacer que el jugador entre en combate con este enemigo
    player.startCombat(this);
    
    // Notificar
    this.scene.events.emit('combat-started', player, this);
  }

  /**
   * Realiza un ataque a un objetivo
   * @param {Entity} target - Objetivo del ataque
   * @returns {number} Daño causado
   */
  attack(target) {
    if (!target || !target.isActive() || this.actionCooldown > 0) return 0;
    
    // Calcular daño
    const damage = this.stats.attack;
    
    // Aplicar daño
    const actualDamage = target.takeDamage(damage, this);
    
    // Cambiar estado y resetear cooldown
    this.setState('attacking');
    
    return actualDamage;
  }

  /**
   * Deja caer recompensas al morir
   * @returns {Array} Objetos dejados
   */
  dropLoot() {
    // En el futuro, se implementará un sistema de loot más complejo
    const loot = [];
    
    // Por ahora, solo registramos la experiencia y oro que dará
    if (this.stats.experience > 0 || this.stats.gold > 0) {
      loot.push({
        type: 'reward',
        experience: this.stats.experience,
        gold: this.stats.gold
      });
    }
    
    return loot;
  }
}