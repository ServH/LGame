// src/ui/components/CombatPanel.js
import UIComponent from '../UIComponent';

/**
 * Panel de información y control de combate
 */
export default class CombatPanel extends UIComponent {
  /**
   * Inicializa el panel de combate
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Object} options - Opciones de configuración
   */
  constructor(scene, options = {}) {
    super(scene);
    
    this.options = {
      x: scene.cameras.main.width - 210,
      y: 10,
      width: 200,
      height: 160,
      ...options
    };
    
    this.controlCallbacks = {
      auto: null,
      pause: null,
      flee: null
    };
    
    this.controls = [];
    this.isAutoCombat = true;
    
    this.create();
  }

  /**
   * Crea el panel de combate
   */
  create() {
    const { x, y, width, height } = this.options;
    
    // Fondo del panel
    const panel = this.createPanel(
      x + width / 2, 
      y + height / 2, 
      width, 
      height, 
      { id: 'combat_panel' }
    );
    
    // Título
    const title = this.createText(
      x + 10, 
      y + 10, 
      'COMBATE', 
      {
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#ffffff',
        id: 'combat_title'
      }
    );
    
    // Estado
    this.statusText = this.createText(
      x + 10, 
      y + 35, 
      'No hay combate activo', 
      {
        fontSize: 12,
        color: '#aaaaaa',
        id: 'combat_status'
      }
    );
    
    // Información del enemigo
    this.enemyInfoText = this.createText(
      x + 10, 
      y + 55, 
      '', 
      {
        fontSize: 12,
        color: '#ffffff',
        id: 'enemy_info'
      }
    );
    
    // Controles
    this.createCombatControls(x, y, width, height);
    
    // Inicialmente invisible
    this.hide();
  }

  /**
   * Crea los botones de control de combate
   * @param {number} x - Posición X base
   * @param {number} y - Posición Y base
   * @param {number} width - Ancho del panel
   * @param {number} height - Alto del panel
   */
  createCombatControls(x, y, width, height) {
    const controlLabels = [
      { text: 'Auto', key: 'auto' },
      { text: 'Pausa', key: 'pause' },
      { text: 'Huir', key: 'flee' }
    ];
    
    // Crear botones de control
    controlLabels.forEach((control, index) => {
      const buttonX = x + 20 + index * (width / 3);
      const buttonY = y + height - 25;
      
      // Crear botón
      const button = this.createButton(
        buttonX, 
        buttonY, 
        control.text, 
        () => this.handleControlClick(control.key),
        {
          width: width / 3 - 15,
          height: 20,
          fontSize: 10,
          id: `combat_control_${control.key}`
        }
      );
      
      this.controls.push({
        ...button,
        key: control.key
      });
    });
  }

  /**
   * Maneja clicks en los controles
   * @param {string} key - Clave del control activado
   */
  handleControlClick(key) {
    if (this.controlCallbacks[key]) {
      this.controlCallbacks[key]();
    }
  }

  /**
   * Establece callbacks para los controles
   * @param {Object} callbacks - Objeto con callbacks para cada control
   */
  setControlCallbacks(callbacks) {
    this.controlCallbacks = { ...this.controlCallbacks, ...callbacks };
  }

  /**
   * Actualiza la información de combate
   * @param {Object} combatInfo - Información del combate actual
   */
  updateCombatInfo(combatInfo) {
    // Si no hay combate activo
    if (!combatInfo) {
      this.statusText.setText('No hay combate activo');
      this.enemyInfoText.setText('');
      return;
    }
    
    // Actualizar estado
    const { enemy, isAutoCombat } = combatInfo;
    this.isAutoCombat = isAutoCombat;
    
    this.statusText.setText(`Estado: ${isAutoCombat ? 'Automático' : 'Manual'}`);
    
    // Información del enemigo
    if (enemy && enemy.isActive()) {
      let enemyInfo = `${enemy.enemyType || 'Enemigo'} Nv.${enemy.stats.level || 1}\n`;
      enemyInfo += `Vida: ${Math.ceil(enemy.stats.health)}/${enemy.stats.maxHealth}\n`;
      enemyInfo += `Atq: ${enemy.stats.attack.toFixed(1)} Def: ${enemy.stats.defense.toFixed(1)}`;
      
      this.enemyInfoText.setText(enemyInfo);
    } else {
      this.enemyInfoText.setText('');
    }
    
    // Actualizar botones según estado
    this.updateControlButtons();
  }

  /**
   * Actualiza el estado visual de los botones
   */
  updateControlButtons() {
    this.controls.forEach(control => {
      if (control.key === 'auto') {
        control.text.setStyle({ 
          fill: this.isAutoCombat ? '#ffff00' : '#ffffff' 
        });
        
        if (this.isAutoCombat) {
          control.button.setFillStyle(0x666600);
        } else {
          control.button.setFillStyle(0x444444);
        }
      }
    });
  }

  /**
   * Muestra una notificación de combate
   * @param {string} text - Texto de la notificación
   * @param {Object} options - Opciones de la notificación
   */
  showCombatNotification(text, options = {}) {
    this.showToast(text, options);
  }
}