// src/entities/Player.js
import Entity from './Entity';
import PlayerStats from './player/PlayerStats';
import PlayerEquipment from './player/PlayerEquipement';
import PlayerVisuals from './player/PlayerVisuals';
import PlayerAbilities from './player/PlayerAbilities';

/**
 * Clase que representa al jugador en el juego
 * La lógica principal se ha movido a clases especializadas:
 * - PlayerStats: Estadísticas y progresión
 * - PlayerEquipment: Inventario y equipamiento
 * - PlayerVisuals: Representación visual
 * - PlayerAbilities: Habilidades y capacidades
 */
export default class Player extends Entity {
  /**
   * Crea una nueva instancia del jugador
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {Object} stats - Estadísticas iniciales (opcional)
   */
  constructor(scene, x, y, stats = {}) {
    // Inicializar Entity con stats directamente para evitar problemas iniciales
    super(scene, x, y, stats);
    
    // Guardar stats para uso posterior
    this._stats = stats;
    
    try {
      // Inicializar sistemas especializados
      this.statsManager = new PlayerStats(stats);
      this.equipment = new PlayerEquipment(this.statsManager);
      this.abilities = new PlayerAbilities(scene);
      
      // Propiedades específicas del jugador
      this.type = 'player';
      
      // Crear representación visual
      this.sprite = PlayerVisuals.createSprite(scene, this);
      
      // Emisor de partículas para efectos
      this.particleEmitter = PlayerVisuals.createParticleEmitter(scene, this);
      
      // Estado de combate
      this.inCombat = false;
      this.targetEnemy = null;
      this.combatTimer = null;
    } catch (e) {
      console.error("Error al inicializar Player:", e);
      // Asegurar valores por defecto si falla la inicialización
      this.type = 'player';
    }
  }

  /**
   * Actualiza el jugador
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    super.update(delta);
    
    try {
      // Actualizar visuales si están disponibles
      if (PlayerVisuals) {
        PlayerVisuals.updateVisuals(this, this.scene);
      }
      
      // Actualizar cooldowns de habilidades
      if (this.abilities) {
        this.abilities.updateCooldowns(delta);
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
    } catch (e) {
      console.error("Error en Player.update:", e);
    }
  }

/**
 * Sobrescribe la obtención de estadísticas para incluir bonificaciones
 * @returns {Object} Estadísticas con modificadores
 */
get stats() {
  // Version defensiva contra recursión
  if (this._gettingStats) {
    // Prevenir recursión infinita
    console.warn("Detectada recursión en stats getter, devolviendo valores crudos");
    return this._stats || super.stats || {
      health: 20,
      maxHealth: 20,
      attack: 3,
      defense: 1,
      speed: 1.2,
      level: 1,
      experience: 0
    };
  }
  
  // Marcar que estamos en el getter para evitar recursión
  this._gettingStats = true;
  
  let result;
  try {
    // No existe el sistema de estadísticas
    if (!this.statsManager) {
      result = this._stats || super.stats || {
        health: 20,
        maxHealth: 20,
        attack: 3,
        defense: 1,
        speed: 1.2,
        level: 1,
        experience: 0
      };
    } else {
      result = this.statsManager.getStats();
    }
  } catch (e) {
    console.error("Error obteniendo estadísticas:", e);
    result = this._stats || {
      health: 20,
      maxHealth: 20,
      attack: 3,
      defense: 1,
      speed: 1.2,
      level: 1,
      experience: 0
    };
  } finally {
    // Restablecer el indicador después de obtener las estadísticas
    this._gettingStats = false;
  }
  
  return result;
}

  /**
   * Inicia combate con un enemigo
   * @param {Entity} enemy - Enemigo objetivo
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
    if (PlayerVisuals) {
      PlayerVisuals.playStartCombatEffect(this.scene, this);
    }
  }

  /**
   * Realiza un ataque a un objetivo
   * @param {Entity} target - Objetivo del ataque
   * @returns {Object|number} Resultado del ataque o daño causado
   */
  attack(target) {
    if (!target || !target.isActive() || this.actionCooldown > 0) {
      return { damage: 0, isCritical: false, killed: false };
    }
    
    // Cambiar estado y resetear cooldown
    this.setState('attacking');
    
    // Si existe el sistema de combate, usar eso
    if (this.scene.combatSystem) {
      return this.scene.combatSystem.performAttack(this, target);
    }
    
    // Comportamiento legacy
    const damage = this.stats.attack;
    const actualDamage = target.takeDamage(damage, this);
    
    // Efecto visual de ataque
    if (PlayerVisuals) {
      PlayerVisuals.playAttackAnimation(this.scene, this, target);
    }
    
    return actualDamage;
  }

  /**
   * Usa una habilidad
   * @param {string} skillId - ID de la habilidad
   * @param {Object} targetInfo - Información del objetivo
   * @returns {boolean} Si se usó correctamente
   */
  useSkill(skillId, targetInfo = {}) {
    if (!this.abilities) return false;
    return this.abilities.useSkill(skillId, targetInfo, this);
  }

  /**
   * Añade experiencia al jugador
   * @param {number} amount - Cantidad de experiencia
   */
  addExperience(amount) {
    if (amount <= 0) return;
    
    try {
      // Mostrar texto de experiencia
      if (PlayerVisuals) {
        PlayerVisuals.showExperienceText(this.scene, this, amount);
      }
      
      // Añadir experiencia con callback para subida de nivel
      if (this.statsManager) {
        const leveledUp = this.statsManager.addExperience(amount, (level) => {
          // Efecto de subida de nivel
          if (PlayerVisuals) {
            PlayerVisuals.playLevelUpEffect(this.scene, this, level);
          }
          
          // Notificar
          this.scene.events.emit('player-leveled-up', level);
        });
      } else {
        // Fallback si statsManager no está disponible
        this._stats.experience = (this._stats.experience || 0) + amount;
      }
      
      // Notificar ganancia de experiencia
      this.scene.events.emit('player-gained-experience', amount, this.stats.experience);
    } catch (e) {
      console.error("Error al añadir experiencia:", e);
    }
  }

  /**
   * Añade oro al jugador
   * @param {number} amount - Cantidad de oro
   */
  addGold(amount) {
    if (amount <= 0) return;
    
    try {
      // Añadir oro
      if (this.statsManager) {
        this.statsManager.addGold(amount);
      } else {
        // Fallback si statsManager no está disponible
        this._stats.gold = (this._stats.gold || 0) + amount;
      }
      
      // Mostrar texto de oro
      if (PlayerVisuals) {
        PlayerVisuals.showGoldText(this.scene, this, amount);
      }
      
      // Notificar
      this.scene.events.emit('player-gained-gold', amount, this.stats.gold);
    } catch (e) {
      console.error("Error al añadir oro:", e);
    }
  }

  /**
   * Cura al jugador
   * @param {number} amount - Cantidad de curación
   * @returns {number} Curación real aplicada
   */
  heal(amount) {
    try {
      let healAmount = 0;
      
      if (this.statsManager) {
        healAmount = this.statsManager.heal(amount);
      } else {
        // Fallback si statsManager no está disponible
        const oldHealth = this._stats.health || 0;
        this._stats.health = Math.min(this._stats.maxHealth || 20, oldHealth + amount);
        healAmount = this._stats.health - oldHealth;
      }
      
      if (healAmount > 0 && this.scene.combatEffectsSystem) {
        this.scene.combatEffectsSystem.createHealEffect(this, healAmount);
      }
      
      return healAmount;
    } catch (e) {
      console.error("Error al curar al jugador:", e);
      return 0;
    }
  }

  /**
   * Equipa un objeto
   * @param {Object} item - Objeto a equipar
   * @returns {boolean} - Éxito al equipar
   */
  equipItem(item) {
    if (!this.equipment) return false;
    
    try {
      const success = this.equipment.equipItem(item);
      
      if (success) {
        // Efecto visual
        if (PlayerVisuals) {
          PlayerVisuals.updateEquipmentVisuals(this.scene, this, item);
        }
        
        // Notificar
        this.scene.events.emit('player-equipped-item', item, item.type);
      }
      
      return success;
    } catch (e) {
      console.error("Error al equipar item:", e);
      return false;
    }
  }
  
  /**
   * Desequipa un objeto
   * @param {string} slot - Slot a desequipar
   * @returns {Object|null} - Item desequipado
   */
  unequipItem(slot) {
    if (!this.equipment) return null;
    
    try {
      const item = this.equipment.unequipItem(slot);
      
      if (item) {
        // Notificar
        this.scene.events.emit('player-unequipped-item', item, slot);
      }
      
      return item;
    } catch (e) {
      console.error("Error al desequipar item:", e);
      return null;
    }
  }
  
  /**
   * Aprende una nueva habilidad
   * @param {Object} skill - Habilidad a aprender
   * @returns {boolean} Si se pudo aprender
   */
  learnSkill(skill) {
    if (!skill || !skill.id || !this.abilities) return false;
    
    try {
      // Verificar si ya se tiene
      if (this.abilities.getAllSkills().some(s => s.id === skill.id)) return false;
      
      // Verificar requisitos (nivel, etc)
      if (skill.levelReq && this.stats.level < skill.levelReq) return false;
      
      // Añadir habilidad
      const success = this.abilities.addSkill(skill);
      
      if (success) {
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
      }
      
      return success;
    } catch (e) {
      console.error("Error al aprender habilidad:", e);
      return false;
    }
  }
}