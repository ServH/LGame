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
  // Extensiones para Enemy.js

/**
 * Configura el sprite y efectos visuales según el tipo de enemigo
 * @param {string} enemyType - Tipo de enemigo
 */
setupVisuals(enemyType = 'default') {
  // Limpiar sprite anterior si existe
  if (this.sprite) {
    this.sprite.destroy();
  }

  // Configuración según tipo
  switch (enemyType) {
    case 'slime':
      // Sprite básico (rectángulo redondeado verde)
      this.sprite = this.scene.add.graphics();
      this.sprite.fillStyle(0x55ff55, 1);
      this.sprite.fillRoundedRect(-8, -6, 16, 12, 6);
      
      // Ojos simples
      this.sprite.fillStyle(0x000000, 1);
      this.sprite.fillCircle(-3, -2, 1.5);
      this.sprite.fillCircle(3, -2, 1.5);
      
      // Animación de rebote constante
      this.scene.tweens.add({
        targets: this.sprite,
        scaleY: 0.85,
        scaleX: 1.15,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      break;
      
    case 'goblin':
      // Sprite más detallado
      this.sprite = this.scene.add.container(0, 0);
      
      // Cuerpo principal
      const body = this.scene.add.rectangle(0, 0, 12, 14, 0x77cc77);
      this.sprite.add(body);
      
      // Cabeza
      const head = this.scene.add.circle(0, -9, 6, 0x77cc77);
      this.sprite.add(head);
      
      // Ojos
      const leftEye = this.scene.add.circle(-2, -10, 1.5, 0xff0000);
      const rightEye = this.scene.add.circle(2, -10, 1.5, 0xff0000);
      this.sprite.add(leftEye);
      this.sprite.add(rightEye);
      
      // Arma simple
      const weapon = this.scene.add.rectangle(8, 0, 6, 2, 0x8B4513);
      this.sprite.add(weapon);
      
      // Animación de nerviosismo
      this.scene.tweens.add({
        targets: this.sprite,
        x: 1,
        duration: 200,
        yoyo: true,
        repeat: -1
      });
      break;
      
    case 'skeleton':
      // Sprite esquelético
      this.sprite = this.scene.add.container(0, 0);
      
      // Cuerpo principal
      const skeletonBody = this.scene.add.rectangle(0, 0, 12, 16, 0xdddddd);
      this.sprite.add(skeletonBody);
      
      // Cráneo
      const skull = this.scene.add.circle(0, -10, 6, 0xffffff);
      this.sprite.add(skull);
      
      // Ojos huecos
      const leftSocket = this.scene.add.circle(-2, -10, 1.5, 0x000000);
      const rightSocket = this.scene.add.circle(2, -10, 1.5, 0x000000);
      this.sprite.add(leftSocket);
      this.sprite.add(rightSocket);
      
      // Costillas (líneas)
      for (let i = -4; i <= 4; i += 2) {
        const rib = this.scene.add.line(0, i, -5, 0, 5, 0, 0xffffff);
        this.sprite.add(rib);
      }
      
      // Animación de balanceo lento
      this.scene.tweens.add({
        targets: this.sprite,
        angle: { from: -3, to: 3 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      break;
      
    case 'bat':
      // Sprite de murciélago
      this.sprite = this.scene.add.container(0, 0);
      
      // Cuerpo
      const batBody = this.scene.add.circle(0, 0, 5, 0x555555);
      this.sprite.add(batBody);
      
      // Alas
      const leftWing = this.scene.add.triangle(-3, 0, 0, 0, -12, -8, -12, 8, 0x555555);
      const rightWing = this.scene.add.triangle(3, 0, 0, 0, 12, -8, 12, 8, 0x555555);
      this.sprite.add(leftWing);
      this.sprite.add(rightWing);
      
      // Ojos
      const batLeftEye = this.scene.add.circle(-2, -1, 1, 0xff0000);
      const batRightEye = this.scene.add.circle(2, -1, 1, 0xff0000);
      this.sprite.add(batLeftEye);
      this.sprite.add(batRightEye);
      
      // Animación de aleteo
      this.scene.tweens.add({
        targets: [leftWing, rightWing],
        scaleX: 0.7,
        scaleY: 0.8,
        duration: 200,
        yoyo: true,
        repeat: -1
      });
      
      // Animación de flotación
      this.scene.tweens.add({
        targets: this.sprite,
        y: { from: 0, to: -3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      break;
      
    case 'spider':
      // Sprite de araña
      this.sprite = this.scene.add.container(0, 0);
      
      // Cuerpo
      const spiderBody = this.scene.add.circle(0, 0, 6, 0x000000);
      this.sprite.add(spiderBody);
      
      // Patas (8)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const legX = Math.cos(angle) * 8;
        const legY = Math.sin(angle) * 8;
        
        const leg = this.scene.add.line(0, 0, 0, 0, legX, legY, 0x000000);
        leg.setLineWidth(1.5);
        this.sprite.add(leg);
        
        // Animación individual de cada pata
        this.scene.tweens.add({
          targets: leg,
          rotation: { from: -0.1, to: 0.1 },
          duration: 300 + i * 50,
          yoyo: true,
          repeat: -1
        });
      }
      
      // Ojos (varios puntos)
      for (let i = -2; i <= 2; i += 2) {
        const eyeLeft = this.scene.add.circle(i - 0.5, -3, 0.8, 0xff0000);
        const eyeRight = this.scene.add.circle(i + 0.5, -3, 0.8, 0xff0000);
        this.sprite.add(eyeLeft);
        this.sprite.add(eyeRight);
      }
      break;
      
    case 'wolf':
      // Sprite de lobo
      this.sprite = this.scene.add.container(0, 0);
      
      // Cuerpo
      const wolfBody = this.scene.add.rectangle(0, 0, 16, 10, 0x777777);
      this.sprite.add(wolfBody);
      
      // Cabeza
      const wolfHead = this.scene.add.rectangle(8, 0, 10, 8, 0x777777);
      this.sprite.add(wolfHead);
      
      // Orejas
      const ear1 = this.scene.add.triangle(10, -6, 0, 0, 3, -4, -3, -4, 0x777777);
      const ear2 = this.scene.add.triangle(13, -6, 0, 0, 3, -4, -3, -4, 0x777777);
      this.sprite.add(ear1);
      this.sprite.add(ear2);
      
      // Ojos
      const wolfEye = this.scene.add.circle(10, -1, 1.5, 0xffff00);
      this.sprite.add(wolfEye);
      
      // Cola
      const tail = this.scene.add.rectangle(-10, -2, 8, 3, 0x777777);
      tail.setOrigin(0, 0.5);
      this.sprite.add(tail);
      
      // Animación de cola
      this.scene.tweens.add({
        targets: tail,
        rotation: { from: -0.2, to: 0.2 },
        duration: 600,
        yoyo: true,
        repeat: -1
      });
      break;
      
    case 'troll':
      // Sprite de troll grande
      this.sprite = this.scene.add.container(0, 0);
      
      // Cuerpo corpulento
      const trollBody = this.scene.add.rectangle(0, 0, 18, 20, 0x55aa55);
      this.sprite.add(trollBody);
      
      // Cabeza
      const trollHead = this.scene.add.circle(0, -14, 8, 0x55aa55);
      this.sprite.add(trollHead);
      
      // Ojos pequeños
      const trollEyeLeft = this.scene.add.circle(-3, -15, 1.5, 0xff0000);
      const trollEyeRight = this.scene.add.circle(3, -15, 1.5, 0xff0000);
      this.sprite.add(trollEyeLeft);
      this.sprite.add(trollEyeRight);
      
      // Boca
      const trollMouth = this.scene.add.rectangle(0, -11, 8, 2, 0x000000);
      this.sprite.add(trollMouth);
      
      // Brazos grandes
      const arm1 = this.scene.add.rectangle(-12, -5, 6, 12, 0x55aa55);
      const arm2 = this.scene.add.rectangle(12, -5, 6, 12, 0x55aa55);
      this.sprite.add(arm1);
      this.sprite.add(arm2);
      
      // Animación de respiración pesada
      this.scene.tweens.add({
        targets: trollBody,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 0.95 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      break;
      
    case 'ghost':
      // Sprite fantasmal semitransparente
      this.sprite = this.scene.add.container(0, 0);
      
      // Forma base del fantasma
      const ghostBody = this.scene.add.graphics();
      ghostBody.fillStyle(0xccccff, 0.7);
      ghostBody.fillCircle(0, 0, 10);
      ghostBody.fillRect(-10, 0, 20, 12);
      
      // Ondulaciones en la parte inferior
      for (let i = -8; i <= 8; i += 4) {
        ghostBody.fillCircle(i, 12, 4);
      }
      
      this.sprite.add(ghostBody);
      
      // Ojos
      const ghostEyeLeft = this.scene.add.circle(-4, -2, 2, 0x000000);
      const ghostEyeRight = this.scene.add.circle(4, -2, 2, 0x000000);
      this.sprite.add(ghostEyeLeft);
      this.sprite.add(ghostEyeRight);
      
      // Animación de fluctuación
      this.scene.tweens.add({
        targets: this.sprite,
        y: { from: 0, to: -4 },
        alpha: { from: 0.7, to: 1 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      break;
      
    default:
      // Sprite genérico para tipos no implementados
      this.sprite = this.scene.add.rectangle(0, 0, 14, 14, 0xff5555);
      break;
  }
  
  // Añadir al contenedor
  this.add(this.sprite);
  
  // Configuración para jefes (si aplica)
  if (this.isBoss) {
    this.setupBossVisuals();
  }
}

/**
 * Configura visuales especiales para jefes
 */
setupBossVisuals() {
  if (!this.sprite) return;
  
  // Aumentar tamaño
  this.sprite.setScale(1.5);
  
  // Aura de poder
  const aura = this.scene.add.graphics();
  aura.fillStyle(0xffff00, 0.2);
  aura.fillCircle(0, 0, 25);
  this.add(aura);
  
  // Pulsación del aura
  this.scene.tweens.add({
    targets: aura,
    alpha: { from: 0.2, to: 0.4 },
    scale: { from: 1, to: 1.1 },
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
  
  // Corona o indicador de jefe
  const crown = this.scene.add.graphics();
  crown.fillStyle(0xffcc00, 1);
  
  // Dibujar corona
  crown.moveTo(-8, -22);
  crown.lineTo(8, -22);
  crown.lineTo(10, -18);
  crown.lineTo(6, -20);
  crown.lineTo(2, -18);
  crown.lineTo(-2, -20);
  crown.lineTo(-6, -18);
  crown.lineTo(-10, -20);
  crown.closePath();
  crown.fill();
  
  this.add(crown);
  
  // Texto de jefe
  const bossText = this.scene.add.text(0, -30, 'JEFE', {
    font: 'bold 10px Arial',
    fill: '#ff0000'
  });
  bossText.setOrigin(0.5);
  this.add(bossText);
}

/**
 * Realiza un ataque mejorado visualmente
 * @param {Entity} target - Objetivo del ataque
 * @returns {number} Daño causado
 */
attack(target) {
  if (!target || !target.isActive() || this.actionCooldown > 0) return 0;
  
  // Usar el sistema de combate si existe
  if (this.scene.combatSystem) {
    return this.scene.combatSystem.performAttack(this, target);
  }
  
  // Fallback al comportamiento básico
  const damage = this.stats.attack;
  const result = target.takeDamage(damage, this);
  
  // Efectos visuales mejorados según tipo de enemigo
  this.playAttackAnimation(target);
  
  return result;
}

/**
 * Reproduce una animación de ataque específica según el tipo de enemigo
 * @param {Entity} target - Objetivo del ataque
 */
playAttackAnimation(target) {
  if (!target || !this.sprite) return;
  
  // Animaciones específicas por tipo
  switch (this.enemyType) {
    case 'slime':
      // Ataque de rebote
      this.scene.tweens.add({
        targets: this,
        y: this.y - 20,
        scaleY: 0.5,
        scaleX: 1.3,
        duration: 300,
        yoyo: true,
        onComplete: () => {
          // Efecto de impacto
          if (this.scene.combatEffectsSystem) {
            this.scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.8, color: 0x55ff55 }
            );
          }
        }
      });
      break;
      
    case 'goblin':
      // Ataque rápido con arma
      const startX = this.x;
      
      // Movimiento hacia el objetivo
      this.scene.tweens.add({
        targets: this,
        x: target.x - 20,
        duration: 200,
        onComplete: () => {
          // Flash de ataque
          if (this.sprite) {
            this.scene.tweens.add({
              targets: this.sprite,
              angle: 15,
              duration: 100,
              yoyo: true
            });
          }
          
          // Efecto de impacto
          if (this.scene.combatEffectsSystem) {
            this.scene.combatEffectsSystem.createAttackEffect(this, target, {
              color: 0x77cc77
            });
          }
          
          // Volver a posición
          this.scene.tweens.add({
            targets: this,
            x: startX,
            duration: 200
          });
        }
      });
      break;
      
    case 'skeleton':
      // Ataque con hueso (proyectil)
      const bone = this.scene.add.rectangle(
        this.x, 
        this.y, 
        6, 
        2, 
        0xffffff
      );
      
      // Lanzar hueso
      this.scene.tweens.add({
        targets: bone,
        x: target.x,
        y: target.y,
        rotation: 10,
        duration: 400,
        onComplete: () => {
          bone.destroy();
          
          // Efecto de impacto
          if (this.scene.combatEffectsSystem) {
            this.scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.7, color: 0xffffff }
            );
          }
        }
      });
      break;
      
    case 'bat':
      // Ataque rápido volando
      const originalX = this.x;
      const originalY = this.y;
      
      // Movimiento hacia el objetivo
      this.scene.tweens.add({
        targets: this,
        x: target.x,
        y: target.y - 10,
        duration: 300,
        onComplete: () => {
          // Efecto de mordisco
          if (this.scene.combatEffectsSystem) {
            this.scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.6, color: 0xaa5555 }
            );
          }
          
          // Volver a posición
          this.scene.tweens.add({
            targets: this,
            x: originalX,
            y: originalY,
            duration: 300
          });
        }
      });
      break;
      
    case 'spider':
      // Ataque con telaraña
      const webLine = this.scene.add.line(
        0, 0,
        this.x, this.y,
        target.x, target.y,
        0xffffff, 0.7
      );
      webLine.setLineWidth(1);
      webLine.setOrigin(0, 0);
      
      // Animar telaraña
      this.scene.tweens.add({
        targets: webLine,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          webLine.destroy();
        }
      });
      
      // Flash en el objetivo
      this.scene.tweens.add({
        targets: target.sprite,
        alpha: 0.7,
        duration: 100,
        yoyo: true,
        repeat: 2
      });
      break;
      
    case 'ghost':
      // Ataque fantasmal
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.3,
        duration: 200,
        onComplete: () => {
          // Teletransportar cerca del objetivo
          this.x = target.x + (Math.random() > 0.5 ? 15 : -15);
          this.y = target.y;
          
          // Efecto de ataque
          if (this.scene.combatEffectsSystem) {
            this.scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.9, color: 0xccccff }
            );
          }
          
          // Volver a visible
          this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.7,
            duration: 300
          });
        }
      });
      break;
      
    case 'wolf':
      // Ataque de lobo (embestida)
      const startPos = { x: this.x, y: this.y };
      
      // Preparación (agacharse)
      this.scene.tweens.add({
        targets: this.sprite,
        y: 3,
        scaleY: 0.8,
        duration: 200,
        onComplete: () => {
          // Embestida rápida
          this.scene.tweens.add({
            targets: this,
            x: target.x - 10,
            duration: 150,
            onComplete: () => {
              // Efecto de mordisco
              if (this.scene.combatEffectsSystem) {
                this.scene.combatEffectsSystem.createAttackEffect(this, target, {
                  color: 0x777777
                });
              }
              
              // Volver a posición
              this.scene.tweens.add({
                targets: [this, this.sprite],
                x: startPos.x,
                y: startPos.y,
                scaleY: 1,
                duration: 400
              });
            }
          });
        }
      });
      break;
      
    case 'troll':
      // Ataque de troll (golpe fuerte)
      
      // Retroceder para tomar impulso
      this.scene.tweens.add({
        targets: this,
        x: this.x - 10,
        duration: 200,
        onComplete: () => {
          // Animar brazo
          if (this.sprite.list && this.sprite.list.length > 4) {
            const arm = this.sprite.list[4]; // Brazo derecho
            this.scene.tweens.add({
              targets: arm,
              angle: 45,
              x: 15,
              duration: 100,
              yoyo: true
            });
          }
          
          // Avanzar con el golpe
          this.scene.tweens.add({
            targets: this,
            x: target.x - 20,
            duration: 200,
            onComplete: () => {
              // Efecto de impacto fuerte
              if (this.scene.combatEffectsSystem) {
                this.scene.combatEffectsSystem.createImpact(
                  target.x, 
                  target.y, 
                  { size: 1.2, color: 0x55aa55, particles: 12 }
                );
                
                // Sacudir la pantalla
                this.scene.cameras.main.shake(100, 0.01);
              }
              
              // Volver a posición original lentamente
              this.scene.tweens.add({
                targets: this,
                x: this.x + 10,
                duration: 400
              });
            }
          });
        }
      });
      break;
      
    default:
      // Ataque básico para otros tipos
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          // Línea de ataque simple
          const line = this.scene.add.line(
            0, 0,
            this.x, this.y,
            target.x, target.y,
            0xff0000, 0.6
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
      });
      break;
  }
  
  // Si es un jefe, añadir efectos adicionales
  if (this.isBoss) {
    // Efecto de impacto más grande
    this.scene.time.delayedCall(300, () => {
      if (this.scene.combatEffectsSystem) {
        this.scene.combatEffectsSystem.createImpact(
          target.x, 
          target.y, 
          { size: 1.5, color: 0xff0000, particles: 15 }
        );
      }
      
      // Pequeño temblor de pantalla
      this.scene.cameras.main.shake(150, 0.008);
    });
  }
}

// Extensiones para CombatEffectsSystem.js

/**
 * Crea un efecto de daño crítico especial
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 */
createCriticalEffect(x, y) {
  // Destello crítico
  const critFlash = this.scene.add.graphics();
  critFlash.fillStyle(0xff0000, 0.4);
  critFlash.fillCircle(x, y, 30);
  
  // Desvanecer rápidamente
  this.scene.tweens.add({
    targets: critFlash,
    alpha: 0,
    scale: 1.5,
    duration: 300,
    onComplete: () => {
      critFlash.destroy();
    }
  });
  
  // Texto de crítico
  const critText = this.scene.add.text(x, y - 25, '¡CRÍTICO!', {
    font: 'bold 16px Arial',
    fill: '#ff0000',
    stroke: '#000000',
    strokeThickness: 4
  });
  critText.setOrigin(0.5);
  
  // Animar texto
  this.scene.tweens.add({
    targets: critText,
    y: y - 50,
    alpha: 0,
    scale: 1.2,
    duration: 800,
    onComplete: () => {
      critText.destroy();
    }
  });
  
  // Pequeño temblor de pantalla
  this.scene.cameras.main.shake(100, 0.005);
}
}