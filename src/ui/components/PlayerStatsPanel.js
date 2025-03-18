// src/ui/components/PlayerStatsPanel.js
import UIComponent from '../UIComponent';

/**
 * Panel de estadísticas del jugador
 */
export default class PlayerStatsPanel extends UIComponent {
  /**
   * Inicializa el panel
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Object} options - Opciones de configuración
   */
  constructor(scene, options = {}) {
    super(scene);
    
    this.options = {
      x: 10,
      y: 10,
      width: 200,
      height: 120,
      ...options
    };
    
    this.playerStats = {
      health: null,
      level: null,
      experience: null,
      gold: null
    };
    
    this.create();
  }

  /**
   * Crea el panel de estadísticas
   */
  create() {
    const { x, y, width, height } = this.options;
    
    // Fondo del panel
    const panel = this.createPanel(
      x + width / 2, 
      y + height / 2, 
      width, 
      height, 
      { id: 'stats_panel' }
    );
    
    // Título
    const title = this.createText(
      x + 10, 
      y + 10, 
      'JUGADOR', 
      {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#ffffff',
        id: 'stats_title'
      }
    );
    
    // Stats
    this.playerStats.health = this.createText(
      x + 10, 
      y + 35, 
      'Vida: 20/20', 
      {
        fontSize: 14,
        color: '#ffffff',
        id: 'stats_health'
      }
    );
    
    this.playerStats.level = this.createText(
      x + 10, 
      y + 55, 
      'Nivel: 1', 
      {
        fontSize: 14,
        color: '#ffffff',
        id: 'stats_level'
      }
    );
    
    this.playerStats.experience = this.createText(
      x + 10, 
      y + 75, 
      'Exp: 0/10', 
      {
        fontSize: 14,
        color: '#ffffff',
        id: 'stats_exp'
      }
    );
    
    this.playerStats.gold = this.createText(
      x + 10, 
      y + 95, 
      'Oro: 0', 
      {
        fontSize: 14,
        color: '#ffff00',
        id: 'stats_gold'
      }
    );
  }

  /**
   * Actualiza las estadísticas del jugador
   * @param {Object} stats - Estadísticas actualizadas
   */
  updateStats(stats) {
    if (!stats) return;
    
    // Actualizar vida
    if (stats.health !== undefined && stats.maxHealth !== undefined) {
      this.playerStats.health.setText(`Vida: ${Math.ceil(stats.health)}/${stats.maxHealth}`);
      
      // Cambiar color según salud
      const healthRatio = stats.health / stats.maxHealth;
      let color = '#ffffff';
      
      if (healthRatio < 0.3) color = '#ff0000';
      else if (healthRatio < 0.6) color = '#ffaa00';
      
      this.playerStats.health.setStyle({ fill: color });
    }
    
    // Actualizar nivel
    if (stats.level !== undefined) {
      this.playerStats.level.setText(`Nivel: ${stats.level}`);
    }
    
    // Actualizar experiencia
    if (stats.experience !== undefined && stats.experienceToNextLevel !== undefined) {
      this.playerStats.experience.setText(`Exp: ${Math.floor(stats.experience)}/${stats.experienceToNextLevel}`);
    }
    
    // Actualizar oro
    if (stats.gold !== undefined) {
      this.playerStats.gold.setText(`Oro: ${stats.gold}`);
    }
  }

  /**
   * Actualiza el oro con efecto visual
   * @param {number} gold - Cantidad total de oro
   */
  updateGold(gold) {
    this.playerStats.gold.setText(`Oro: ${gold}`);
    
    // Efecto de parpadeo
    this.scene.tweens.add({
      targets: this.playerStats.gold,
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      duration: 200
    });
  }
}