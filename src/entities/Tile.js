// src/entities/Tile.js
export default class Tile {
    constructor(scene, gridX, gridY, type, data = {}) {
      this.scene = scene;
      this.gridX = gridX;
      this.gridY = gridY;
      this.type = type;
      this.data = data;
      
      // Propiedades calculadas
      this.gridSize = scene.tileSystem?.gridSize || 32;
      this.x = gridX * this.gridSize + this.gridSize / 2;
      this.y = gridY * this.gridSize + this.gridSize / 2;
      
      // Crear sprite
      this.sprite = scene.add.rectangle(
        this.x, this.y,
        this.gridSize - 2,
        this.gridSize - 2,
        data.color || 0xffffff
      );
      
      // Efectos adicionales
      this.effects = data.effects || {};
      this.adjacentEffects = {};
    }
    
    /**
     * Aplica un efecto a la entidad
     * @param {Entity} entity - Entidad afectada
     * @param {string} effectType - Tipo de efecto
     */
    applyEffect(entity, effectType) {
      if (this.effects[effectType]) {
        this.effects[effectType](entity, this);
      }
    }
    
    /**
     * Destruye el tile
     */
    destroy() {
      if (this.sprite) {
        this.sprite.destroy();
      }
      
      if (this.lightEffect) {
        this.lightEffect.destroy();
      }
    }
  }