// src/entities/player/PlayerAbilities.js

/**
 * Gestiona las habilidades y capacidades del jugador
 */
export default class PlayerAbilities {
    /**
     * Inicializa sistema de habilidades
     * @param {Phaser.Scene} scene - Escena de Phaser
     */
    constructor(scene) {
      this.scene = scene;
      this.skills = [];
      this.skillCooldowns = new Map();
    }
  
    /**
     * Añade una nueva habilidad
     * @param {Object} skill - Habilidad a añadir
     * @returns {boolean} Si se añadió correctamente
     */
    addSkill(skill) {
      if (!skill || !skill.id) return false;
      
      // Verificar si ya se tiene
      if (this.skills.some(s => s.id === skill.id)) return false;
      
      // Añadir habilidad
      this.skills.push(skill);
      return true;
    }
  
    /**
     * Actualiza los cooldowns de habilidades
     * @param {number} delta - Tiempo transcurrido desde el último frame
     */
    updateCooldowns(delta) {
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
     * Usa una habilidad
     * @param {string} skillId - ID de la habilidad
     * @param {Object} targetInfo - Información del objetivo (entidad o posición)
     * @param {Player} player - Referencia al jugador
     * @returns {boolean} Si se usó correctamente
     */
    useSkill(skillId, targetInfo, player) {
      // Buscar la habilidad en la lista
      const skill = this.skills.find(s => s.id === skillId);
      if (!skill) return false;
      
      // Verificar cooldown
      if (this.skillCooldowns.has(skillId)) return false;
      
      // Verificar costos (mana, etc)
      if (skill.manaCost && player.stats.mana < skill.manaCost) return false;
      
      // Ejecutar efecto de la habilidad
      let success = false;
      if (skill.execute) {
        success = skill.execute(player, targetInfo, this.scene);
      }
      
      // Si tuvo éxito, aplicar costos y cooldown
      if (success) {
        // Aplicar cooldown
        this.skillCooldowns.set(skillId, skill.cooldown || 5000);
        
        // Aplicar costos
        if (skill.manaCost && player.stats.mana !== undefined) {
          player.stats.mana -= skill.manaCost;
        }
        
        // Notificar
        this.scene.events.emit('player-used-skill', player, skill, targetInfo);
      }
      
      return success;
    }
  
    /**
     * Comprueba si una habilidad está disponible
     * @param {string} skillId - ID de la habilidad
     * @returns {boolean} Si está disponible
     */
    isSkillReady(skillId) {
      return !this.skillCooldowns.has(skillId);
    }
  
    /**
     * Obtiene el tiempo restante de cooldown
     * @param {string} skillId - ID de la habilidad
     * @returns {number} Tiempo restante en ms, 0 si está lista
     */
    getSkillCooldown(skillId) {
      return this.skillCooldowns.get(skillId) || 0;
    }
  
    /**
     * Obtiene todas las habilidades
     * @returns {Array} Lista de habilidades
     */
    getAllSkills() {
      return [...this.skills];
    }
  }
  
  /**
   * Habilidades predefinidas para el jugador
   */
  export const PlayerSkills = {
    // Golpe rápido: ataque rápido con daño reducido
    quickStrike: {
      id: 'quickStrike',
      name: 'Golpe Rápido',
      description: 'Ataque rápido que causa menos daño pero reduce el cooldown.',
      cooldown: 3000,
      execute: (player, targetInfo, scene) => {
        const target = targetInfo.entity;
        if (!target || !target.isActive()) return false;
        
        // Reducir daño a 70% pero ataque más rápido
        const damage = player.stats.attack * 0.7;
        target.takeDamage(damage, player);
        
        // Reducir el cooldown general del jugador
        player.actionCooldown = Math.max(0, player.actionCooldown - 500);
        
        // Efecto visual
        if (scene.combatEffectsSystem) {
          scene.combatEffectsSystem.createAttackEffect(player, target, {
            color: 0x00ff88,
            duration: 150
          });
        }
        
        return true;
      }
    },
    
    // Golpe fuerte: ataque potente con cooldown largo
    powerStrike: {
      id: 'powerStrike',
      name: 'Golpe Potente',
      description: 'Ataque poderoso que causa 150% de daño con posibilidad de crítico mejorada.',
      cooldown: 8000,
      execute: (player, targetInfo, scene) => {
        const target = targetInfo.entity;
        if (!target || !target.isActive()) return false;
        
        // Aumentar daño a 150%
        const damage = player.stats.attack * 1.5;
        
        // Mayor probabilidad de crítico (30% extra)
        const critChance = player.stats.critChance + 0.3;
        const isCrit = Math.random() < critChance;
        
        // Aplicar daño con posible crítico
        if (isCrit) {
          const critDamage = damage * player.stats.critMultiplier;
          target.takeDamage(critDamage, player);
          
          // Notificación de crítico
          if (scene.events) {
            scene.events.emit('show-combat-notification', 
              '¡CRÍTICO!', {
                color: '#ff0000',
                fontSize: 16,
                x: target.x,
                y: target.y - 30
            });
          }
        } else {
          target.takeDamage(damage, player);
        }
        
        // Efecto visual
        if (scene.combatEffectsSystem) {
          scene.combatEffectsSystem.createAttackEffect(player, target, {
            color: 0xff8800,
            size: 1.2,
            critical: isCrit
          });
          
          // Sacudir ligeramente la cámara
          scene.cameras.main.shake(100, 0.01);
        }
        
        return true;
      }
    },
    
    // Recuperación: cura un porcentaje de vida
    recover: {
      id: 'recover',
      name: 'Recuperación',
      description: 'Recupera el 30% de tu vida máxima.',
      cooldown: 15000,
      execute: (player, targetInfo, scene) => {
        if (!player.isActive()) return false;
        
        // Calcular curación (30% de vida máxima)
        const healAmount = Math.floor(player.stats.maxHealth * 0.3);
        const actualHeal = player.heal(healAmount);
        
        // Efecto visual de curación
        if (scene.combatEffectsSystem) {
          scene.combatEffectsSystem.createHealEffect(player, actualHeal);
        }
        
        // Notificación
        if (scene.events) {
          scene.events.emit('show-combat-notification', 
            `+${actualHeal} Vida`, {
              color: '#00ff00',
              fontSize: 14,
              x: player.x,
              y: player.y - 30
          });
        }
        
        return true;
      }
    },
    
    // Defensa: reduce el daño recibido temporalmente
    defend: {
      id: 'defend',
      name: 'Postura Defensiva',
      description: 'Aumenta tu defensa en un 50% durante 5 segundos.',
      cooldown: 12000,
      execute: (player, targetInfo, scene) => {
        if (!player.isActive()) return false;
        
        // Efecto de defensa aumentada
        const defenseBoost = {
          id: 'defenseBoost',
          duration: 5000,
          onStart: (affected) => {
            affected.stats._originalDefense = affected.stats.defense;
            affected.stats.defense *= 1.5;
            
            // Efecto visual
            if (affected.sprite) {
              affected.sprite.setTint(0x0088ff);
            }
            
            // Efecto de estado
            if (scene.combatEffectsSystem) {
              scene.combatEffectsSystem.createStatusEffect(
                affected, 'buff', 5000
              );
            }
            
            // Notificación
            if (scene.events) {
              scene.events.emit('show-combat-notification', 
                'Defensa +50%', {
                  color: '#0088ff',
                  fontSize: 14,
                  x: affected.x,
                  y: affected.y - 30
              });
            }
          },
          onEnd: (affected) => {
            if (affected.stats._originalDefense) {
              affected.stats.defense = affected.stats._originalDefense;
              delete affected.stats._originalDefense;
            }
            
            if (affected.sprite) {
              affected.sprite.clearTint();
            }
          }
        };
        
        player.addStatusEffect(defenseBoost);
        
        return true;
      }
    },
    
    // Golpe múltiple: ataca a varios enemigos
    multiStrike: {
      id: 'multiStrike',
      name: 'Golpe Múltiple',
      description: 'Ataca a todos los enemigos cercanos con el 70% de tu daño.',
      cooldown: 10000,
      execute: (player, targetInfo, scene) => {
        const target = targetInfo.entity;
        if (!target || !target.isActive()) return false;
        
        // Buscar enemigos cercanos
        const nearbyEnemies = [];
        
        if (scene.entitySystem && scene.entitySystem.enemies) {
          scene.entitySystem.enemies.forEach(enemy => {
            if (enemy.isActive()) {
              const distance = Phaser.Math.Distance.Between(
                target.x, target.y,
                enemy.x, enemy.y
              );
              
              if (distance < 80) {
                nearbyEnemies.push(enemy);
              }
            }
          });
        }
        
        // Si no hay enemigos, terminar
        if (nearbyEnemies.length === 0) return false;
        
        // Daño reducido
        const damage = player.stats.attack * 0.7;
        
        // Atacar a cada enemigo
        nearbyEnemies.forEach(enemy => {
          enemy.takeDamage(damage, player);
          
          // Efecto visual
          if (scene.combatEffectsSystem) {
            scene.combatEffectsSystem.createAttackEffect(player, enemy, {
              color: 0xffaa00,
              duration: 100
            });
          }
        });
        
        // Efecto de giro
        if (player.sprite) {
          scene.tweens.add({
            targets: player.sprite,
            angle: 360,
            duration: 500,
            onComplete: () => {
              player.sprite.angle = 0;
            }
          });
        }
        
        // Notificación
        if (scene.events) {
          scene.events.emit('show-combat-notification', 
            `¡Golpe múltiple!`, {
              color: '#ffaa00',
              fontSize: 16,
              x: player.x,
              y: player.y - 30
          });
        }
        
        return true;
      }
    }
  };