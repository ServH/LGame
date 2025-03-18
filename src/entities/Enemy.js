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
      gold: 1,
      critChance: 0.03,     // 3% de crítico
      critMultiplier: 1.3,  // 30% daño extra en críticos
      level: 1              // Nivel del enemigo
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
    
    // Comportamiento
    this.behaviors = [];
    this.setupBehaviors();
    
    // Estado de alerta
    this.isAlerted = false;
    this.alertDuration = 0;
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
    
    // Añadir efectos específicos según enemigo
    this.addEnemyEffects();
  }

  /**
   * Añade efectos visuales especiales según tipo de enemigo
   */
  addEnemyEffects() {
    switch (this.enemyType) {
      case 'slime':
        // Animación de rebote
        this.scene.tweens.add({
          targets: this.sprite,
          scaleY: 0.8,
          scaleX: 1.2,
          yoyo: true,
          duration: 1000,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;
        
      case 'skeleton':
        // Oscilación sutil
        this.scene.tweens.add({
          targets: this.sprite,
          angle: 5,
          yoyo: true,
          duration: 1200,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;
        
      case 'goblin':
        // Movimiento nervioso
        this.scene.tweens.add({
          targets: this.sprite,
          x: 2,
          y: 1,
          yoyo: true,
          duration: 300,
          repeat: -1
        });
        break;
    }
  }

  /**
   * Configura los comportamientos disponibles del enemigo
   */
  setupBehaviors() {
    // Comportamientos básicos según tipo
    switch (this.enemyType) {
      case 'slime':
        this.behaviors.push({
          name: 'bounceAttack',
          cooldown: 3000,
          currentCooldown: 0,
          execute: (target) => {
            // Ataque con rebote - hace daño extra
            if (!target || !target.isActive()) return false;
            
            // Animación de carga
            this.scene.tweens.add({
              targets: this.sprite,
              scaleY: 0.6,
              scaleX: 1.4,
              duration: 300,
              onComplete: () => {
                // Animación de salto
                this.scene.tweens.add({
                  targets: this,
                  y: this.y - 20,
                  duration: this.inCombat ? 150 : 300,
                  yoyo: true,
                  onComplete: () => {
                    // Atacar al llegar
                    if (this.inCombat && target.isActive()) {
                      // 20% daño extra
                      const damage = this.stats.attack * 1.2;
                      target.takeDamage(damage, this);
                      
                      // Efecto visual si existe el sistema
                      if (this.scene.combatEffectsSystem) {
                        this.scene.combatEffectsSystem.createImpact(target.x, target.y, {
                          size: 0.8,
                          color: 0x55ff55
                        });
                      }
                    }
                  }
                });
              }
            });
            
            return true;
          }
        });
        break;
        
      case 'skeleton':
        this.behaviors.push({
          name: 'boneThrow',
          cooldown: 5000,
          currentCooldown: 2000, // Espera inicial
          execute: (target) => {
            // Lanza un proyectil
            if (!target || !target.isActive()) return false;
            
            // Crear proyectil
            const projectile = this.scene.add.circle(this.x, this.y, 4, 0xffffff);
            
            // Calcular dirección hacia el objetivo
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const vx = dx / distance;
            const vy = dy / distance;
            
            // Animar proyectil
            this.scene.tweens.add({
              targets: projectile,
              x: target.x,
              y: target.y,
              duration: 500,
              onComplete: () => {
                // Impacto
                projectile.destroy();
                
                if (target.isActive()) {
                  // Hacer daño (algo menos que ataque normal)
                  target.takeDamage(this.stats.attack * 0.8, this);
                  
                  // Efecto visual
                  if (this.scene.combatEffectsSystem) {
                    this.scene.combatEffectsSystem.createImpact(target.x, target.y, {
                      size: 0.6,
                      color: 0xaaaaaa
                    });
                  }
                }
              }
            });
            
            return true;
          }
        });
        break;
        
      case 'goblin':
        this.behaviors.push({
          name: 'quickStrike',
          cooldown: 4000,
          currentCooldown: 1000, // Espera inicial
          execute: (target) => {
            // Ataque rápido doble
            if (!target || !target.isActive()) return false;
            
            // Primer golpe
            this.scene.tweens.add({
              targets: this,
              x: target.x - 10,
              y: target.y,
              duration: 200,
              onComplete: () => {
                if (target.isActive()) {
                  target.takeDamage(this.stats.attack * 0.6, this);
                  
                  // Segundo golpe después de un breve delay
                  this.scene.time.delayedCall(300, () => {
                    if (this.isActive() && target.isActive()) {
                      target.takeDamage(this.stats.attack * 0.6, this);
                      
                      // Efecto visual
                      if (this.scene.combatEffectsSystem) {
                        this.scene.combatEffectsSystem.createAttackEffect(this, target, {
                          color: 0x77cc77
                        });
                      }
                    }
                  });
                }
              }
            });
            
            return true;
          }
        });
        break;
    }
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
        this.sprite.setTint(0xffffff);
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
    this.sprite.setTint(0xff9999);
    
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