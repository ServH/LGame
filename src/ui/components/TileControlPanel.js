// src/ui/components/TileControlPanel.js
import UIComponent from '../UIComponent';

/**
 * Panel de control de colocación de tiles
 */
export default class TileControlPanel extends UIComponent {
  /**
   * Inicializa el panel de control de tiles
   * @param {Phaser.Scene} scene - Escena de Phaser
   * @param {Object} options - Opciones de configuración
   */
  constructor(scene, options = {}) {
    super(scene);
    
    this.options = {
      x: 10,
      y: scene.cameras.main.height - 110,
      width: 300,
      height: 100,
      ...options
    };
    
    this.tileButtons = {};
    this.selectedTileType = null;
    this.isActive = false;
    this.onTileSelect = null;
    
    this.create();
  }

  /**
   * Crea el panel de control de tiles
   */
  create() {
    const { x, y, width, height } = this.options;
    
    // Fondo del panel
    const panel = this.createPanel(
      x + width / 2, 
      y + height / 2, 
      width, 
      height, 
      { id: 'tile_panel' }
    );
    
    // Título
    const title = this.createText(
      x + 10, 
      y + 10, 
      'TILES (Presiona T)', 
      {
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#ffffff',
        id: 'tile_title'
      }
    );
    
    // Crear botones de tiles
    this.createTileButtons(x, y, width, height);
  }

  /**
   * Crea los botones de selección de tiles
   * @param {number} x - Posición X base
   * @param {number} y - Posición Y base
   * @param {number} width - Ancho del panel
   * @param {number} height - Alto del panel
   */
  createTileButtons(x, y, width, height) {
    const tileSize = 32;
    const tileSpacing = 10;
    const startX = x + 20;
    const startY = y + 40;
    
    const tiles = [
      { key: 'grass', color: 0x55aa55, label: 'Hierba (G)' },
      { key: 'rock', color: 0x888888, label: 'Roca (R)' },
      { key: 'thorn', color: 0xaa5555, label: 'Espinas (H)' },
      { key: 'lamp', color: 0xffff77, label: 'Lámpara (L)' }
    ];
    
    tiles.forEach((tileInfo, index) => {
      const tileX = startX + index * (tileSize + tileSpacing);
      
      // Tile
      const tile = this.scene.add.rectangle(
        tileX + tileSize / 2,
        startY + tileSize / 2,
        tileSize - 4,
        tileSize - 4,
        tileInfo.color,
        0.4 // Semitransparente hasta que se active
      );
      tile.setInteractive();
      
      // Borde
      const tileBorder = this.scene.add.rectangle(
        tileX + tileSize / 2,
        startY + tileSize / 2,
        tileSize,
        tileSize
      );
      tileBorder.setStrokeStyle(1, 0x666666);
      
      // Etiqueta
      const label = this.scene.add.text(
        tileX + tileSize / 2,
        startY + tileSize + 8,
        tileInfo.label,
        {
          font: '10px Arial',
          fill: '#cccccc'
        }
      );
      label.setOrigin(0.5, 0);
      
      // Eventos
      tile.on('pointerdown', () => {
        if (this.isActive) {
          // Activar tile si el panel está activo
          this.selectTileType(tileInfo.key);
        } else if (this.onTileSelect) {
          // Primero activar modo colocación y luego seleccionar
          this.onTileSelect('activate', null);
          
          // Seleccionar tras un pequeño delay
          setTimeout(() => {
            this.selectTileType(tileInfo.key);
          }, 100);
        }
      });
      
      // Guardar referencia
      this.tileButtons[tileInfo.key] = { tile, tileBorder, label };
      
      // Añadir al mapa de elementos
      this.elements.set(`tile_${tileInfo.key}`, tile);
      this.elements.set(`tile_border_${tileInfo.key}`, tileBorder);
      this.elements.set(`tile_label_${tileInfo.key}`, label);
    });
  }

  /**
   * Actualiza el estado del panel
   * @param {boolean} isActive - Si el panel está activo
   * @param {string|null} selectedType - Tipo de tile seleccionado
   */
  updateState(isActive, selectedType) {
    // Actualizar estado
    const wasActive = this.isActive;
    this.isActive = isActive;
    this.selectedTileType = selectedType;
    
    // Resetear todos los tiles a semitransparentes
    Object.values(this.tileButtons).forEach(({ tile, tileBorder }) => {
      tile.setAlpha(this.isActive ? 0.8 : 0.4);
      tileBorder.setStrokeStyle(1, 0x666666);
    });
    
    // Resaltar el tile seleccionado
    if (selectedType && this.tileButtons[selectedType]) {
      const { tile, tileBorder } = this.tileButtons[selectedType];
      tile.setAlpha(1);
      tileBorder.setStrokeStyle(2, 0xffffff);
    }
    
    // Mostrar mensaje si se activa/desactiva el modo
    if (wasActive !== this.isActive) {
      const message = this.isActive
        ? 'Modo de colocación de tiles activado'
        : 'Modo de colocación de tiles desactivado';
      
      this.showToast(message, { duration: 1500 });
    }
  }

  /**
   * Selecciona un tipo de tile
   * @param {string} tileType - Tipo de tile
   */
  selectTileType(tileType) {
    if (!this.tileButtons[tileType]) return;
    
    this.selectedTileType = tileType;
    
    // Actualizar visuales
    this.updateState(this.isActive, tileType);
    
    // Ejecutar callback
    if (this.onTileSelect) {
      this.onTileSelect('select', tileType);
    }
  }

  /**
   * Establece el callback para selección de tiles
   * @param {Function} callback - Función a ejecutar
   */
  setTileSelectCallback(callback) {
    this.onTileSelect = callback;
  }

  /**
   * Muestra notificación de colocación de tile
   * @param {Object} tile - Tile colocado
   */
  showTilePlacedMessage(tile) {
    if (!tile) return;
    
    // Obtener nombre del tile
    let tileName = 'desconocido';
    
    switch (tile.type) {
      case 'grass': tileName = 'Hierba'; break;
      case 'rock': tileName = 'Roca'; break;
      case 'thorn': tileName = 'Espinas'; break;
      case 'lamp': tileName = 'Lámpara'; break;
    }
    
    this.showToast(`Tile colocado: ${tileName}`, { duration: 1000 });
  }
}