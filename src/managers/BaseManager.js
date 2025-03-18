// src/managers/BaseManager.js

/**
 * Gestor principal de la base del jugador
 * Centraliza la lógica y el estado de la base
 */
export default class BaseManager {
    /**
     * Inicializa el gestor de la base
     * @param {Phaser.Scene} scene - Escena principal
     * @param {Object} baseUpgrades - Nivel de mejoras actuales
     * @param {Object} playerData - Datos del jugador
     */
    constructor(scene, baseUpgrades, playerData) {
      this.scene = scene;
      
      // Estado de la base
      this.baseUpgrades = baseUpgrades || {
        campfire: 0, // Mejora la regeneración de vida
        forge: 0,    // Mejora el daño
        library: 0,  // Mejora la experiencia ganada
        garden: 0    // Mejora la cantidad de oro obtenido
      };
      
      // Datos del jugador
      this.playerData = { ...playerData };
      
      // Definición de mejoras y efectos
      this.upgradeDefinitions = {
        campfire: {
          name: 'Hoguera',
          description: 'Mejora la regeneración de vida',
          upgradeCost: level => 10 + (level * 5),
          maxLevel: 5,
          upgradeEffect: 'Regeneración de vida +0.2% por segundo por nivel',
          applyEffect: (playerData, level) => {
            // Efecto aplicado durante el juego, no aquí
            return playerData;
          }
        },
        forge: {
          name: 'Herrería',
          description: 'Mejora el daño causado',
          upgradeCost: level => 15 + (level * 8),
          maxLevel: 5,
          upgradeEffect: 'Daño +5% por nivel',
          applyEffect: (playerData, level) => {
            playerData.attack *= (1 + level * 0.05);
            return playerData;
          }
        },
        library: {
          name: 'Biblioteca',
          description: 'Aumenta la experiencia ganada',
          upgradeCost: level => 12 + (level * 7),
          maxLevel: 5,
          upgradeEffect: 'Experiencia +10% por nivel',
          applyEffect: (playerData, level) => {
            // Efecto aplicado durante el juego
            return playerData;
          }
        },
        garden: {
          name: 'Jardín',
          description: 'Aumenta el oro obtenido',
          upgradeCost: level => 8 + (level * 6),
          maxLevel: 5,
          upgradeEffect: 'Oro +8% por nivel',
          applyEffect: (playerData, level) => {
            // Efecto aplicado durante el juego
            return playerData;
          }
        }
      };
      
      // Aplicar efectos iniciales de las mejoras
      this.applyUpgradeEffects();
    }
  
    /**
     * Aplica los efectos de las mejoras en el jugador
     */
    applyUpgradeEffects() {
      Object.entries(this.baseUpgrades).forEach(([upgradeId, level]) => {
        if (level > 0 && this.upgradeDefinitions[upgradeId]) {
          const upgradeDef = this.upgradeDefinitions[upgradeId];
          if (upgradeDef.applyEffect) {
            this.playerData = upgradeDef.applyEffect(this.playerData, level);
          }
        }
      });
    }
  
    /**
     * Aplica las recompensas obtenidas en la expedición
     * @param {Object} rewardData - Datos de recompensas
     */
    applyRewards(rewardData) {
      if (!rewardData) return;
      
      // Añadir oro y experiencia
      this.playerData.gold += rewardData.gold || 0;
      
      // La experiencia maneja subida de nivel si corresponde
      if (rewardData.experience > 0) {
        let expRemaining = rewardData.experience;
        
        while (expRemaining > 0) {
          const expToLevel = this.playerData.experienceToNextLevel - this.playerData.experience;
          
          if (expRemaining >= expToLevel) {
            // Subir de nivel
            this.playerData.level++;
            this.playerData.experience = 0;
            expRemaining -= expToLevel;
            
            // Actualizar exp para siguiente nivel
            this.playerData.experienceToNextLevel = Math.floor(10 * Math.pow(1.5, this.playerData.level - 1));
            
            // Mejorar estadísticas
            this.playerData.maxHealth += 5;
            this.playerData.health = this.playerData.maxHealth;
            this.playerData.attack += 1;
            this.playerData.defense += 0.5;
          } else {
            // Añadir exp restante
            this.playerData.experience += expRemaining;
            expRemaining = 0;
          }
        }
      }
      
      // Notificar que los datos se han actualizado
      this.scene.events.emit('player-data-updated', this.playerData);
    }
  
    /**
     * Mejora una estructura específica
     * @param {string} structureId - ID de la estructura a mejorar
     * @returns {boolean} Si se pudo mejorar
     */
    upgradeStructure(structureId) {
      if (!this.upgradeDefinitions[structureId]) return false;
      
      const currentLevel = this.baseUpgrades[structureId] || 0;
      const maxLevel = this.upgradeDefinitions[structureId].maxLevel;
      
      // Verificar si ya está al nivel máximo
      if (currentLevel >= maxLevel) return false;
      
      // Calcular costo
      const upgradeCost = this.upgradeDefinitions[structureId].upgradeCost(currentLevel);
      
      // Verificar oro suficiente
      if (this.playerData.gold < upgradeCost) return false;
      
      // Aplicar mejora
      this.baseUpgrades[structureId] = currentLevel + 1;
      
      // Restar oro
      this.playerData.gold -= upgradeCost;
      
      // Aplicar efectos de la mejora
      if (this.upgradeDefinitions[structureId].applyEffect) {
        this.playerData = this.upgradeDefinitions[structureId].applyEffect(
          this.playerData, 
          this.baseUpgrades[structureId]
        );
      }
      
      // Emitir eventos
      this.scene.events.emit('structure-upgraded', {
        structureId,
        newLevel: this.baseUpgrades[structureId],
        maxLevel
      });
      
      this.scene.events.emit('player-data-updated', this.playerData);
      
      return true;
    }
  
    /**
     * Realiza una acción específica de una estructura
     * @param {string} structureId - ID de la estructura
     * @param {string} actionId - ID de la acción a realizar
     * @returns {boolean} Si se pudo realizar la acción
     */
    performStructureAction(structureId, actionId) {
      // Implementar acciones específicas por estructura
      switch (structureId) {
        case 'campfire':
          if (actionId === 'rest') {
            // Descansar para recuperar vida
            this.playerData.health = this.playerData.maxHealth;
            this.scene.events.emit('player-rested');
            this.scene.events.emit('player-data-updated', this.playerData);
            return true;
          }
          break;
          
        // Otras estructuras con acciones adicionales
      }
      
      return false;
    }
  
    /**
     * Obtiene la definición de una estructura
     * @param {string} structureId - ID de la estructura
     * @returns {Object} Definición de la estructura
     */
    getStructureDefinition(structureId) {
      return this.upgradeDefinitions[structureId] || null;
    }
  
    /**
     * Obtiene todas las estructuras con su nivel actual
     * @returns {Array} Array de objetos con datos de estructuras
     */
    getStructures() {
      return Object.entries(this.upgradeDefinitions).map(([id, definition]) => ({
        id,
        level: this.baseUpgrades[id] || 0,
        maxLevel: definition.maxLevel,
        ...definition
      }));
    }
  
    /**
     * Obtiene el nivel de todas las mejoras
     * @returns {Object} Objeto con niveles de mejoras
     */
    getUpgrades() {
      return { ...this.baseUpgrades };
    }
  
    /**
     * Obtiene los datos actuales del jugador
     * @returns {Object} Datos del jugador
     */
    getPlayerData() {
      return { ...this.playerData };
    }
  }