// src/managers/BaseStructureManager.js

/**
 * Gestor de estructuras de la base
 * Encargado de crear y gestionar los elementos visuales de las estructuras
 */
export default class BaseStructureManager {
    /**
     * Inicializa el gestor de estructuras
     * @param {Phaser.Scene} scene - Escena principal
     * @param {BaseManager} baseManager - Gestor de la base
     */
    constructor(scene, baseManager) {
      this.scene = scene;
      this.baseManager = baseManager;
      this.structures = [];
      
      // Escuchar eventos de mejoras
      this.scene.events.on('structure-upgraded', (data) => {
        this.updateStructureVisuals(data.structureId, data.newLevel, data.maxLevel);
      });
    }
  
    /**
     * Crea las estructuras visuales de la base
     */
    createStructures() {
      const structures = this.baseManager.getStructures();
      
      // Posiciones de las estructuras en pantalla
      const { width, height } = this.scene.cameras.main;
      const positions = [
        { x: width / 5, y: height - 120 },     // campfire
        { x: 2 * width / 5, y: height - 130 }, // forge
        { x: 3 * width / 5, y: height - 110 }, // library
        { x: 4 * width / 5, y: height - 100 }  // garden
      ];
      
      // Crear cada estructura
      structures.forEach((structure, index) => {
        this.createStructure(structure, positions[index] || positions[0]);
      });
    }
  
    /**
     * Crea una estructura visual individual
     * @param {Object} structureData - Datos de la estructura
     * @param {Object} position - Posición en pantalla
     */
    createStructure(structureData, position) {
      const { id, name, description, level, maxLevel } = structureData;
      
      // Tamaños según el tipo
      let width, height, color;
      
      switch (id) {
        case 'campfire':
          width = 60;
          height = 50;
          color = 0x884400;
          break;
        case 'forge':
          width = 80;
          height = 70;
          color = 0x666666;
          break;
        case 'library':
          width = 70;
          height = 60;
          color = 0x885500;
          break;
        case 'garden':
          width = 80;
          height = 40;
          color = 0x227722;
          break;
        default:
          width = 70;
          height = 60;
          color = 0x555555;
      }
      
      // Estructura principal
      const structure = this.scene.add.rectangle(
        position.x,
        position.y,
        width,
        height,
        color
      );
      
      // Crear decoraciones específicas
      const decorations = this.createStructureDecorations(id, position, width, height);
      
      // Indicador de nivel
      const levelText = this.scene.add.text(
        position.x,
        position.y - height/2 - 15,
        `Niv. ${level}/${maxLevel}`,
        {
          font: '12px Arial',
          fill: level >= maxLevel ? '#ffff00' : '#ffffff'
        }
      );
      levelText.setOrigin(0.5);
      
      // Nombre de la estructura
      const nameText = this.scene.add.text(
        position.x,
        position.y + height/2 + 15,
        name,
        {
          font: '14px Arial',
          fill: '#ffffff'
        }
      );
      nameText.setOrigin(0.5, 0);
      
      // Hacer la estructura interactiva
      structure.setInteractive();
      structure.on('pointerover', () => {
        structure.setStrokeStyle(2, 0xffffff);
        nameText.setStyle({ font: 'bold 14px Arial' });
        
        // Mostrar tooltip
        const upgradeInfo = this.baseManager.getStructureDefinition(id);
        let tooltipText = `${description}\n` + 
                        `${upgradeInfo.upgradeEffect}\n` + 
                        `Nivel actual: ${level}/${maxLevel}`;
        
        if (level < maxLevel) {
          const cost = upgradeInfo.upgradeCost(level);
          tooltipText += `\nMejora: ${cost} oro`;
        } else {
          tooltipText += '\n¡Nivel máximo!';
        }
        
        this.scene.events.emit('show-tooltip', {
          x: position.x,
          y: position.y - height/2 - 40,
          text: tooltipText
        });
      });
      
      structure.on('pointerout', () => {
        structure.setStrokeStyle(0);
        nameText.setStyle({ font: '14px Arial' });
        this.scene.events.emit('hide-tooltip');
      });
      
      structure.on('pointerdown', () => {
        this.scene.events.emit('open-structure-menu', id);
      });
      
      // Guardar referencia
      this.structures.push({
        id,
        structure,
        nameText,
        levelText,
        decorations,
        position
      });
    }
  
    /**
     * Crea decoraciones específicas para cada tipo de estructura
     * @param {string} structureId - ID de la estructura
     * @param {Object} position - Posición base de la estructura
     * @param {number} width - Ancho de la estructura
     * @param {number} height - Alto de la estructura
     * @returns {Array} Lista de elementos gráficos
     */
    createStructureDecorations(structureId, position, width, height) {
      const decorations = [];
      
      switch (structureId) {
        case 'campfire': {
          // Crear hoguera
          const fireBase = this.scene.add.polygon(
            position.x, position.y + height/2 - 5,
            [0, 0, -15, 10, 15, 10],
            0x553311
          );
          
          // Llamas
          const fire = this.scene.add.polygon(
            position.x, position.y + height/2 - 15,
            [0, -20, -10, 0, 10, 0],
            0xff6600
          );
          
          // Animar llamas
          this.scene.tweens.add({
            targets: fire,
            scaleX: 0.8,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
          });
          
          decorations.push(fireBase, fire);
          break;
        }
        
        case 'forge': {
          // Chimenea
          const chimney = this.scene.add.rectangle(
            position.x + 30,
            position.y - height/2 - 20,
            20,
            30,
            0x555555
          );
          
          // Yunque
          const anvil = this.scene.add.rectangle(
            position.x - 15,
            position.y + 15,
            30,
            10,
            0x444444
          );
          
          decorations.push(chimney, anvil);
          break;
        }
        
        case 'library': {
          // Techo
          const roof = this.scene.add.triangle(
            position.x,
            position.y - height/2,
            -width/2 - 10, 0,
            width/2 + 10, 0,
            0, -30,
            0xaa7700
          );
          
          decorations.push(roof);
          
          // Libros en estantes
          for (let i = 0; i < 3; i++) {
            const y = position.y - height/4 + i * 15;
            for (let j = 0; j < 5; j++) {
              const bookColor = Phaser.Utils.Array.GetRandom([
                0x884400, 0x336699, 0x663399, 0x339944
              ]);
              const book = this.scene.add.rectangle(
                position.x - width/3 + j * 12,
                y,
                8,
                10,
                bookColor
              );
              decorations.push(book);
            }
          }
          break;
        }
        
        case 'garden': {
          // Plantas
          for (let i = 0; i < 5; i++) {
            const x = position.x - width/2 + 10 + i * (width - 20)/4;
            
            // Tallo
            const stem = this.scene.add.rectangle(
              x,
              position.y - 5,
              2,
              20,
              0x227722
            );
            
            // Hojas/flores
            const plantTop = this.scene.add.circle(
              x,
              position.y - 20,
              5,
              Phaser.Utils.Array.GetRandom([0x22aa22, 0x99dd00, 0xddff00])
            );
            
            // Animar plantas
            this.scene.tweens.add({
              targets: plantTop,
              y: plantTop.y - 3,
              duration: 2000 + i * 300,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
            
            decorations.push(stem, plantTop);
          }
          break;
        }
      }
      
      return decorations;
    }
  
    /**
     * Actualiza los visuales de una estructura cuando se mejora
     * @param {string} structureId - ID de la estructura
     * @param {number} newLevel - Nuevo nivel
     * @param {number} maxLevel - Nivel máximo
     */
    updateStructureVisuals(structureId, newLevel, maxLevel) {
      const structure = this.structures.find(s => s.id === structureId);
      if (!structure) return;
      
      // Actualizar texto de nivel
      structure.levelText.setText(`Niv. ${newLevel}/${maxLevel}`);
      
      // Cambiar color si está al máximo nivel
      if (newLevel >= maxLevel) {
        structure.levelText.setStyle({ font: '12px Arial', fill: '#ffff00' });
      }
      
      // Efectos de mejora según el tipo
      switch (structureId) {
        case 'campfire':
          // Hacer llamas más grandes
          const fire = structure.decorations[1];
          if (fire) {
            this.scene.tweens.add({
              targets: fire,
              scaleX: 1 + (newLevel * 0.1),
              scaleY: 1 + (newLevel * 0.15),
              duration: 500
            });
          }
          break;
          
        case 'forge':
          // Efecto de chispas o humo
          this.createForgeUpgradeEffect(structure.position.x, structure.position.y);
          break;
          
        case 'library':
          // Brillar brevemente
          this.scene.tweens.add({
            targets: structure.decorations,
            alpha: 0.2,
            yoyo: true,
            duration: 300
          });
          break;
          
        case 'garden':
          // Crecer plantas
          const plantTops = structure.decorations.filter(d => d.type === 0); // Círculos
          if (plantTops.length) {
            this.scene.tweens.add({
              targets: plantTops,
              scale: 1 + (newLevel * 0.1),
              duration: 500
            });
          }
          break;
      }
      
      // Efecto visual general de mejora
      this.scene.tweens.add({
        targets: structure.structure,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true
      });
      
      // Partículas de mejora
      this.createUpgradeParticles(structure.position.x, structure.position.y);
    }
  
    /**
     * Crea partículas para el efecto de mejora
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     */
    createUpgradeParticles(x, y) {
      // Crear partículas que suben
      for (let i = 0; i < 20; i++) {
        const particle = this.scene.add.circle(
          x + Phaser.Math.Between(-30, 30),
          y + Phaser.Math.Between(-10, 10),
          Phaser.Math.Between(2, 4),
          0xffff00,
          0.7
        );
        
        this.scene.tweens.add({
          targets: particle,
          y: particle.y - Phaser.Math.Between(40, 60),
          alpha: 0,
          duration: Phaser.Math.Between(700, 1000),
          onComplete: () => {
            particle.destroy();
          }
        });
      }
    }
  
    /**
     * Crea efecto específico para mejora de la herrería
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     */
    createForgeUpgradeEffect(x, y) {
      // Crear chispas
      for (let i = 0; i < 15; i++) {
        const particle = this.scene.add.circle(
          x - 15,
          y + 10,
          Phaser.Math.Between(1, 3),
          0xff6600,
          0.9
        );
        
        const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
        const distance = Phaser.Math.Between(10, 30);
        
        this.scene.tweens.add({
          targets: particle,
          x: particle.x + Math.cos(angle) * distance,
          y: particle.y + Math.sin(angle) * distance,
          alpha: 0,
          duration: Phaser.Math.Between(300, 600),
          onComplete: () => {
            particle.destroy();
          }
        });
      }
    }
  }