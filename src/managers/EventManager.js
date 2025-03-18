// src/managers/EventManager.js

/**
 * Gestor de eventos aleatorios del juego
 */
export default class EventManager {
    /**
     * Inicializa el gestor de eventos
     * @param {Phaser.Scene} scene - Escena principal
     * @param {GameManager} gameManager - Gestor del juego
     */
    constructor(scene, gameManager) {
      this.scene = scene;
      this.gameManager = gameManager;
      this.eventNodes = new Map(); // Mapa de nodos con eventos
    }
    
    /**
     * Crea un evento aleatorio en un nodo del camino
     * @param {number} nodeIndex - Índice del nodo donde ocurrirá el evento
     */
    createRandomEvent(nodeIndex) {
      // Si ya hay un evento en este nodo, no crear otro
      if (this.eventNodes.has(nodeIndex)) return;
      
      // Tipos de eventos posibles
      const eventTypes = [
        'treasure', // Tesoro con oro o items
        'heal',     // Curación para el jugador
        'combat',   // Encuentro con enemigos adicionales
        'mystery'   // Evento misterioso con resultados variables
      ];
      
      // Seleccionar tipo de evento aleatorio
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Obtener nodo del path
      const pathSystem = this.gameManager.getSystem('path');
      if (!pathSystem || !pathSystem.path || !pathSystem.path[nodeIndex]) return;
      
      const node = pathSystem.path[nodeIndex];
      
      // Crear visual del evento en el nodo
      let eventSprite;
      
      switch (eventType) {
        case 'treasure':
          eventSprite = this.scene.add.circle(node.x, node.y, 8, 0xffff00);
          break;
        case 'heal':
          eventSprite = this.scene.add.circle(node.x, node.y, 8, 0x00ff00);
          break;
        case 'combat':
          eventSprite = this.scene.add.circle(node.x, node.y, 8, 0xff0000);
          break;
        case 'mystery':
          eventSprite = this.scene.add.circle(node.x, node.y, 8, 0xff00ff);
          break;
      }
      
      // Añadir efecto visual pulsante
      this.scene.tweens.add({
        targets: eventSprite,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0.7,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      // Registrar evento en el mapa
      this.eventNodes.set(nodeIndex, {
        type: eventType,
        sprite: eventSprite
      });
      
      // Registrar evento en el sistema de camino
      pathSystem.addEventAtNode(nodeIndex, () => {
        this.triggerEvent(eventType, nodeIndex);
      });
    }
    
    /**
     * Activa un evento según su tipo
     * @param {string} eventType - Tipo de evento
     * @param {number} nodeIndex - Índice del nodo
     */
    triggerEvent(eventType, nodeIndex) {
      // Buscar información del evento
      const eventInfo = this.eventNodes.get(nodeIndex);
      if (!eventInfo) return;
      
      // Destruir sprite del evento
      if (eventInfo.sprite) {
        eventInfo.sprite.destroy();
      }
      
      // Eliminar del mapa
      this.eventNodes.delete(nodeIndex);
      
      // Configuración del evento
      const eventConfig = {
        title: '',
        description: '',
        effect: null,
        duration: 2000
      };
      
      // Definir evento según tipo
      switch (eventType) {
        case 'treasure':
          this.configureTreasureEvent(eventConfig);
          break;
        case 'heal':
          this.configureHealEvent(eventConfig);
          break;
        case 'combat':
          this.configureCombatEvent(eventConfig);
          break;
        case 'mystery':
          this.configureMysteryEvent(eventConfig);
          break;
      }
      
      // Disparar el evento
      this.gameManager.triggerEvent(eventType, eventConfig);
    }
    
    /**
     * Configura un evento de tesoro
     * @param {Object} eventConfig - Configuración del evento
     */
    configureTreasureEvent(eventConfig) {
      eventConfig.title = '¡Tesoro encontrado!';
      
      const player = this.gameManager.getSystem('entity')?.player;
      if (!player) return;
      
      const goldAmount = Math.floor(5 + Math.random() * 10);
      eventConfig.description = `Has encontrado ${goldAmount} de oro.`;
      
      eventConfig.effect = () => {
        player.addGold(goldAmount);
        
        // Posibilidad de encontrar un objeto (20%)
        if (Math.random() < 0.2) {
          const combatSystem = this.gameManager.getSystem('combat');
          if (!combatSystem) return;
          
          // Determinar tipo de objeto
          const itemTypes = ['weapon', 'armor', 'accessory'];
          const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          
          // Determinar rareza (10% raro, 30% inusual, 60% común)
          const rarityRoll = Math.random();
          const rarity = rarityRoll < 0.1 ? 'raro' : (rarityRoll < 0.4 ? 'inusual' : 'común');
          
          // Crear objeto según tipo
          let item;
          switch (itemType) {
            case 'weapon':
              item = combatSystem.createWeapon(rarity, player.stats.level);
              break;
            case 'armor':
              item = combatSystem.createArmor(rarity, player.stats.level);
              break;
            case 'accessory':
              item = combatSystem.createAccessory(rarity, player.stats.level);
              break;
          }
          
          // Añadir al inventario
          player.equipment.addItem(item);
          
          // Actualizar descripción
          eventConfig.description += `\n¡También has encontrado: ${item.name}!`;
          
          // Efecto visual
          const effectsSystem = this.gameManager.getSystem('effects');
          if (effectsSystem) {
            effectsSystem.createItemDropEffect(player.x, player.y + 20, {
              rarity: rarity,
              duration: 2000
            });
          }
          
          // Notificar
          this.scene.events.emit('player-item-obtained', item);
        }
      };
    }
    
    /**
     * Configura un evento de curación
     * @param {Object} eventConfig - Configuración del evento
     */
    configureHealEvent(eventConfig) {
      eventConfig.title = 'Fuente curativa';
      
      const player = this.gameManager.getSystem('entity')?.player;
      if (!player) return;
      
      const healAmount = Math.floor(player.stats.maxHealth * 0.3);
      eventConfig.description = `Te has curado ${healAmount} de vida.`;
      
      eventConfig.effect = () => {
        player.heal(healAmount);
        
        const effectsSystem = this.gameManager.getSystem('effects');
        if (effectsSystem) {
          effectsSystem.createHealEffect(player, healAmount);
        }
      };
    }
    
    /**
     * Configura un evento de combate
     * @param {Object} eventConfig - Configuración del evento
     */
    configureCombatEvent(eventConfig) {
      eventConfig.title = '¡Emboscada!';
      eventConfig.description = 'Te han emboscado enemigos.';
      
      eventConfig.effect = () => {
        const player = this.gameManager.getSystem('entity')?.player;
        const entitySystem = this.gameManager.getSystem('entity');
        if (!player || !entitySystem) return;
        
        // Crear 1-3 enemigos alrededor del jugador
        const enemyCount = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < enemyCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 30 + Math.random() * 20;
          
          const enemyX = player.x + Math.cos(angle) * distance;
          const enemyY = player.y + Math.sin(angle) * distance;
          
          // Elegir tipo aleatorio
          const enemyTypes = ['slime', 'goblin', 'skeleton'];
          const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          
          // Crear enemigo
          const enemy = entitySystem.createEnemy(enemyX, enemyY, enemyType);
          
          // Iniciar combate
          enemy.startCombat(player);
        }
      };
    }
    
    /**
     * Configura un evento misterioso
     * @param {Object} eventConfig - Configuración del evento
     */
    configureMysteryEvent(eventConfig) {
      eventConfig.title = 'Evento misterioso';
      
      const player = this.gameManager.getSystem('entity')?.player;
      if (!player) return;
      
      // Resultados aleatorios
      const outcomes = [
        {
          description: 'Una energía extraña te rodea, aumentando tu ataque.',
          effect: () => {
            player.stats.attack += 1;
            
            // Efecto visual
            const effectsSystem = this.gameManager.getSystem('effects');
            if (effectsSystem) {
              effectsSystem.createStatusEffect(player, 'buff', 3000);
            }
          }
        },
        {
          description: 'Un frío te recorre, disminuyendo tu velocidad temporalmente.',
          effect: () => {
            // Efecto temporal por 10 segundos
            const originalSpeed = player.stats.speed;
            player.stats.speed *= 0.7;
            
            // Restaurar después de 10 segundos
            this.scene.time.delayedCall(10000, () => {
              player.stats.speed = originalSpeed;
            });
            
            // Efecto visual
            const effectsSystem = this.gameManager.getSystem('effects');
            if (effectsSystem) {
              effectsSystem.createStatusEffect(player, 'debuff', 10000);
            }
          }
        },
        {
          description: 'Encuentras un pergamino antiguo, ganando experiencia.',
          effect: () => {
            const expGained = 15 + Math.floor(player.stats.level * 3);
            player.addExperience(expGained);
            
            // Actualizar descripción con cantidad real
            eventConfig.description = `Encuentras un pergamino antiguo, ganando ${expGained} de experiencia.`;
          }
        }
      ];
      
      // Seleccionar resultado aleatorio
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      eventConfig.description = outcome.description;
      eventConfig.effect = outcome.effect;
    }
    
    /**
     * Crea una bifurcación en el camino
     * @param {number} nodeIndex - Índice del nodo de bifurcación
     */
    createPathBranch(nodeIndex) {
      // Implementación básica para el MVP
      const pathSystem = this.gameManager.getSystem('path');
      if (!pathSystem || !pathSystem.path || !pathSystem.path[nodeIndex]) return;
      
      const node = pathSystem.path[nodeIndex];
      
      // Indicador de bifurcación
      const branchIndicator = this.scene.add.text(
        node.x,
        node.y - 20,
        '?',
        {
          font: 'bold 16px Arial',
          fill: '#ffffff'
        }
      ).setOrigin(0.5);
      
      // Añadir efecto visual
      this.scene.tweens.add({
        targets: branchIndicator,
        y: branchIndicator.y - 5,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      // Añadir evento de bifurcación
      pathSystem.addEventAtNode(nodeIndex, () => {
        this.showBranchChoice(nodeIndex);
        branchIndicator.destroy();
      });
    }
    
    /**
     * Muestra opciones de bifurcación al jugador
     * @param {number} nodeIndex - Índice del nodo de bifurcación
     */
    showBranchChoice(nodeIndex) {
      // Pausar el movimiento
      this.gameManager.setPaused(true);
      
      const width = this.scene.cameras.main.width;
      const height = this.scene.cameras.main.height;
      
      // Crear overlay de elección
      const overlay = this.scene.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x000000,
        0.5
      );
      overlay.setDepth(100);
      overlay.setScrollFactor(0);
      
      // Título
      const title = this.scene.add.text(
        width / 2,
        height / 2 - 100,
        'Elige tu camino',
        {
          font: 'bold 32px Arial',
          fill: '#ffffff'
        }
      );
      title.setOrigin(0.5);
      title.setDepth(101);
      title.setScrollFactor(0);
      
      // Opciones
      const options = [
        {
          text: 'Camino de tesoros',
          description: 'Más tesoros pero enemigos más fuertes',
          effect: () => {
            // Crear más eventos de tesoro
            const currentNodeIndex = nodeIndex;
            
            // Crear eventos de tesoro cada pocos nodos
            for (let i = currentNodeIndex + 2; i < currentNodeIndex + 10; i += 3) {
              this.createRandomEvent(i);
            }
            
            // Enemigos más fuertes
            const entitySystem = this.gameManager.getSystem('entity');
            const pathSystem = this.gameManager.getSystem('path');
            
            if (entitySystem && pathSystem) {
              entitySystem.spawnEnemiesOnPath(
                pathSystem.path.slice(currentNodeIndex + 1),
                100,
                () => Math.random() < 0.3
              );
            }
          }
        },
        {
          text: 'Camino seguro',
          description: 'Menos peligros pero menos recompensas',
          effect: () => {
            // Implementación sencilla para el MVP
          }
        }
      ];
      
      const optionButtons = [];
      
      options.forEach((option, index) => {
        const y = height / 2 + index * 80 - 40;
        
        // Botón
        const button = this.scene.add.rectangle(
          width / 2,
          y,
          300,
          60,
          0x444444
        );
        button.setDepth(101);
        button.setScrollFactor(0);
        button.setInteractive();
        
        // Texto del botón
        const buttonText = this.scene.add.text(
          width / 2,
          y - 10,
          option.text,
          {
            font: '20px Arial',
            fill: '#ffffff'
          }
        );
        buttonText.setOrigin(0.5);
        buttonText.setDepth(102);
        buttonText.setScrollFactor(0);
        
        // Descripción
        const descriptionText = this.scene.add.text(
          width / 2,
          y + 15,
          option.description,
          {
            font: '14px Arial',
            fill: '#cccccc'
          }
        );
        descriptionText.setOrigin(0.5);
        descriptionText.setDepth(102);
        descriptionText.setScrollFactor(0);
        
        // Eventos
        button.on('pointerover', () => {
          button.setFillStyle(0x666666);
        });
        
        button.on('pointerout', () => {
          button.setFillStyle(0x444444);
        });
        
        button.on('pointerdown', () => {
          this.selectBranch(index, options);
          this.closeBranchChoice([overlay, title, ...optionButtons.flat()]);
        });
        
        optionButtons.push([button, buttonText, descriptionText]);
      });
    }
    
    /**
     * Cierra la interfaz de elección de camino
     * @param {Array} elements - Elementos a eliminar
     */
    closeBranchChoice(elements) {
      // Animar la desaparición de los elementos
      this.scene.tweens.add({
        targets: elements,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          // Destruir elementos
          elements.forEach(element => element.destroy());
          
          // Reanudar el movimiento
          this.gameManager.setPaused(false);
          
          const pathSystem = this.gameManager.getSystem('path');
          if (pathSystem) {
            const player = this.gameManager.getSystem('entity')?.player;
            if (player) {
              pathSystem.startLoop(player);
            }
          }
        }
      });
    }
    
    /**
     * Selecciona una rama del camino
     * @param {number} branchIndex - Índice de la rama seleccionada
     * @param {Array} options - Opciones disponibles
     */
    selectBranch(branchIndex, options) {
      // Ejecutar el efecto de la opción seleccionada
      if (options[branchIndex] && options[branchIndex].effect) {
        options[branchIndex].effect();
      }
    }
  }