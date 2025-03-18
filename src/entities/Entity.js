// src/entities/Entity.js
import Phaser from 'phaser';

export default class Entity extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats = {}) {
    super(scene, x, y);
    
    // ID único para la entidad
    this.id = `entity_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Añadir a la escena
    scene.add.existing(this);
    
    // Propiedades base
    this.type = 'entity';
    this.active = true;
    
    // Componente visual (sprite placeholder)
    this.sprite = scene.add.rectangle(0, 0, 16, 16, 0xffffff);
    this.add(this.sprite);
    
    // Estadísticas por defecto
    this._stats = {
      health: 10,
      maxHealth: 10,
      attack: 1,
      defense: 0,
      speed: 1,
      level: 1,
      experience: 0,
      gold: 0,
      critChance: 0.05,    // 5% probabilidad crítico
      critMultiplier: 1.5, // 50% daño extra en críticos
      ...stats
    };
    
    // Barra de vida
    this.createHealthBar();
    
    // Estado actual
    this.state = 'idle'; // idle, moving, attacking, damaged, dead
    this.lastStateChange = 0;
    
    // Temporizadores y cooldowns
    this.actionCooldown = 0;
    this.statusEffects = [];
    
    // Animación idle
    this.startIdleAnimation();
  }

  /**
   * Crea la barra de vida
   */
  createHealthBar() {
    this.healthBar = this.scene.add.rectangle(0, -12, 16, 3, 0x00ff00);
    this.healthBarBg = this.scene.add.rectangle(0, -12, 16, 3, 0xff0000);
    this.healthBarBg.setOrigin(0.5, 0.5);
    this.healthBar.setOrigin(0, 0.5);
    this.healthBar.x = -8; // Ajustar posición para que comience desde la izquierda
    this.add(this.healthBarBg);
    this.add(this.healthBar);
    
    // Ocultar inicialmente si está a full vida
    const healthRatio = this._stats.health / this._stats.maxHealth || 1;
    this.healthBar.visible = healthRatio < 1;
    this.healthBarBg.visible = healthRatio < 1;
  }

  /**
   * Inicia una animación idle simple
   */
  startIdleAnimation() {
    // Animación suave de flotación
    this.scene.tweens.add({
      targets: this,
      y: this.y - 2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Obtiene las estadísticas de la entidad
   * @returns {Object} Estadísticas
   */
  get stats() {
    return this._stats;
  }

  /**
   * Actualiza el estado de la entidad
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    // Actualizar cooldowns
    if (this.actionCooldown > 0) {
      this.actionCooldown -= delta;
    }
    
    // Actualizar efectos de estado
    this.updateStatusEffects(delta);
    
    // Actualizar la barra de vida
    this.updateHealthBar();
  }

  /**
   * Actualiza los efectos de estado activos
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  updateStatusEffects(delta) {
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const effect = this.statusEffects[i];
      
      // Reducir duración
      effect.duration -= delta;
      
      // Aplicar efecto por tick
      if (effect.onTick) {
        effect.onTick(this, delta);
      }
      
      // Eliminar si expiró
      if (effect.duration <= 0) {
        if (effect.onEnd) {
          effect.onEnd(this);
        }
        this.statusEffects.splice(i, 1);
      }
    }
  }

  /**
   * Actualiza la visualización de la barra de vida
   */
  updateHealthBar() {
    const healthRatio = Math.max(0, this._stats.health / this._stats.maxHealth);
    this.healthBar.width = 16 * healthRatio;
    
    // Ocultar barra si está a full vida
    this.healthBar.visible = healthRatio < 1 && healthRatio > 0;
    this.healthBarBg.visible = healthRatio < 1 && healthRatio > 0;
  }

  /**
   * Cambia el estado de la entidad
   * @param {string} newState - Nuevo estado
   */
  setState(newState) {
    if (this.state === newState) return;
    
    // Guardar estado anterior para referencias
    const previousState = this.state;
    
    this.state = newState;
    this.lastStateChange = this.scene.time.now;
    
    // Detener animaciones anteriores si es necesario
    this.scene.tweens.killTweensOf(this.sprite);
    
    // Comportamiento específico según estado
    switch (newState) {
      case 'idle':
        // Resetear animaciones o comportamientos
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1,
          scaleY: 1,
          duration: 200
        });
        break;
        
      case 'moving':
        // Efecto sutil de movimiento
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.1,
          scaleY: 0.9,
          duration: 200,
          yoyo: true,
          repeat: 1
        });
        break;
        
      case 'attacking':
        // Animación de ataque (estirarse hacia el objetivo)
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.3,
          scaleY: 0.9,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            // Volver al estado anterior después de la animación
            if (this.state === 'attacking') {
              this.setState(previousState === 'attacking' ? 'idle' : previousState);
            }
          }
        });
        
        // Establecer cooldown basado en velocidad
        this.actionCooldown = 1000 / this._stats.speed;
        break;
        
      case 'damaged':
        // Mostrar daño recibido
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            // Volver al estado anterior
            if (this.state === 'damaged') {
              this.setState(previousState === 'damaged' ? 'idle' : previousState);
            }
          }
        });
        break;
        
      case 'dead':
        // Animación de muerte
        this.active = false;
        
        // Flash y desvanecimiento
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0,
          scaleY: 0,
          duration: 500,
          onComplete: () => {
            // Crear efecto de muerte si existe el sistema
            if (this.scene.combatEffectsSystem) {
              this.scene.combatEffectsSystem.createDeathEffect(this);
            }
            
            // Destruir después de un pequeño delay
            this.scene.time.delayedCall(300, () => {
              this.destroy();
            });
          }
        });
        break;
    }
    
    // Emitir evento de cambio de estado
    this.scene.events.emit('entity-state-changed', this, newState, previousState);
  }

  /**
   * Aplica daño a la entidad
   * @param {number} amount - Cantidad de daño
   * @param {Entity} source - Fuente del daño
   * @returns {Object} Información del daño aplicado
   */
  takeDamage(amount, source) {
    if (this.state === 'dead') return { damage: 0, isCritical: false };
    
    // Determinar si es un golpe crítico
    const isCritical = source && source.stats.critChance > Math.random();
    
    // Calcular daño real basado en defensa
    const defense = this._stats.defense || 0;
    let actualDamage = Math.max(1, amount - defense);
    
    // Aplicar multiplicador de crítico
    if (isCritical && source) {
      actualDamage = Math.floor(actualDamage * (source.stats.critMultiplier || 1.5));
    }
    
    // Aplicar daño
    this._stats.health = Math.max(0, this._stats.health - actualDamage);
    
    // Cambiar estado
    this.setState('damaged');
    
    // Comprobar si ha muerto
    if (this._stats.health <= 0) {
      this.die(source);
    }
    
    // Crear efecto visual de daño si existe el sistema
    if (this.scene.combatSystem) {
      this.scene.combatSystem.showDamageNumber(this.x, this.y, actualDamage, isCritical);
    }
    
    return { 
      damage: actualDamage, 
      isCritical, 
      killed: this._stats.health <= 0 
    };
  }

  /**
   * Muestra texto de daño flotante
   * @param {number} amount - Cantidad de daño
   * @deprecated Usar CombatSystem.showDamageNumber en su lugar
   */
  showDamageText(amount) {
    // Método mantenido por compatibilidad
    if (this.scene.combatSystem) {
      this.scene.combatSystem.showDamageNumber(this.x, this.y, amount, false);
      return;
    }
    
    // Comportamiento legacy
    const damageText = this.scene.add.text(this.x, this.y - 20, `-${amount}`, {
      font: '14px Arial',
      fill: '#ff0000'
    });
    damageText.setOrigin(0.5, 0.5);
    
    // Animación de desvanecimiento
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        damageText.destroy();
      }
    });
  }

  /**
   * Maneja la muerte de la entidad
   * @param {Entity} killer - Entidad que causó la muerte
   */
  die(killer) {
    this.setState('dead');
    
    // Dar experiencia al jugador si es un enemigo
    if (killer && killer.type === 'player' && this.type === 'enemy') {
      killer.addExperience(this._stats.experience || 0);
      killer.addGold(this._stats.gold || 0);
      
      // Posible drop de objeto
      if (this.scene.combatSystem) {
        this.scene.combatSystem.grantCombatRewards(killer, this);
      }
    }
    
    // Evento de muerte
    this.scene.events.emit('entity-died', this, killer);
  }

  /**
   * Cura a la entidad
   * @param {number} amount - Cantidad de curación
   * @returns {number} Curación real aplicada
   */
  heal(amount) {
    const oldHealth = this._stats.health;
    this._stats.health = Math.min(this._stats.maxHealth, this._stats.health + amount);
    const actualHeal = this._stats.health - oldHealth;
    
    if (actualHeal > 0) {
      // Efecto visual de curación
      if (this.scene.combatEffectsSystem) {
        this.scene.combatEffectsSystem.createHealEffect(this, actualHeal);
      } else {
        // Comportamiento legacy
        const healText = this.scene.add.text(this.x, this.y - 20, `+${actualHeal}`, {
          font: '14px Arial',
          fill: '#00ff00'
        });
        healText.setOrigin(0.5, 0.5);
        
        // Animación de desvanecimiento
        this.scene.tweens.add({
          targets: healText,
          y: healText.y - 30,
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            healText.destroy();
          }
        });
      }
    }
    
    return actualHeal;
  }

  /**
   * Añade un efecto de estado
   * @param {Object} effect - Efecto a añadir
   */
  addStatusEffect(effect) {
    // Verificar si ya existe un efecto similar
    const existingIndex = this.statusEffects.findIndex(e => e.id === effect.id);
    
    if (existingIndex >= 0) {
      // Actualizar duración si ya existe
      this.statusEffects[existingIndex].duration = Math.max(
        this.statusEffects[existingIndex].duration,
        effect.duration
      );
    } else {
      // Añadir nuevo efecto
      this.statusEffects.push({...effect});
      
      // Ejecutar callback de inicio
      if (effect.onStart) {
        effect.onStart(this);
      }
      
      // Crear efecto visual si existe el sistema
      if (this.scene.combatEffectsSystem && effect.visualType) {
        this.scene.combatEffectsSystem.createStatusEffect(
          this, 
          effect.visualType, 
          effect.duration
        );
      }
    }
    
    // Notificar
    this.scene.events.emit('entity-status-effect-added', this, effect);
  }

  /**
   * Quita un efecto de estado
   * @param {string} effectId - ID del efecto a eliminar
   * @returns {boolean} - Si se eliminó correctamente
   */
  removeStatusEffect(effectId) {
    const index = this.statusEffects.findIndex(e => e.id === effectId);
    if (index === -1) return false;
    
    const effect = this.statusEffects[index];
    
    // Ejecutar callback de finalización
    if (effect.onEnd) {
      effect.onEnd(this);
    }
    
    // Eliminar de la lista
    this.statusEffects.splice(index, 1);
    
    // Notificar
    this.scene.events.emit('entity-status-effect-removed', this, effect);
    
    return true;
  }

  /**
   * Verifica si la entidad está activa
   * @returns {boolean} Estado de actividad
   */
  isActive() {
    return this.active && this._stats.health > 0;
  }
}