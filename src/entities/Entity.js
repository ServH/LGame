// src/entities/Entity.js
export default class Entity extends Phaser.GameObjects.Container {
    constructor(scene, x, y, stats = {}) {
      super(scene, x, y);
      
      // Añadir a la escena
      scene.add.existing(this);
      
      // Propiedades base
      this.type = 'entity';
      this.active = true;
      
      // Componente visual (sprite placeholder)
      this.sprite = scene.add.rectangle(0, 0, 16, 16, 0xffffff);
      this.add(this.sprite);
      
      // Barra de vida
      this.healthBar = scene.add.rectangle(0, -12, 16, 3, 0x00ff00);
      this.healthBarBg = scene.add.rectangle(0, -12, 16, 3, 0xff0000);
      this.healthBarBg.setOrigin(0.5, 0.5);
      this.healthBar.setOrigin(0, 0.5);
      this.healthBar.x = -8; // Ajustar posición para que comience desde la izquierda
      this.add(this.healthBarBg);
      this.add(this.healthBar);
      
      // Estadísticas por defecto
      this.stats = {
        health: 10,
        maxHealth: 10,
        attack: 1,
        defense: 0,
        speed: 1,
        level: 1,
        experience: 0,
        gold: 0,
        ...stats
      };
      
      // Estado actual
      this.state = 'idle'; // idle, moving, attacking, damaged, dead
      this.lastStateChange = 0;
      
      // Temporizadores y cooldowns
      this.actionCooldown = 0;
      this.statusEffects = [];
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
      const healthRatio = Math.max(0, this.stats.health / this.stats.maxHealth);
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
      
      this.state = newState;
      this.lastStateChange = this.scene.time.now;
      
      // Comportamiento específico según estado
      switch (newState) {
        case 'idle':
          // Resetear animaciones o comportamientos
          break;
        case 'moving':
          // Iniciar animación de movimiento
          break;
        case 'attacking':
          // Iniciar animación de ataque
          this.actionCooldown = 1000 / this.stats.speed;
          break;
        case 'damaged':
          // Mostrar daño recibido
          this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
          });
          break;
        case 'dead':
          // Animación de muerte
          this.active = false;
          this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              this.destroy();
            }
          });
          break;
      }
    }
  
    /**
     * Aplica daño a la entidad
     * @param {number} amount - Cantidad de daño
     * @param {Entity} source - Fuente del daño
     * @returns {number} Daño real aplicado
     */
    takeDamage(amount, source) {
      if (this.state === 'dead') return 0;
      
      // Calcular daño real basado en defensa
      const defense = this.stats.defense || 0;
      const actualDamage = Math.max(1, amount - defense);
      
      // Aplicar daño
      this.stats.health = Math.max(0, this.stats.health - actualDamage);
      
      // Mostrar texto de daño
      this.showDamageText(actualDamage);
      
      // Cambiar estado
      this.setState('damaged');
      
      // Comprobar si ha muerto
      if (this.stats.health <= 0) {
        this.die(source);
      }
      
      return actualDamage;
    }
  
    /**
     * Muestra texto de daño flotante
     * @param {number} amount - Cantidad de daño
     */
    showDamageText(amount) {
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
        killer.addExperience(this.stats.experience || 0);
        killer.addGold(this.stats.gold || 0);
      }
      
      // Evento de muerte
      this.scene.events.emit('entity-died', this, killer);
    }
  
    /**
     * Cura a la entidad
     * @param {number} amount - Cantidad de curación
     */
    heal(amount) {
      const oldHealth = this.stats.health;
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
      const actualHeal = this.stats.health - oldHealth;
      
      if (actualHeal > 0) {
        // Mostrar texto de curación
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
      }
    }
  
    /**
     * Verifica si la entidad está activa
     * @returns {boolean} Estado de actividad
     */
    isActive() {
      return this.active && this.stats.health > 0;
    }
  }