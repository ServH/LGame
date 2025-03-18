// src/scenes/GameScene.js
import Phaser from 'phaser';
import PathSystem from '../systems/PathSystem';
import EntitySystem from '../systems/EntitySystem';
import TimeSystem from '../systems/TimeSystem';
import TileSystem from '../systems/TileSystem';
import CombatSystem from '../systems/CombatSystem';
import CombatEffectsSystem from '../systems/CombatEffectsSystem';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Recibe datos de la escena anterior
   * @param {Object} data - Datos recibidos
   */
  init(data) {
    this.playerData = data.playerData || null;
  }

  create() {
    // Iniciar la UI
    this.scene.launch('UIScene');
    
    // Inicializar sistemas
    this.initSystems();
    
    // Configurar cámara
    this.cameras.main.setBackgroundColor('#111111');
    
    // Crear path inicial
    this.createInitialPath();
    
    // Crear jugador
    this.createPlayer();
    
    // Generar enemigos en el path
    this.spawnEnemies();
    
    // Iniciar el ciclo día/noche
    this.timeSystem.setDayDuration(60000); // 1 minuto = 1 día completo
    
    // Activar controles de juego
    this.setupControls();
    
    // Registrar eventos de sistema
    this.setupEvents();
    
    // Iniciar el loop automático
    this.startLoop();
    
    console.log('GameScene iniciada');
  }

  /**
   * Inicializa todos los sistemas del juego
   */
  initSystems() {
    // Sistema de camino
    this.pathSystem = new PathSystem(this);
    
    // Sistema de tiempo (día/noche)
    this.timeSystem = new TimeSystem(this);
    this.timeSystem.createTimeIndicator(700, 30, 120);
    
    // Sistema de efectos de combate
    this.combatEffectsSystem = new CombatEffectsSystem(this);
    
    // Sistema de combate
    this.combatSystem = new CombatSystem(this);
    
    // Sistema de entidades
    this.entitySystem = new EntitySystem(this);
    
    // Sistema de tiles
    this.tileSystem = new TileSystem(this);
  }

  /**
   * Crea el camino inicial
   */
  createInitialPath() {
    // Generar un camino rectangular
    const path = this.pathSystem.generateRectangularPath(
      400, // centro X
      300, // centro Y
      500, // ancho
      400, // alto
      40  // número de nodos
    );
    
    return path;
  }

  /**
   * Crea al jugador
   */
  createPlayer() {
    // Posición inicial (primer punto del camino)
    const startPoint = this.pathSystem.path[0];
    
    // Estadísticas del jugador (desde la escena anterior o predeterminadas)
    const stats = this.playerData || {
      health: 20,
      maxHealth: 20,
      attack: 3,
      defense: 1,
      speed: 1.2,
      level: 1,
      experience: 0,
      experienceToNextLevel: 10,
      gold: 0
    };
    
    // Crear jugador
    this.player = this.entitySystem.createPlayer(
      startPoint.x,
      startPoint.y,
      stats
    );
    
    // Comunicar al UI que el jugador se ha creado
    this.events.emit('player-created', this.player);
    
    return this.player;
  }

  /**
   * Genera enemigos en el camino
   */
  spawnEnemies() {
    // Generar enemigos distribuidos en el camino
    this.entitySystem.spawnEnemiesOnPath(
      this.pathSystem.path,
      120, // distancia mínima entre enemigos
      (point, index, path) => {
        // Probabilidad basada en la posición en el camino
        // Más probabilidad de enemigos cuanto más lejos del inicio
        const progress = index / path.length;
        return Math.random() < (0.15 + progress * 0.3);
      }
    );
    
    // Añadir algunos "grupos" de enemigos
    this.createEnemyGroups();
  }

  /**
   * Crea grupos de enemigos que se alertan entre sí
   */
  createEnemyGroups() {
    // 1-3 grupos de enemigos
    const groupCount = 1 + Math.floor(Math.random() * 2);
    const pathPoints = this.pathSystem.path;
    
    for (let i = 0; i < groupCount; i++) {
      // Posición aleatoria en el path (más allá de la mitad)
      const pathIndex = Math.floor(pathPoints.length * 0.5) + 
                        Math.floor(Math.random() * (pathPoints.length * 0.4));
      
      if (pathIndex >= pathPoints.length) continue;
      
      const point = pathPoints[pathIndex];
      
      // 2-4 enemigos por grupo
      const enemyCount = 2 + Math.floor(Math.random() * 3);
      
      // Crear enemigos alrededor del punto
      for (let j = 0; j < enemyCount; j++) {
        const angle = (j / enemyCount) * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        
        const enemyX = point.x + Math.cos(angle) * distance;
        const enemyY = point.y + Math.sin(angle) * distance;
        
        // Tipo aleatorio
        const enemyTypes = ['slime', 'goblin', 'skeleton'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        this.entitySystem.createEnemy(enemyX, enemyY, enemyType);
      }
    }
  }

  /**
   * Configura los controles del juego
   */
  setupControls() {
    // Teclas para controlar la velocidad del juego
    this.speedControls = {
      pause: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      normal: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      fast: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      superfast: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    };
    
    // Teclas para el modo de colocación de tiles
    this.tileControls = {
      activateMode: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      grass: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
      rock: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      thorn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
      lamp: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      cancel: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    };
    
    // Procesar teclas
    this.input.keyboard.on('keydown', (event) => {
      // Controles de velocidad
      if (event.keyCode === this.speedControls.pause.keyCode) {
        this.togglePause();
      } else if (event.keyCode === this.speedControls.normal.keyCode) {
        this.setGameSpeed(1);
      } else if (event.keyCode === this.speedControls.fast.keyCode) {
        this.setGameSpeed(2);
      } else if (event.keyCode === this.speedControls.superfast.keyCode) {
        this.setGameSpeed(4);
      }
      
      // Controles de tiles
      if (event.keyCode === this.tileControls.activateMode.keyCode) {
        this.toggleTilePlacementMode();
      } else if (this.tileSystem.tilePlacementMode) {
        if (event.keyCode === this.tileControls.grass.keyCode) {
          this.tileSystem.activatePlacementMode('grass');
        } else if (event.keyCode === this.tileControls.rock.keyCode) {
          this.tileSystem.activatePlacementMode('rock');
        } else if (event.keyCode === this.tileControls.thorn.keyCode) {
          this.tileSystem.activatePlacementMode('thorn');
        } else if (event.keyCode === this.tileControls.lamp.keyCode) {
          this.tileSystem.activatePlacementMode('lamp');
        } else if (event.keyCode === this.tileControls.cancel.keyCode) {
          this.tileSystem.deactivatePlacementMode();
        }
      }
    });
  }

  /**
   * Inicia el loop automático del personaje
   */
  startLoop() {
    // Asignar el jugador al sistema de camino
    this.pathSystem.startLoop(this.player);
    
    // Notificar
    this.events.emit('loop-started');
  }

  /**
   * Alterna entre pausa y reanudación
   */
  togglePause() {
    const isPaused = this.pathSystem.loopActive === false;
    
    if (isPaused) {
      // Reanudar
      this.pathSystem.startLoop(this.player);
      this.timeSystem.setPaused(false);
      
      this.events.emit('game-resumed');
    } else {
      // Pausar
      this.pathSystem.stopLoop();
      this.timeSystem.setPaused(true);
      
      this.events.emit('game-paused');
    }
  }

  /**
   * Establece la velocidad del juego
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setGameSpeed(multiplier) {
    // Ajustar velocidad del path
    this.pathSystem.setSpeedMultiplier(multiplier);
    
    // Ajustar velocidad del tiempo
    this.timeSystem.setTimeScale(multiplier);
    
    // Notificar
    this.events.emit('game-speed-changed', multiplier);
  }

  /**
   * Alterna el modo de colocación de tiles
   */
  toggleTilePlacementMode() {
    if (this.tileSystem.tilePlacementMode) {
      this.tileSystem.deactivatePlacementMode();
    } else {
      // Por defecto, seleccionar el primer tipo de tile
      this.tileSystem.activatePlacementMode('grass');
    }
  }

  /**
   * Actualiza el estado del juego
   * @param {number} time - Tiempo actual
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(time, delta) {
    // Actualizar sistemas
    if (this.pathSystem) this.pathSystem.update(delta);
    if (this.entitySystem) this.entitySystem.update(delta);
    if (this.timeSystem) this.timeSystem.update(delta);
    if (this.tileSystem) this.tileSystem.update(delta);
    if (this.combatEffectsSystem) this.combatEffectsSystem.update(time, delta);
    
    // Comprobar condición de victoria/derrota
    this.checkGameState();
  }

  /**
   * Comprueba el estado del juego para victoria/derrota
   */
  checkGameState() {
    // Comprobar si el jugador ha muerto
    if (this.player && !this.player.isActive()) {
      this.handlePlayerDeath();
    }
  }

  /**
   * Registra eventos de sistema
   */
  setupEvents() {
    // Escuchar evento de loop completado para manejarlo
    this.events.on('loop-completed', this.handleLoopCompletion, this);
    
    // Eventos de items y equipamiento
    this.events.on('item-dropped', this.handleItemDropped, this);
    
    // Suscribirse a evento de nodo alcanzado para posibles eventos
    this.events.on('path-node-reached', this.handleNodeReached, this);
  }

  /**
   * Maneja cuando se alcanza un nodo del camino
   * @param {number} nodeIndex - Índice del nodo alcanzado
   */
  handleNodeReached(nodeIndex) {
    // Probabilidad pequeña de evento aleatorio (5%)
    if (Math.random() < 0.05) {
      this.createRandomEvent(nodeIndex);
    }
  }

  /**
   * Maneja la caída de un objeto
   * @param {Object} item - Objeto que cayó
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   */
  handleItemDropped(item, x, y) {
    // Si existe el sistema de efectos de combate, crear efecto visual
    if (this.combatEffectsSystem) {
      this.combatEffectsSystem.createItemDropEffect(x, y, {
        rarity: item.rarity,
        duration: 1500
      });
    }
    
    // Añadir al inventario del jugador (simplificado por ahora)
    this.player.inventory.push(item);
    
    // Notificar a la UI
    this.events.emit('player-item-obtained', item);
  }

  /**
   * Maneja la finalización de un loop
   */
  handleLoopCompletion() {
    // Detener el loop
    this.pathSystem.stopLoop();
    
    // Recompensas por completar loop
    const reward = {
      gold: 10 + Math.floor(this.player.stats.level * 2),
      experience: 20 + Math.floor(this.player.stats.level * 5)
    };
    
    // Añadir recompensas al jugador
    this.player.addGold(reward.gold);
    this.player.addExperience(reward.experience);
    
    // Mostrar mensaje de victoria
    this.events.emit('loop-completed', {
      reward: reward,
      player: this.player
    });
    
    // Transición a la escena de base
    this.time.delayedCall(2000, () => {
      this.scene.start('BaseScene', {
        player: this.player.stats,
        reward: reward
      });
    });
  }

  /**
   * Maneja la muerte del jugador
   */
  handlePlayerDeath() {
    // Detener el loop
    this.pathSystem.stopLoop();
    
    // Pausar todos los sistemas
    this.timeSystem.setPaused(true);
    
    // Mostrar mensaje de derrota
    this.events.emit('player-died');
    
    // Crear overlay de derrota
    const { width, height } = this.cameras.main;
    const gameOverOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0
    );
    
    // Texto de game over
    const gameOverText = this.add.text(
      width / 2,
      height / 2 - 50,
      'GAME OVER',
      {
        font: 'bold 48px Arial',
        fill: '#ff0000'
      }
    ).setOrigin(0.5);
    
    // Texto de reinicio
    const restartText = this.add.text(
      width / 2,
      height / 2 + 50,
      'Presiona R para reiniciar',
      {
        font: '24px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Animación de overlay
    this.tweens.add({
      targets: gameOverOverlay,
      alpha: 0.7,
      duration: 1000
    });
    
    // Tecla de reinicio
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });
  }

  /**
   * Crea un evento aleatorio en el camino
   * @param {number} nodeIndex - Índice del nodo donde ocurrirá el evento
   */
  createRandomEvent(nodeIndex) {
    // Tipos de eventos posibles
    const eventTypes = [
      'treasure', // Tesoro con oro o items
      'heal',     // Curación para el jugador
      'combat',   // Encuentro con enemigos adicionales
      'mystery'   // Evento misterioso con resultados variables
    ];
    
    // Seleccionar tipo de evento aleatorio
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Crear visual del evento en el nodo
    const node = this.pathSystem.path[nodeIndex];
    let eventSprite;
    
    switch (eventType) {
      case 'treasure':
        eventSprite = this.add.circle(node.x, node.y, 8, 0xffff00);
        break;
      case 'heal':
        eventSprite = this.add.circle(node.x, node.y, 8, 0x00ff00);
        break;
      case 'combat':
        eventSprite = this.add.circle(node.x, node.y, 8, 0xff0000);
        break;
      case 'mystery':
        eventSprite = this.add.circle(node.x, node.y, 8, 0xff00ff);
        break;
    }
    
    // Añadir efecto visual pulsante
    this.tweens.add({
      targets: eventSprite,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Registrar evento en el sistema de camino
    this.pathSystem.addEventAtNode(nodeIndex, () => {
      this.triggerEvent(eventType);
      
      // Destruir sprite del evento una vez activado
      eventSprite.destroy();
    });
  }

  /**
   * Activa un evento según su tipo
   * @param {string} eventType - Tipo de evento
   */
  triggerEvent(eventType) {
    // Pausar temporalmente el movimiento
    const wasPaused = !this.pathSystem.loopActive;
    this.pathSystem.stopLoop();
    
    // Configuración del evento
    const eventConfig = {
      title: '',
      description: '',
      effect: null,
      duration: 2000 // Duración en ms antes de reanudar
    };
    
    // Definir evento según tipo
    switch (eventType) {
      case 'treasure':
        eventConfig.title = '¡Tesoro encontrado!';
        
        const goldAmount = Math.floor(5 + Math.random() * 10);
        eventConfig.description = `Has encontrado ${goldAmount} de oro.`;
        
        eventConfig.effect = () => {
          this.player.addGold(goldAmount);
          
          // Posibilidad de encontrar un objeto (20%)
          if (Math.random() < 0.2 && this.combatSystem) {
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
                item = this.combatSystem.createWeapon(rarity, this.player.stats.level);
                break;
              case 'armor':
                item = this.combatSystem.createArmor(rarity, this.player.stats.level);
                break;
              case 'accessory':
                item = this.combatSystem.createAccessory(rarity, this.player.stats.level);
                break;
            }
            
            // Añadir al inventario
            this.player.inventory.push(item);
            
            // Actualizar descripción y mostrar efecto visual
            eventConfig.description += `\n¡También has encontrado: ${item.name}!`;
            
            if (this.combatEffectsSystem) {
              this.combatEffectsSystem.createItemDropEffect(this.player.x, this.player.y + 20, {
                rarity: rarity,
                duration: 2000
              });
            }
            
            // Notificar a la UI
            this.events.emit('player-item-obtained', item);
          }
        };
        break;
        
      case 'heal':
        eventConfig.title = 'Fuente curativa';
        
        const healAmount = Math.floor(this.player.stats.maxHealth * 0.3);
        eventConfig.description = `Te has curado ${healAmount} de vida.`;
        
        eventConfig.effect = () => {
          this.player.heal(healAmount);
          
          if (this.combatEffectsSystem) {
            this.combatEffectsSystem.createHealEffect(this.player, healAmount);
          }
        };
        break;
        
      case 'combat':
        eventConfig.title = '¡Emboscada!';
        eventConfig.description = 'Te han emboscado enemigos.';
        
        eventConfig.effect = () => {
          // Crear 1-3 enemigos alrededor del jugador
          const enemyCount = 1 + Math.floor(Math.random() * 3);
          
          for (let i = 0; i < enemyCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            
            const enemyX = this.player.x + Math.cos(angle) * distance;
            const enemyY = this.player.y + Math.sin(angle) * distance;
            
            // Elegir tipo aleatorio
            const enemyTypes = ['slime', 'goblin', 'skeleton'];
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            // Crear enemigo
            const enemy = this.entitySystem.createEnemy(enemyX, enemyY, enemyType);
            
            // Iniciar combate
            enemy.startCombat(this.player);
          }
        };
        break;
        
      case 'mystery':
        eventConfig.title = 'Evento misterioso';
        
        // Resultados aleatorios
        const outcomes = [
          {
            description: 'Una energía extraña te rodea, aumentando tu ataque.',
            effect: () => {
              this.player.stats.attack += 1;
              
              // Efecto visual
              if (this.combatEffectsSystem) {
                this.combatEffectsSystem.createStatusEffect(this.player, 'buff', 3000);
              } else {
                this.add.particles(this.player.x, this.player.y, 'placeholder', {
                  speed: 100,
                  scale: { start: 0.5, end: 0 },
                  lifespan: 1000
                });
              }
            }
          },
          {
            description: 'Un frío te recorre, disminuyendo tu velocidad temporalmente.',
            effect: () => {
              // Efecto temporal por 10 segundos
              const originalSpeed = this.player.stats.speed;
              this.player.stats.speed *= 0.7;
              
              // Restaurar después de 10 segundos
              this.time.delayedCall(10000, () => {
                this.player.stats.speed = originalSpeed;
              });
              
              // Efecto visual
              if (this.combatEffectsSystem) {
                this.combatEffectsSystem.createStatusEffect(this.player, 'debuff', 10000);
              } else {
                this.player.setTint(0xaaaaff);
                this.time.delayedCall(10000, () => {
                  this.player.clearTint();
                });
              }
            }
          },
          {
            description: 'Encuentras un pergamino antiguo, ganando experiencia.',
            effect: () => {
              const expGained = 15 + Math.floor(this.player.stats.level * 3);
              this.player.addExperience(expGained);
              
              // Actualizar descripción con cantidad real
              eventConfig.description = `Encuentras un pergamino antiguo, ganando ${expGained} de experiencia.`;
            }
          }
        ];
        
        // Seleccionar resultado aleatorio
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        eventConfig.description = outcome.description;
        eventConfig.effect = outcome.effect;
        break;
    }
    
    // Mostrar mensaje del evento
    this.events.emit('event-triggered', eventConfig);
    
    // Ejecutar efecto
    if (eventConfig.effect) {
      eventConfig.effect();
    }
    
    // Reanudar movimiento después de la duración
    this.time.delayedCall(eventConfig.duration, () => {
      if (!wasPaused) {
        this.pathSystem.startLoop(this.player);
      }
    });
  }

  /**
   * Crea una bifurcación en el camino
   * @param {number} nodeIndex - Índice del nodo donde comienza la bifurcación
   */
  createPathBranch(nodeIndex) {
    // Implementación básica - se expandirá en fases posteriores
    
    // Crear visual de la bifurcación
    const node = this.pathSystem.path[nodeIndex];
    
    // Indicador de bifurcación
    const branchIndicator = this.add.text(
      node.x,
      node.y - 20,
      '?',
      {
        font: 'bold 16px Arial',
        fill: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Añadir efecto visual
    this.tweens.add({
      targets: branchIndicator,
      y: branchIndicator.y - 5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Añadir evento de bifurcación
    this.pathSystem.addEventAtNode(nodeIndex, () => {
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
    this.pathSystem.stopLoop();
    
    // Crear overlay de elección
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const overlay = this.add.rectangle(
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
    const title = this.add.text(
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
          for (let i = nodeIndex + 2; i < nodeIndex + 10; i += 3) {
            if (i < this.pathSystem.path.length) {
              this.createRandomEvent(i);
            }
          }
          
          // Pero también enemigos más fuertes
          this.entitySystem.spawnEnemiesOnPath(
            this.pathSystem.path.slice(nodeIndex + 1),
            100,
            () => Math.random() < 0.3
          );
        }
      },
      {
        text: 'Camino seguro',
        description: 'Menos peligros pero menos recompensas',
        effect: () => {
          // Menos enemigos pero también menos recompensas
          // Implementación sencilla para el MVP
        }
      }
    ];
    
    const optionButtons = [];
    
    options.forEach((option, index) => {
      const y = height / 2 + index * 80 - 40;
      
      // Botón
      const button = this.add.rectangle(
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
      const buttonText = this.add.text(
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
      const descriptionText = this.add.text(
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
        this.selectBranch(index);
        this.closeBranchChoice([overlay, title, ...optionButtons.flat()]);
      });
    });
  }

  /**
   * Cierra la interfaz de elección de camino
   * @param {Array} elements - Elementos a eliminar
   */
  closeBranchChoice(elements) {
    // Animar la desaparición de los elementos
    this.tweens.add({
      targets: elements,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        // Destruir elementos
        elements.forEach(element => element.destroy());
        
        // Reanudar el movimiento
        this.pathSystem.startLoop(this.player);
      }
    });
  }

  /**
   * Selecciona una rama del camino
   * @param {number} branchIndex - Índice de la rama seleccionada
   */
  selectBranch(branchIndex) {
    // Ejecutar el efecto de la rama seleccionada
    const options = [
      {
        text: 'Camino de tesoros',
        effect: () => {
          // Crear más eventos de tesoro
          for (let i = this.currentNodeIndex + 2; i < this.currentNodeIndex + 10; i += 3) {
            if (i < this.pathSystem.path.length) {
              this.createRandomEvent(i);
            }
          }
          
          // Pero también enemigos más fuertes
          this.entitySystem.spawnEnemiesOnPath(
            this.pathSystem.path.slice(this.currentNodeIndex + 1),
            100,
            () => Math.random() < 0.3
          );
        }
      },
      {
        text: 'Camino seguro',
        effect: () => {
          // Menos enemigos pero también menos recompensas
          // Implementación sencilla para el MVP
        }
      }
    ];
    
    // Ejecutar el efecto de la opción seleccionada
    if (options[branchIndex] && options[branchIndex].effect) {
      options[branchIndex].effect();
    }
  }
}
