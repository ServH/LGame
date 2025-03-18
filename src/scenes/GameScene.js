// src/scenes/GameScene.js
import Phaser from 'phaser';
import PathSystem from '../systems/PathSystem';
import EntitySystem from '../systems/EntitySystem';
import TimeSystem from '../systems/TimeSystem';
import TileSystem from '../systems/TileSystem';

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
    
    // Sistema de entidades
    this.entitySystem = new EntitySystem(this);
    
    // Sistema de tiempo (día/noche)
    this.timeSystem = new TimeSystem(this);
    this.timeSystem.createTimeIndicator(700, 30, 120);
    
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
   * Maneja la finalización de un loop
   */
  handleLoopCompletion() {
    // Detener el loop
    this.pathSystem.stopLoop();
    
    // Recompensas por completar loop
    const reward = {
      gold: 10,
      experience: 20
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
    setTimeout(() => {
      this.scene.start('BaseScene', {
        player: this.player.stats,
        reward: reward
      });
    }, 2000);
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
        };
        break;
        
      case 'heal':
        eventConfig.title = 'Fuente curativa';
        
        const healAmount = Math.floor(this.player.stats.maxHealth * 0.3);
        eventConfig.description = `Te has curado ${healAmount} de vida.`;
        
        eventConfig.effect = () => {
          this.player.heal(healAmount);
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
              this.add.particles(this.player.x, this.player.y, 'placeholder', {
                speed: 100,
                scale: { start: 0.5, end: 0 },
                lifespan: 1000
              });
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
              this.player.setTint(0xaaaaff);
              this.time.delayedCall(10000, () => {
                this.player.clearTint();
              });
            }
          },
          {
            description: 'Encuentras un pergamino antiguo, ganando experiencia.',
            effect: () => {
              this.player.addExperience(15);
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
   * Registra eventos de sistema
   */
  setupEvents() {
    // Escuchar evento de loop completado para manejarlo
    this.events.on('loop-completed', this.handleLoopCompletion, this);
  }
}