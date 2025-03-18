// src/entities/player/PlayerStats.js

/**
 * Estadísticas base para el jugador
 */
export const BASE_PLAYER_STATS = {
    health: 20,
    maxHealth: 20,
    attack: 3,
    defense: 1,
    speed: 1.2,
    level: 1,
    experience: 0,
    experienceToNextLevel: 10,
    gold: 0,
    critChance: 0.08,
    critMultiplier: 1.7
  };
  
  /**
   * Calcula la experiencia necesaria para el siguiente nivel
   * @param {number} level - Nivel actual
   * @returns {number} Experiencia necesaria
   */
  export function calculateExperienceForLevel(level) {
    return Math.floor(10 * Math.pow(1.5, level - 1));
  }
  
  /**
   * Calcula estadísticas para un nivel específico
   * @param {number} level - Nivel objetivo
   * @returns {Object} Estadísticas escaladas
   */
  export function calculateStatsForLevel(level) {
    if (level <= 1) return { ...BASE_PLAYER_STATS };
    
    const levelFactor = level - 1;
    
    return {
      ...BASE_PLAYER_STATS,
      health: Math.floor(BASE_PLAYER_STATS.health + levelFactor * 5),
      maxHealth: Math.floor(BASE_PLAYER_STATS.maxHealth + levelFactor * 5),
      attack: BASE_PLAYER_STATS.attack + levelFactor * 1,
      defense: BASE_PLAYER_STATS.defense + levelFactor * 0.5,
      level: level,
      experienceToNextLevel: calculateExperienceForLevel(level)
    };
  }
  
  /**
   * Maneja la lógica de progresión y estadísticas del jugador
   */
  export default class PlayerStats {
    /**
     * Inicializa estadísticas del jugador
     * @param {Object} initialStats - Estadísticas iniciales (opcional)
     */
    constructor(initialStats = {}) {
      this.stats = { ...BASE_PLAYER_STATS, ...initialStats };
      this.equipmentBonuses = {
        attack: 0,
        defense: 0,
        health: 0,
        maxHealth: 0,
        speed: 0,
        critChance: 0,
        critMultiplier: 0
      };
    }
  
    /**
     * Obtiene estadísticas con bonificaciones aplicadas
     * @returns {Object} Estadísticas finales
     */
    getStats() {
      const finalStats = { ...this.stats };
      
      // Aplicar bonificaciones de equipo
      finalStats.attack += this.equipmentBonuses.attack;
      finalStats.defense += this.equipmentBonuses.defense;
      finalStats.maxHealth += this.equipmentBonuses.maxHealth;
      finalStats.speed += this.equipmentBonuses.speed;
      finalStats.critChance += this.equipmentBonuses.critChance;
      finalStats.critMultiplier += this.equipmentBonuses.critMultiplier;
      
      // Ajustar si la vida actual supera la máxima
      finalStats.health = Math.min(finalStats.health, finalStats.maxHealth);
      
      return finalStats;
    }
  
    /**
     * Aplica bonificaciones de equipo
     * @param {Object} bonuses - Bonificaciones a aplicar
     */
    applyEquipmentBonuses(bonuses) {
      // Restaurar vida si hay bonificación de vida máxima
      if (bonuses.maxHealth && bonuses.maxHealth > 0) {
        this.stats.health += bonuses.maxHealth;
      }
      
      // Aplicar cada bonificación al total
      Object.keys(bonuses).forEach(key => {
        if (this.equipmentBonuses[key] !== undefined) {
          this.equipmentBonuses[key] += bonuses[key] || 0;
        }
      });
    }
  
    /**
     * Elimina bonificaciones de equipo
     * @param {Object} bonuses - Bonificaciones a eliminar
     */
    removeEquipmentBonuses(bonuses) {
      Object.keys(bonuses).forEach(key => {
        if (this.equipmentBonuses[key] !== undefined) {
          this.equipmentBonuses[key] -= bonuses[key] || 0;
        }
      });
      
      // Ajustar vida si es necesario
      const finalMaxHealth = this.stats.maxHealth + this.equipmentBonuses.maxHealth;
      if (this.stats.health > finalMaxHealth) {
        this.stats.health = finalMaxHealth;
      }
    }
  
    /**
     * Añade experiencia y gestiona subida de nivel
     * @param {number} amount - Cantidad de experiencia
     * @param {Function} levelUpCallback - Callback para cuando sube de nivel
     * @returns {boolean} - Si subió de nivel
     */
    addExperience(amount, levelUpCallback) {
      if (amount <= 0) return false;
      
      this.stats.experience += amount;
      
      // Comprobar si sube de nivel
      if (this.stats.experience >= this.stats.experienceToNextLevel) {
        this.levelUp();
        
        if (levelUpCallback) {
          levelUpCallback(this.stats.level);
        }
        
        return true;
      }
      
      return false;
    }
  
    /**
     * Añade oro al jugador
     * @param {number} amount - Cantidad de oro
     */
    addGold(amount) {
      if (amount <= 0) return;
      this.stats.gold += amount;
    }
  
    /**
     * Sube de nivel al jugador
     */
    levelUp() {
      // Aumentar nivel
      this.stats.level++;
      
      // Resetear experiencia
      this.stats.experience -= this.stats.experienceToNextLevel;
      
      // Calcular experiencia para el siguiente nivel
      this.stats.experienceToNextLevel = calculateExperienceForLevel(this.stats.level);
      
      // Mejorar estadísticas
      this.stats.maxHealth += 5;
      this.stats.health = this.stats.maxHealth; // Curación completa al subir de nivel
      this.stats.attack += 1;
      this.stats.defense += 0.5;
    }
  
    /**
     * Cura al jugador
     * @param {number} amount - Cantidad de curación
     * @returns {number} Cantidad real curada
     */
    heal(amount) {
      if (amount <= 0) return 0;
      
      const oldHealth = this.stats.health;
      this.stats.health = Math.min(
        this.stats.maxHealth + this.equipmentBonuses.maxHealth, 
        this.stats.health + amount
      );
      
      return this.stats.health - oldHealth;
    }
  
    /**
     * Recibe daño
     * @param {number} amount - Cantidad de daño
     * @returns {number} Daño real recibido
     */
    takeDamage(amount) {
      if (amount <= 0) return 0;
      
      const oldHealth = this.stats.health;
      this.stats.health = Math.max(0, this.stats.health - amount);
      
      return oldHealth - this.stats.health;
    }
  }