// src/entities/player/PlayerEquipment.js

/**
 * Gestiona el equipamiento del jugador
 */
export default class PlayerEquipment {
    /**
     * Inicializa sistema de equipamiento
     * @param {PlayerStats} statsManager - Sistema de estadísticas
     */
    constructor(statsManager) {
      this.statsManager = statsManager;
      
      // Inventario y equipamiento
      this.inventory = [];
      this.equipment = {
        weapon: null,
        armor: null,
        accessory: null
      };
      
      // Slots de equipo disponibles
      this.slots = [
        'weapon',
        'armor',
        'accessory'
      ];
    }
  
    /**
     * Añade un objeto al inventario
     * @param {Object} item - Objeto a añadir
     */
    addItem(item) {
      if (!item) return;
      this.inventory.push(item);
    }
  
    /**
     * Elimina un objeto del inventario
     * @param {string} itemId - ID del objeto
     * @returns {Object|null} Objeto eliminado o null
     */
    removeItem(itemId) {
      const index = this.inventory.findIndex(item => item.id === itemId);
      if (index === -1) return null;
      
      const item = this.inventory[index];
      this.inventory.splice(index, 1);
      return item;
    }
  
    /**
     * Equipa un objeto
     * @param {Object|string} itemOrId - Objeto o ID de objeto a equipar
     * @returns {boolean} Si se equipó correctamente
     */
    equipItem(itemOrId) {
      // Encontrar el objeto
      let item;
      if (typeof itemOrId === 'string') {
        item = this.inventory.find(i => i.id === itemOrId);
      } else {
        item = itemOrId;
      }
      
      if (!item || !item.type) return false;
      
      // Verificar nivel requerido
      if (item.levelReq && this.statsManager.stats.level < item.levelReq) {
        return false;
      }
      
      let slot = null;
      
      // Determinar slot según tipo
      if (item.type === 'weapon') {
        slot = 'weapon';
      } else if (item.type === 'armor') {
        slot = 'armor';
      } else if (item.type === 'accessory') {
        slot = 'accessory';
      }
      
      if (!slot || !this.slots.includes(slot)) return false;
      
      // Desequipar item anterior
      if (this.equipment[slot]) {
        this.unequipItem(slot);
      }
      
      // Equipar nuevo
      this.equipment[slot] = item;
      
      // Aplicar bonificaciones
      const bonuses = this.extractBonuses(item);
      this.statsManager.applyEquipmentBonuses(bonuses);
      
      return true;
    }
  
    /**
     * Desequipa un objeto
     * @param {string} slot - Slot a desequipar
     * @returns {Object|null} - Item desequipado
     */
    unequipItem(slot) {
      if (!this.equipment[slot]) return null;
      
      const item = this.equipment[slot];
      
      // Revertir bonificaciones
      const bonuses = this.extractBonuses(item);
      this.statsManager.removeEquipmentBonuses(bonuses);
      
      // Vaciar slot
      this.equipment[slot] = null;
      
      return item;
    }
  
    /**
     * Extrae las bonificaciones de un objeto
     * @param {Object} item - Objeto de equipamiento
     * @returns {Object} Bonificaciones extraídas
     */
    extractBonuses(item) {
      const bonuses = {
        attack: 0,
        defense: 0,
        health: 0,
        maxHealth: 0,
        speed: 0,
        critChance: 0,
        critMultiplier: 0
      };
      
      // Mapeo de propiedades de objeto a bonificaciones
      const bonusMappings = {
        attackBonus: 'attack',
        defenseBonus: 'defense',
        healthBonus: 'maxHealth',
        speedBonus: 'speed',
        critChanceBonus: 'critChance',
        critMultiplierBonus: 'critMultiplier'
      };
      
      // Extraer cada bonificación posible
      Object.entries(bonusMappings).forEach(([itemProp, statProp]) => {
        if (item[itemProp] !== undefined) {
          bonuses[statProp] = item[itemProp];
        }
      });
      
      return bonuses;
    }
  
    /**
     * Obtiene el objeto equipado en un slot
     * @param {string} slot - Slot a consultar
     * @returns {Object|null} Objeto equipado
     */
    getEquippedItem(slot) {
      return this.equipment[slot] || null;
    }
  
    /**
     * Obtiene todos los objetos equipados
     * @returns {Object} Diccionario de objetos equipados
     */
    getAllEquippedItems() {
      return { ...this.equipment };
    }
  
    /**
     * Encuentra un objeto en el inventario
     * @param {string} itemId - ID del objeto
     * @returns {Object|null} Objeto encontrado
     */
    findItem(itemId) {
      return this.inventory.find(item => item.id === itemId) || null;
    }
  
    /**
     * Comprueba si un objeto está en el inventario
     * @param {string} itemId - ID del objeto
     * @returns {boolean} Si está en el inventario
     */
    hasItem(itemId) {
      return this.inventory.some(item => item.id === itemId);
    }
  
    /**
     * Obtiene objetos filtrados por tipo
     * @param {string} type - Tipo de objeto
     * @returns {Array} Objetos filtrados
     */
    getItemsByType(type) {
      return this.inventory.filter(item => item.type === type);
    }
  
    /**
     * Obtiene la capacidad de ataque total
     * @returns {number} Ataque total con equipamiento
     */
    getTotalAttackPower() {
      let total = this.statsManager.stats.attack;
      
      // Añadir bonificaciones de equipamiento
      Object.values(this.equipment).forEach(item => {
        if (item && item.attackBonus) {
          total += item.attackBonus;
        }
      });
      
      return total;
    }
  
    /**
     * Obtiene la defensa total
     * @returns {number} Defensa total con equipamiento
     */
    getTotalDefense() {
      let total = this.statsManager.stats.defense;
      
      // Añadir bonificaciones de equipamiento
      Object.values(this.equipment).forEach(item => {
        if (item && item.defenseBonus) {
          total += item.defenseBonus;
        }
      });
      
      return total;
    }
  }