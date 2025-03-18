// src/scenes/BaseScene.js
import Phaser from 'phaser';
import SmokeParticle from '../entities/SmokeParticle';

export default class BaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BaseScene' });
    
    // Datos del jugador
    this.playerData = null;
    
    // Datos de recompensa
    this.rewardData = null;
    
    // Estructuras de la base
    this.structures = [];
    
    // UI Elements
    this.menuItems = [];
    this.selectedMenuItem = 0;
  }

  /**
   * Recibe datos de la escena anterior
   */
  init(data) {
    this.playerData = data.player || {
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
    
    this.rewardData = data.reward || null;
  }

  create() {
    // Configurar cámara y fondo
    this.cameras.main.setBackgroundColor('#111111');
    
    // Crear fondo de la base
    this.createBaseBackground();
    
    // Crear estructuras de la base
    this.createBaseStructures();
    
    // Crear UI de la base
    this.createBaseUI();
    
    // Mostrar mensaje de bienvenida y recompensas
    this.showWelcomeMessage();
    
    // Configurar controles
    this.setupControls();
    
    console.log('BaseScene iniciada');
  }

  /**
   * Crea el fondo de la base
   */
  createBaseBackground() {
    const { width, height } = this.cameras.main;
    
    // Fondo oscuro con grid
    this.add.grid(
      width / 2,
      height / 2,
      width,
      height,
      64,
      64,
      0x000000,
      0,
      0x222222,
      0.5
    );
    
    // Suelo de la base
    this.add.rectangle(
      width / 2,
      height - 100,
      width,
      200,
      0x333333
    );
    
    // Cielo
    const skyGradient = this.add.graphics();
    skyGradient.fillGradientStyle(
      0x111122,
      0x111122,
      0x222233,
      0x222233,
      1
    );
    skyGradient.fillRect(0, 0, width, height - 200);
    
    // Estrellas (puntos)
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(20, height - 220);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      
      // Algunas estrellas parpadean
      if (Math.random() < 0.3) {
        this.tweens.add({
          targets: star,
          alpha: 0.2,
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  /**
   * Crea las estructuras de la base
   */
  createBaseStructures() {
    const { width, height } = this.cameras.main;
    
    // Definición de estructuras
    const structuresData = [
      {
        id: 'tent',
        name: 'Tienda de Campaña',
        description: 'Descansar y recuperar vida',
        x: width / 4,
        y: height - 120,
        width: 80,
        height: 70,
        color: 0x884400
      },
      {
        id: 'forge',
        name: 'Herrería',
        description: 'Mejorar equipamiento',
        x: width / 2,
        y: height - 130,
        width: 100,
        height: 90,
        color: 0x666666
      },
      {
        id: 'library',
        name: 'Biblioteca',
        description: 'Desbloquear nuevos tiles',
        x: 3 * width / 4,
        y: height - 110,
        width: 90,
        height: 60,
        color: 0x885500
      }
    ];
    
    // Crear estructuras
    structuresData.forEach(data => {
      // Estructura principal
      const structure = this.add.rectangle(
        data.x,
        data.y,
        data.width,
        data.height,
        data.color
      );
      
      // Techo (para tienda y biblioteca)
      if (data.id === 'tent' || data.id === 'library') {
        const roof = this.add.triangle(
          data.x,
          data.y - data.height / 2,
          -data.width / 2 - 10, 0,
          data.width / 2 + 10, 0,
          0, -40,
          data.id === 'tent' ? 0xaa5500 : 0xaa7700
        );
      }
      
      // Chimenea (para herrería)
      if (data.id === 'forge') {
        // Chimenea
        this.add.rectangle(
          data.x + 30,
          data.y - data.height / 2 - 20,
          20,
          40,
          0x555555
        );
        
        // Humo con forma correcta de la API de partículas
        const smokeParticles = this.add.particles(0, 0, 'placeholder', {
          x: data.x + 30,
          y: data.y - data.height / 2 - 40,
          speed: { min: 5, max: 15 },
          angle: { min: 250, max: 290 },
          scale: { start: 1, end: 0 },
          alpha: { start: 0.3, end: 0 },
          lifespan: 2000,
          frequency: 500,
          quantity: 1,
          blendMode: 'ADD',
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Circle(0, 0, 5)
          }
        });
      }
      
      // Nombre de la estructura
      const nameText = this.add.text(
        data.x,
        data.y + data.height / 2 + 15,
        data.name,
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
        
        // Mostrar descripción
        this.showTooltip(data.x, data.y - data.height / 2 - 20, data.description);
      });
      
      structure.on('pointerout', () => {
        structure.setStrokeStyle(0);
        nameText.setStyle({ font: '14px Arial' });
        this.hideTooltip();
      });
      
      structure.on('pointerdown', () => {
        this.openStructureMenu(data.id);
      });
      
      // Guardar referencia
      this.structures.push({
        id: data.id,
        structure,
        nameText,
        data
      });
    });
  }

  /**
   * Crea la UI de la base
   */
  createBaseUI() {
    const { width, height } = this.cameras.main;
    
    // Panel de estadísticas
    this.createStatsPanel(20, 20, 220, 160);
    
    // Botón de salir
    const returnButton = this.add.rectangle(
      width - 100,
      height - 40,
      160,
      50,
      0x555555
    );
    returnButton.setInteractive();
    
    const returnText = this.add.text(
      width - 100,
      height - 40,
      'INICIAR EXPEDICIÓN',
      {
        font: '14px Arial',
        fill: '#ffffff'
      }
    );
    returnText.setOrigin(0.5);
    
    returnButton.on('pointerover', () => {
      returnButton.setFillStyle(0x777777);
    });
    
    returnButton.on('pointerout', () => {
      returnButton.setFillStyle(0x555555);
    });
    
    returnButton.on('pointerdown', () => {
      this.startNewExpedition();
    });
  }

  /**
   * Crea el panel de estadísticas
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} width - Ancho
   * @param {number} height - Alto
   */
  createStatsPanel(x, y, width, height) {
    // Fondo
    const panel = this.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      0x000000,
      0.7
    );
    panel.setStrokeStyle(1, 0xaaaaaa);
    
    // Título
    const title = this.add.text(
      x + 10,
      y + 10,
      'ESTADÍSTICAS',
      {
        font: 'bold 16px Arial',
        fill: '#ffffff'
      }
    );
    
    // Información del jugador
    const stats = [
      { label: 'Nivel', value: this.playerData.level },
      { label: 'Vida', value: `${this.playerData.health}/${this.playerData.maxHealth}` },
      { label: 'Ataque', value: this.playerData.attack },
      { label: 'Defensa', value: this.playerData.defense },
      { label: 'Velocidad', value: this.playerData.speed.toFixed(1) },
      { label: 'Oro', value: this.playerData.gold }
    ];
    
    stats.forEach((stat, index) => {
      const yPos = y + 40 + index * 20;
      
      // Etiqueta
      this.add.text(
        x + 20,
        yPos,
        stat.label,
        {
          font: '14px Arial',
          fill: '#aaaaaa'
        }
      );
      
      // Valor
      this.add.text(
        x + width - 20,
        yPos,
        String(stat.value),
        {
          font: '14px Arial',
          fill: '#ffffff'
        }
      ).setOrigin(1, 0);
    });
  }

  /**
   * Muestra un tooltip
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {string} text - Texto del tooltip
   */
  showTooltip(x, y, text) {
    if (this.tooltip) {
      this.hideTooltip();
    }
    
    // Fondo
    this.tooltip = {
      bg: this.add.rectangle(
        x,
        y,
        text.length * 7 + 20,
        30,
        0x000000,
        0.8
      ),
      text: this.add.text(
        x,
        y,
        text,
        {
          font: '12px Arial',
          fill: '#ffffff'
        }
      )
    };
    
    this.tooltip.bg.setStrokeStyle(1, 0xaaaaaa);
    this.tooltip.text.setOrigin(0.5);
    
    // Animación
    this.tooltip.bg.alpha = 0;
    this.tooltip.text.alpha = 0;
    
    this.tweens.add({
      targets: [this.tooltip.bg, this.tooltip.text],
      alpha: 1,
      duration: 200
    });
  }

  /**
   * Oculta el tooltip
   */
  hideTooltip() {
    if (!this.tooltip) return;
    
    this.tweens.add({
      targets: [this.tooltip.bg, this.tooltip.text],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.tooltip.bg.destroy();
        this.tooltip.text.destroy();
        this.tooltip = null;
      }
    });
  }

  /**
   * Muestra mensaje de bienvenida y recompensas
   */
  showWelcomeMessage() {
    const { width, height } = this.cameras.main;
    
    // Texto de bienvenida
    const welcomeText = this.add.text(
      width / 2,
      height / 4,
      'Bienvenido a la Base',
      {
        font: 'bold 32px Arial',
        fill: '#ffffff'
      }
    );
    welcomeText.setOrigin(0.5);
    
    // Mostrar recompensas si hay
    if (this.rewardData) {
      const rewardText = this.add.text(
        width / 2,
        height / 4 + 50,
        `Has conseguido: ${this.rewardData.gold} de oro, ${this.rewardData.experience} de experiencia`,
        {
          font: '18px Arial',
          fill: '#ffff00'
        }
      );
      rewardText.setOrigin(0.5);
      
      // Animación
      this.tweens.add({
        targets: [welcomeText, rewardText],
        y: '-=20',
        alpha: 0,
        delay: 3000,
        duration: 500,
        onComplete: () => {
          welcomeText.destroy();
          rewardText.destroy();
        }
      });
    } else {
      // Animación si no hay recompensas
      this.tweens.add({
        targets: welcomeText,
        y: '-=20',
        alpha: 0,
        delay: 2000,
        duration: 500,
        onComplete: () => {
          welcomeText.destroy();
        }
      });
    }
  }

  /**
   * Configura los controles
   */
  setupControls() {
    // Tecla de escape para cancelar menús
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.structureMenu) {
        this.closeStructureMenu();
      }
    });
    
    // Tecla Enter para iniciar expedición
    this.input.keyboard.on('keydown-ENTER', () => {
      this.startNewExpedition();
    });
  }

  /**
   * Abre el menú de una estructura
   * @param {string} structureId - ID de la estructura
   */
  openStructureMenu(structureId) {
    const { width, height } = this.cameras.main;
    
    // Si ya hay un menú abierto, cerrarlo
    if (this.structureMenu) {
      this.closeStructureMenu();
    }
    
    // Estructura y opciones según ID
    let title = '';
    let options = [];
    
    switch (structureId) {
      case 'tent':
        title = 'Tienda de Campaña';
        options = [
          {
            label: 'Descansar (Recuperar toda la vida)',
            action: () => {
              this.playerData.health = this.playerData.maxHealth;
              this.showToast('¡Vida completamente recuperada!');
              this.closeStructureMenu();
              this.refreshUI();
            }
          }
        ];
        break;
        
      case 'forge':
        title = 'Herrería';
        options = [
          {
            label: `Mejorar Ataque (15 oro)`,
            disabled: this.playerData.gold < 15,
            action: () => {
              if (this.playerData.gold >= 15) {
                this.playerData.gold -= 15;
                this.playerData.attack += 1;
                this.showToast('¡Ataque mejorado!');
                this.refreshUI();
              }
            }
          },
          {
            label: `Mejorar Defensa (15 oro)`,
            disabled: this.playerData.gold < 15,
            action: () => {
              if (this.playerData.gold >= 15) {
                this.playerData.gold -= 15;
                this.playerData.defense += 1;
                this.showToast('¡Defensa mejorada!');
                this.refreshUI();
              }
            }
          },
          {
            label: `Mejorar Vida Máxima (20 oro)`,
            disabled: this.playerData.gold < 20,
            action: () => {
              if (this.playerData.gold >= 20) {
                this.playerData.gold -= 20;
                this.playerData.maxHealth += 10;
                this.playerData.health += 10;
                this.showToast('¡Vida máxima aumentada!');
                this.refreshUI();
              }
            }
          }
        ];
        break;
        
      case 'library':
        title = 'Biblioteca';
        options = [
          {
            label: 'Estudiar tiles (Próximamente)',
            disabled: true,
            action: () => {}
          },
          {
            label: 'Investigar habilidades (Próximamente)',
            disabled: true,
            action: () => {}
          }
        ];
        break;
    }
    
    // Crear menú
    this.structureMenu = {
      overlay: this.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x000000,
        0.7
      ),
      panel: this.add.rectangle(
        width / 2,
        height / 2,
        400,
        300,
        0x222222,
        0.9
      ),
      title: this.add.text(
        width / 2,
        height / 2 - 120,
        title,
        {
          font: 'bold 24px Arial',
          fill: '#ffffff'
        }
      ),
      options: [],
      selectedIndex: 0
    };
    
    // Configurar objetos del menú
    this.structureMenu.panel.setStrokeStyle(2, 0xaaaaaa);
    this.structureMenu.title.setOrigin(0.5);
    
    // Crear opciones
    options.forEach((option, index) => {
      const y = height / 2 - 60 + index * 40;
      
      // Fondo de la opción
      const optionBg = this.add.rectangle(
        width / 2,
        y,
        350,
        30,
        0x333333,
        option.disabled ? 0.3 : 0.6
      );
      
      // Texto de la opción
      const optionText = this.add.text(
        width / 2,
        y,
        option.label,
        {
          font: '16px Arial',
          fill: option.disabled ? '#777777' : '#ffffff'
        }
      );
      optionText.setOrigin(0.5);
      
      // Hacer interactivo si no está deshabilitado
      if (!option.disabled) {
        optionBg.setInteractive();
        
        optionBg.on('pointerover', () => {
          optionBg.setFillStyle(0x555555, 0.8);
          this.structureMenu.selectedIndex = index;
        });
        
        optionBg.on('pointerout', () => {
          optionBg.setFillStyle(0x333333, 0.6);
        });
        
        optionBg.on('pointerdown', () => {
          option.action();
        });
      }
      
      // Guardar referencia
      this.structureMenu.options.push({
        bg: optionBg,
        text: optionText,
        action: option.action,
        disabled: option.disabled
      });
    });
    
    // Botón de cerrar
    const closeButton = this.add.rectangle(
      width / 2,
      height / 2 + 120,
      100,
      30,
      0x555555
    );
    closeButton.setInteractive();
    
    const closeText = this.add.text(
      width / 2,
      height / 2 + 120,
      'Cerrar',
      {
        font: '16px Arial',
        fill: '#ffffff'
      }
    );
    closeText.setOrigin(0.5);
    
    closeButton.on('pointerover', () => {
      closeButton.setFillStyle(0x777777);
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setFillStyle(0x555555);
    });
    
    closeButton.on('pointerdown', () => {
      this.closeStructureMenu();
    });
    
    // Añadir botón de cerrar al menú
    this.structureMenu.closeButton = closeButton;
    this.structureMenu.closeText = closeText;
    
    // Efecto de entrada
    this.structureMenu.overlay.alpha = 0;
    this.structureMenu.panel.alpha = 0;
    this.structureMenu.title.alpha = 0;
    this.structureMenu.closeButton.alpha = 0;
    this.structureMenu.closeText.alpha = 0;
    
    this.structureMenu.options.forEach(option => {
      option.bg.alpha = 0;
      option.text.alpha = 0;
    });
    
    this.tweens.add({
      targets: [
        this.structureMenu.overlay,
        this.structureMenu.panel,
        this.structureMenu.title,
        this.structureMenu.closeButton,
        this.structureMenu.closeText,
        ...this.structureMenu.options.map(o => [o.bg, o.text]).flat()
      ],
      alpha: 1,
      duration: 200
    });
  }

  /**
   * Cierra el menú de estructura actual
   */
  closeStructureMenu() {
    if (!this.structureMenu) return;
    
    // Efecto de salida
    this.tweens.add({
      targets: [
        this.structureMenu.overlay,
        this.structureMenu.panel,
        this.structureMenu.title,
        this.structureMenu.closeButton,
        this.structureMenu.closeText,
        ...this.structureMenu.options.map(o => [o.bg, o.text]).flat()
      ],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Destruir elementos
        this.structureMenu.overlay.destroy();
        this.structureMenu.panel.destroy();
        this.structureMenu.title.destroy();
        this.structureMenu.closeButton.destroy();
        this.structureMenu.closeText.destroy();
        
        this.structureMenu.options.forEach(option => {
          option.bg.destroy();
          option.text.destroy();
        });
        
        this.structureMenu = null;
      }
    });
  }

  /**
   * Actualiza la interfaz después de cambios
   */
  refreshUI() {
    // Recrear panel de estadísticas
    this.createStatsPanel(20, 20, 220, 160);
  }

  /**
   * Muestra un mensaje de tostada
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  showToast(message, duration = 2000) {
    const { width, height } = this.cameras.main;
    
    // Crear texto
    const toast = this.add.text(width / 2, height - 50, message, {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#00000080',
      padding: { x: 10, y: 5 }
    });
    toast.setOrigin(0.5);
    toast.alpha = 0;
    
    // Animación de entrada y salida
    this.tweens.add({
      targets: toast,
      y: height - 80,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Mantener visible
        this.time.delayedCall(duration, () => {
          this.tweens.add({
            targets: toast,
            y: height - 50,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              toast.destroy();
            }
          });
        });
      }
    });
  }

  /**
   * Inicia una nueva expedición
   */
  startNewExpedition() {
    // Transición de salida
    this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
      if (progress === 1) {
        // Iniciar escena de juego con los datos actualizados del jugador
        this.scene.start('GameScene', { playerData: this.playerData });
      }
    });
  }
}