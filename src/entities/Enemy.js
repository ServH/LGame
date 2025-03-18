// src/entities/enemy/Enemy.js
import Entity from './Entity';

/**
 * Clase que representa un enemigo en el juego
 * La lógica principal se ha movido a EnemyTypes, EnemyVisuals y EnemyBehaviors
 */
export default class Enemy extends Entity {
  /**
   * Crea una nueva instancia de enemigo
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} type - Tipo de enemigo
   * @param {Object} stats - Estadísticas del enemigo
   */
  constructor(scene, x, y, type = 'default', stats = {}) {
    // Las estadísticas se manejan ahora desde EnemyFactory
    super(scene, x, y, stats);
    
    // Propiedades específicas del enemigo
    this.type = 'enemy';
    this.enemyType = type;
    
    // Estado de combate
    this.inCombat = false;
    this.targetPlayer = null;
    this.aggroRange = stats.aggroRange || 100;
    
    // Comportamiento
    this.behaviors = [];
    
    // Estado de alerta
    this.isAlerted = false;
    this.alertDuration = 0;
    
    // Propiedades de jefe
    this.isBoss = false;
    this.bossType = null;
    
    // Propiedades de grupo
    this.groupId = null;
    this.isGroupLeader = false;
    this.minionOf = null;
  }

  /**
   * Actualiza el enemigo
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    super.update(delta);
    
    // Si está en alerta, reducir duración
    if (this.isAlerted) {
      this.alertDuration -= delta;
      if (this.alertDuration <= 0) {
        this.isAlerted = false;
        
        // Restaurar estado visual normal
        if (this.sprite) {
          this.sprite.clearTint();
        }
      }
    }
    
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
        // Determinar si usar comportamiento especial o ataque normal
        const specialBehavior = this.getReadyBehavior();
        
        if (specialBehavior) {
          specialBehavior.execute(this.targetPlayer);
          specialBehavior.currentCooldown = specialBehavior.cooldown;
          this.actionCooldown = 1000 / this.stats.speed;
        } else {
          this.attack(this.targetPlayer);
        }
      }
      
      // Actualizar cooldowns de comportamientos
      this.updateBehaviorCooldowns(delta);
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
    
    // Aumentar el rango si está alerta
    const effectiveRange = this.isAlerted ? this.aggroRange * 1.5 : this.aggroRange;
    
    return distance <= effectiveRange ? player : null;
  }

  /**
   * Inicia combate con el jugador
   * @param {Player} player - Jugador objetivo
   */
  startCombat(player) {
    if (!player || !player.isActive()) return;
    
    this.inCombat = true;
    this.targetPlayer = player;
    
    // Cambiar estado visual a alerta
    this.alert(3000); // Alerta por 3 segundos
    
    // También hacer que el jugador entre en combate con este enemigo
    player.startCombat(this);
    
    // Notificar
    this.scene.events.emit('combat-started', player, this);
  }

  /**
   * Pone al enemigo en estado de alerta
   * @param {number} duration - Duración de la alerta en ms
   */
  alert(duration = 5000) {
    this.isAlerted = true;
    this.alertDuration = duration;
    
    // Cambiar visual para mostrar alerta
    if (this.sprite) {
      this.sprite.setTint(0xff9999);
    }
    
    // Notificar a enemigos cercanos (propagación de alerta)
    if (this.scene.entitySystem && this.scene.entitySystem.enemies) {
      const nearbyEnemies = this.scene.entitySystem.enemies.filter(enemy => {
        if (enemy === this || !enemy.isActive()) return false;
        
        const distance = Phaser.Math.Distance.Between(
          this.x, this.y,
          enemy.x, enemy.y
        );
        
        return distance < 100; // Rango de propagación
      });
      
      // Alertar a enemigos cercanos con un pequeño delay
      nearbyEnemies.forEach((enemy, index) => {
        this.scene.time.delayedCall(200 + index * 100, () => {
          enemy.alert(duration - 500); // Menos duración en la propagación
        });
      });
    }
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
    
    // Cambiar estado y resetear cooldown
    this.setState('attacking');
    
    // Si existe el sistema de combate, usar eso
    if (this.scene.combatSystem) {
      return this.scene.combatSystem.performAttack(this, target);
    }
    
    // Comportamiento legacy
    const actualDamage = target.takeDamage(damage, this);
    
    return actualDamage;
  }

  /**
   * Actualiza los cooldowns de los comportamientos especiales
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  updateBehaviorCooldowns(delta) {
    if (!this.behaviors || !this.behaviors.length) return;
    
    this.behaviors.forEach(behavior => {
      if (behavior.currentCooldown > 0) {
        behavior.currentCooldown -= delta;
      }
    });
  }

  /**
   * Obtiene un comportamiento que esté listo para usar
   * @returns {Object|null} Comportamiento disponible o null
   */
  getReadyBehavior() {
    if (!this.behaviors || !this.behaviors.length) return null;
    
    // Probabilidad base de usar comportamiento especial: 30%
    if (Math.random() > 0.3) return null;
    
    // Filtrar comportamientos listos
    const readyBehaviors = this.behaviors.filter(
      behavior => behavior.currentCooldown <= 0
    );
    
    if (readyBehaviors.length === 0) return null;
    
    // Seleccionar uno al azar
    return readyBehaviors[Math.floor(Math.random() * readyBehaviors.length)];
  }

  /**
   * Deja caer recompensas al morir
   * @returns {Array} Objetos dejados
   */
  dropLoot() {
    // Los drops se manejan ahora principalmente en CombatSystem
    // Este método queda para retrocompatibilidad y posibles extensiones
    const loot = [];
    
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