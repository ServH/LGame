// src/systems/TileSystem.js
export default class TileSystem {
  constructor(scene) {
    this.scene = scene;
    this.tiles = [];
    this.tilePlacementMode = false;
    this.selectedTileType = null;
    this.gridSize = 32; // Tamaño de cada celda del grid
    this.gridWidth = Math.ceil(scene.cameras.main.width / this.gridSize);
    this.gridHeight = Math.ceil(scene.cameras.main.height / this.gridSize);
    this.pathSystem = null; // Referencia al sistema de caminos
    this.speedMultiplier = 1; // Multiplicador de velocidad global
    
    // Crear grupo para los tiles
    this.tilesGroup = scene.add.group();
    
    // Grid visual (desactivado inicialmente)
    this.gridGraphics = scene.add.graphics();
    this.gridGraphics.visible = false;
    
    // Tile fantasma (para previsualización)
    this.ghostTile = null;
    
    // Definición de tipos de tiles disponibles
    this.tileTypes = {
      grass: {
        name: 'Hierba',
        description: 'Aumenta la regeneración de vida',
        color: 0x55aa55,
        effects: {
          onTick: (entity, delta) => {
            if (entity.type === 'player' && entity.isActive()) {
              // Curación ajustada por delta para ser constante
              const healAmount = 0.01 * (delta / 1000);
              entity.heal(healAmount);
              
              // Log ocasional para depuración
              if (Math.random() < 0.001) {
                console.log(`TileSystem: Hierba curando ${healAmount.toFixed(4)} vida (delta=${delta}ms)`);
              }
            }
          }
        },
        placementRules: (x, y) => true // Se puede colocar en cualquier lugar
      },
      rock: {
        name: 'Roca',
        description: 'Aumenta la defensa del jugador',
        color: 0x888888,
        effects: {
          onPlace: (tile) => {
            // Al colocar, aplicar efecto alrededor
            this.applyEffectToAdjacentTiles(tile.gridX, tile.gridY, 'defense', 0.2);
            console.log(`TileSystem: Roca colocada en (${tile.gridX},${tile.gridY}), aplicando +0.2 defensa alrededor`);
          },
          onRemove: (tile) => {
            // Al quitar, eliminar efecto
            this.applyEffectToAdjacentTiles(tile.gridX, tile.gridY, 'defense', -0.2);
          }
        },
        placementRules: (x, y) => {
          // No se puede colocar sobre otro tile
          return !this.getTileAt(x, y);
        }
      },
      thorn: {
        name: 'Espinas',
        description: 'Daña a los enemigos que pasen cerca',
        color: 0xaa5555,
        effects: {
          onEntityEnter: (entity, tile) => {
            if (entity.type === 'enemy' && entity.isActive()) {
              const damage = 1;
              entity.takeDamage(damage, null);
              console.log(`TileSystem: Espinas dañando enemigo con ${damage} daño`);
            }
          }
        },
        placementRules: (x, y) => {
          // Solo se puede colocar adyacente al camino
          return this.isAdjacentToPath(x, y) && !this.getTileAt(x, y);
        }
      },
      lamp: {
        name: 'Lámpara',
        description: 'Ilumina el área durante la noche',
        color: 0xffff77,
        effects: {
          onDayChange: (isDay, tile) => {
            // Cambiar apariencia según sea de día o de noche
            if (tile.sprite) {
              tile.sprite.setAlpha(isDay ? 0.7 : 1);
              
              // Crear efecto de luz en la noche
              if (!isDay && !tile.lightEffect) {
                tile.lightEffect = this.scene.add.circle(
                  tile.x, 
                  tile.y, 
                  this.gridSize * 2, 
                  0xffffaa, 
                  0.2
                );
                console.log(`TileSystem: Lámpara activada en (${tile.gridX},${tile.gridY})`);
              } else if (isDay && tile.lightEffect) {
                tile.lightEffect.destroy();
                tile.lightEffect = null;
              }
            }
          }
        },
        placementRules: (x, y) => {
          // No se puede colocar sobre otro tile
          return !this.getTileAt(x, y);
        }
      }
    };
    
    // Inicializar eventos
    this.initEvents();
    
    console.log(`TileSystem inicializado: gridSize=${this.gridSize}, tilesTypes=${Object.keys(this.tileTypes).length}`);
  }

  /**
   * Inicializa los eventos del sistema
   */
  initEvents() {
    // Evento de clic para colocar tiles
    this.scene.input.on('pointerdown', (pointer) => {
      if (this.tilePlacementMode && this.selectedTileType) {
        const gridX = Math.floor(pointer.worldX / this.gridSize);
        const gridY = Math.floor(pointer.worldY / this.gridSize);
        this.placeTile(this.selectedTileType, gridX, gridY);
      }
    });
    
    // Evento de movimiento para actualizar tile fantasma
    this.scene.input.on('pointermove', (pointer) => {
      if (this.tilePlacementMode && this.ghostTile) {
        const gridX = Math.floor(pointer.worldX / this.gridSize);
        const gridY = Math.floor(pointer.worldY / this.gridSize);
        
        this.ghostTile.x = gridX * this.gridSize + this.gridSize / 2;
        this.ghostTile.y = gridY * this.gridSize + this.gridSize / 2;
        
        // Colorear según se pueda colocar o no
        const canPlace = this.canPlaceTile(this.selectedTileType, gridX, gridY);
        this.ghostTile.setAlpha(canPlace ? 0.7 : 0.3);
        this.ghostTile.setFillStyle(
          this.tileTypes[this.selectedTileType].color,
          canPlace ? 0.7 : 0.3
        );
      }
    });
    
    // Escuchar eventos del ciclo día/noche
    this.scene.events.on('day-started', () => {
      this.onDayChange(true);
    });
    
    this.scene.events.on('night-started', () => {
      this.onDayChange(false);
    });
    
    // Escuchar eventos de entidades que pasan por tiles
    this.scene.events.on('entity-moved', (entity, x, y) => {
      this.checkEntityTileInteraction(entity, x, y);
    });
  }

  /**
   * Establece el multiplicador de velocidad
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setSpeedMultiplier(multiplier) {
    const oldMultiplier = this.speedMultiplier;
    this.speedMultiplier = multiplier;
    console.log(`TileSystem: Velocidad cambiada de ${oldMultiplier}x a ${multiplier}x`);
  }
  
  /**
   * Establece el estado de pausa
   * @param {boolean} isPaused - Si el sistema está pausado
   */
  setPaused(isPaused) {
    this.isPaused = isPaused;
    console.log(`TileSystem: ${isPaused ? 'Pausado' : 'Reanudado'}`);
  }

  /**
   * Activa el modo de colocación de tiles
   * @param {string} tileType - Tipo de tile a colocar
   */
  activatePlacementMode(tileType) {
    if (!this.tileTypes[tileType]) return;
    
    this.tilePlacementMode = true;
    this.selectedTileType = tileType;
    
    // Mostrar grid
    this.drawGrid();
    this.gridGraphics.visible = true;
    
    // Crear tile fantasma
    if (this.ghostTile) {
      this.ghostTile.destroy();
    }
    
    this.ghostTile = this.scene.add.rectangle(
      0, 0,
      this.gridSize - 2,
      this.gridSize - 2,
      this.tileTypes[tileType].color,
      0.7
    );
    
    // Notificar
    this.scene.events.emit('tile-placement-mode-activated', tileType);
    console.log(`TileSystem: Modo de colocación activado para tile tipo ${tileType}`);
  }

  /**
   * Desactiva el modo de colocación de tiles
   */
  deactivatePlacementMode() {
    this.tilePlacementMode = false;
    this.selectedTileType = null;
    
    // Ocultar grid
    this.gridGraphics.visible = false;
    
    // Destruir tile fantasma
    if (this.ghostTile) {
      this.ghostTile.destroy();
      this.ghostTile = null;
    }
    
    // Notificar
    this.scene.events.emit('tile-placement-mode-deactivated');
    console.log("TileSystem: Modo de colocación desactivado");
  }

  /**
   * Dibuja el grid visual
   */
  drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x333333, 0.3);
    
    // Líneas verticales
    for (let x = 0; x <= this.gridWidth; x++) {
      this.gridGraphics.moveTo(x * this.gridSize, 0);
      this.gridGraphics.lineTo(x * this.gridSize, this.gridHeight * this.gridSize);
    }
    
    // Líneas horizontales
    for (let y = 0; y <= this.gridHeight; y++) {
      this.gridGraphics.moveTo(0, y * this.gridSize);
      this.gridGraphics.lineTo(this.gridWidth * this.gridSize, y * this.gridSize);
    }
    
    this.gridGraphics.strokePath();
  }

  /**
   * Verifica si se puede colocar un tile
   * @param {string} tileType - Tipo de tile
   * @param {number} gridX - Coordenada X del grid
   * @param {number} gridY - Coordenada Y del grid
   * @returns {boolean} Si se puede colocar
   */
  canPlaceTile(tileType, gridX, gridY) {
    if (!this.tileTypes[tileType]) return false;
    
    // Verificar reglas de colocación del tipo de tile
    return this.tileTypes[tileType].placementRules(gridX, gridY);
  }

  /**
   * Coloca un tile en el grid
   * @param {string} tileType - Tipo de tile
   * @param {number} gridX - Coordenada X del grid
   * @param {number} gridY - Coordenada Y del grid
   * @returns {Object|null} Tile creado o null si no se pudo colocar
   */
  placeTile(tileType, gridX, gridY) {
    // Verificar si se puede colocar
    if (!this.canPlaceTile(tileType, gridX, gridY)) {
      return null;
    }
    
    const tileTypeData = this.tileTypes[tileType];
    
    // Posición en el mundo
    const x = gridX * this.gridSize + this.gridSize / 2;
    const y = gridY * this.gridSize + this.gridSize / 2;
    
    // Crear sprite del tile
    const sprite = this.scene.add.rectangle(
      x, y,
      this.gridSize - 2,
      this.gridSize - 2,
      tileTypeData.color
    );
    
    // Crear objeto tile
    const tile = {
      id: `tile_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: tileType,
      gridX,
      gridY,
      x,
      y,
      sprite,
      effects: tileTypeData.effects || {}
    };
    
    // Añadir al grupo y lista
    this.tilesGroup.add(sprite);
    this.tiles.push(tile);
    
    // Ejecutar efecto onPlace si existe
    if (tile.effects.onPlace) {
      tile.effects.onPlace(tile);
    }
    
    // Notificar
    this.scene.events.emit('tile-placed', tile);
    console.log(`TileSystem: Tile ${tileType} colocado en (${gridX},${gridY})`);
    
    return tile;
  }

  /**
   * Elimina un tile
   * @param {string} tileId - ID del tile
   * @returns {boolean} Si se eliminó correctamente
   */
  removeTile(tileId) {
    const index = this.tiles.findIndex(t => t.id === tileId);
    if (index === -1) return false;
    
    const tile = this.tiles[index];
    
    // Ejecutar efecto onRemove si existe
    if (tile.effects.onRemove) {
      tile.effects.onRemove(tile);
    }
    
    // Eliminar sprite
    if (tile.sprite) {
      tile.sprite.destroy();
    }
    
    // Eliminar efecto de luz si existe
    if (tile.lightEffect) {
      tile.lightEffect.destroy();
    }
    
    // Quitar de la lista
    this.tiles.splice(index, 1);
    
    // Notificar
    this.scene.events.emit('tile-removed', tile);
    console.log(`TileSystem: Tile eliminado: ${tile.type} de (${tile.gridX},${tile.gridY})`);
    
    return true;
  }

  /**
   * Obtiene un tile en una posición del grid
   * @param {number} gridX - Coordenada X del grid
   * @param {number} gridY - Coordenada Y del grid
   * @returns {Object|null} Tile en esa posición o null
   */
  getTileAt(gridX, gridY) {
    return this.tiles.find(t => t.gridX === gridX && t.gridY === gridY) || null;
  }

  /**
   * Verifica si una posición es adyacente al camino
   * @param {number} gridX - Coordenada X del grid
   * @param {number} gridY - Coordenada Y del grid
   * @returns {boolean} Si es adyacente al camino
   */
  isAdjacentToPath(gridX, gridY) {
    // Verificar si tenemos referencia al sistema de camino
    if (!this.pathSystem || !this.pathSystem.path) {
      console.warn("TileSystem: No hay referencia a PathSystem al verificar adyacencia");
      return false;
    }
    
    // Convertir coordenadas del grid a coordenadas del mundo
    const worldX = gridX * this.gridSize + this.gridSize / 2;
    const worldY = gridY * this.gridSize + this.gridSize / 2;
    
    // Verificar si algún punto del camino está cerca
    const path = this.pathSystem.path;
    for (const point of path) {
      const distance = Phaser.Math.Distance.Between(worldX, worldY, point.x, point.y);
      if (distance < this.gridSize * 1.5) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Aplica un efecto a los tiles adyacentes
   * @param {number} gridX - Coordenada X del grid central
   * @param {number} gridY - Coordenada Y del grid central
   * @param {string} effectName - Nombre del efecto
   * @param {any} effectValue - Valor del efecto
   */
  applyEffectToAdjacentTiles(gridX, gridY, effectName, effectValue) {
    // Aplicar a los 8 tiles adyacentes
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Saltar el centro
        
        const tile = this.getTileAt(gridX + dx, gridY + dy);
        if (tile) {
          // Guardar el efecto en el tile
          tile.adjacentEffects = tile.adjacentEffects || {};
          tile.adjacentEffects[effectName] = (tile.adjacentEffects[effectName] || 0) + effectValue;
          
          // Actualizar visualización si es necesario
          if (effectName === 'defense' && tile.sprite) {
            // Ejemplo: cambiar tinte si aumenta defensa
            const blueValue = Math.min(255, Math.floor(128 + tile.adjacentEffects[effectName] * 200));
            tile.sprite.setTint(Phaser.Display.Color.GetColor(
              tile.sprite.fillColor >> 16 & 0xFF,
              tile.sprite.fillColor >> 8 & 0xFF,
              blueValue
            ));
          }
        }
      }
    }
  }

  /**
   * Maneja cambios de día/noche
   * @param {boolean} isDay - Si es de día
   */
  onDayChange(isDay) {
    console.log(`TileSystem: Cambio a ${isDay ? 'día' : 'noche'}`);
    
    // Aplicar efectos de día/noche a los tiles
    for (const tile of this.tiles) {
      if (tile.effects.onDayChange) {
        tile.effects.onDayChange(isDay, tile);
      }
    }
  }

  /**
   * Verifica interacción entre entidades y tiles
   * @param {Entity} entity - Entidad que se movió
   * @param {number} x - Posición X de la entidad
   * @param {number} y - Posición Y de la entidad
   */
  checkEntityTileInteraction(entity, x, y) {
    // Si está pausado, no procesar
    if (this.isPaused) return;
    
    // Convertir posición a coordenadas del grid
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    
    // Comprobar los tiles en las celdas circundantes
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tile = this.getTileAt(gridX + dx, gridY + dy);
        if (tile && tile.effects.onEntityEnter) {
          tile.effects.onEntityEnter(entity, tile);
        }
      }
    }
  }

  /**
   * Actualiza los efectos continuos de los tiles
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    // Si está pausado, no procesar
    if (this.isPaused) return;
    
    // Verificar delta muy grande
    if (delta > 500) {
      delta = 500; // Limitar delta para evitar efectos exagerados
    }
    
    // Ajustar delta con el multiplicador de velocidad
    const adjustedDelta = delta * this.speedMultiplier;
    
    // Aplicar efectos onTick a las entidades
    const player = this.scene.entitySystem?.player;
    
    if (player && player.isActive()) {
      // Buscar tiles cercanos al jugador
      const gridX = Math.floor(player.x / this.gridSize);
      const gridY = Math.floor(player.y / this.gridSize);
      
      let tilesProcessed = 0;
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const tile = this.getTileAt(gridX + dx, gridY + dy);
          if (tile && tile.effects.onTick) {
            tile.effects.onTick(player, adjustedDelta);
            tilesProcessed++;
          }
        }
      }
      
      // Log ocasional para depuración
      if (tilesProcessed > 0 && Math.random() < 0.01) {
        console.log(`TileSystem: ${tilesProcessed} tiles procesados para el jugador, delta=${adjustedDelta}ms (x${this.speedMultiplier})`);
      }
    }
    
    // También podemos aplicar efectos a enemigos si es necesario
    const enemies = this.scene.entitySystem?.enemies || [];
    for (const enemy of enemies) {
      if (enemy.isActive()) {
        const gridX = Math.floor(enemy.x / this.gridSize);
        const gridY = Math.floor(enemy.y / this.gridSize);
        
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const tile = this.getTileAt(gridX + dx, gridY + dy);
            if (tile && tile.effects.onTickEnemy) {
              tile.effects.onTickEnemy(enemy, adjustedDelta);
            }
          }
        }
      }
    }
  }
}

// src/entities/Tile.js
export class Tile {
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