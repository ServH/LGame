// src/scenes/BaseScene.js - Mejora de integración con GameScene
import Phaser from 'phaser';

export default class BaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BaseScene' });
    
    // Datos del jugador
    this.playerData = null;
    
    // Datos de recompensa
    this.rewardData = null;
    
    // Estructuras de la base
    this.structures = [];
    
    // Nivel de mejoras de la base
    this.baseUpgrades = {
      campfire: 0, // Mejora la regeneración de vida
      forge: 0,    // Mejora el daño
      library: 0,  // Mejora la experiencia ganada
      garden: 0    // Mejora la cantidad de oro obtenido
    };
    
    // UI Elements
    this.menuItems = [];
    this.selectedMenuItem = 0;
    
    // Estado de transición
    this.isTransitioning = false;
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
    
    // Recuperar el nivel de mejoras guardado en localStorage si existe
    this.loadBaseUpgrades();
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
    
    // Aplicar recompensas si existen
    if (this.rewardData) {
      this.applyRewards();
    }
    
    console.log('BaseScene iniciada');
  }

  /**
   * Carga las mejoras de la base desde localStorage
   */
  loadBaseUpgrades() {
    try {
      const savedUpgrades = localStorage.getItem('baseUpgrades');
      if (savedUpgrades) {
        this.baseUpgrades = JSON.parse(savedUpgrades);
      }
    } catch (e) {
      console.error('Error cargando mejoras de la base:', e);
    }
  }

  /**
   * Guarda las mejoras de la base en localStorage
   */
  saveBaseUpgrades() {
    try {
      localStorage.setItem('baseUpgrades', JSON.stringify(this.baseUpgrades));
    } catch (e) {
      console.error('Error guardando mejoras de la base:', e);
    }
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
        id: 'campfire',
        name: 'Hoguera',
        description: 'Mejora la regeneración de vida',
        x: width / 5,
        y: height - 120,
        width: 60,
        height: 50,
        color: 0x884400,
        level: this.baseUpgrades.campfire || 0,
        upgradeCost: level => 10 + (level * 5),
        maxLevel: 5,
        upgradeEffect: 'Regeneración de vida +0.2% por segundo por nivel'
      },
      {
        id: 'forge',
        name: 'Herrería',
        description: 'Mejora el daño causado',
        x: 2 * width / 5,
        y: height - 130,
        width: 80,
        height: 70,
        color: 0x666666,
        level: this.baseUpgrades.forge || 0,
        upgradeCost: level => 15 + (level * 8),
        maxLevel: 5,
        upgradeEffect: 'Daño +5% por nivel'
      },
      {
        id: 'library',
        name: 'Biblioteca',
        description: 'Aumenta la experiencia ganada',
        x: 3 * width / 5,
        y: height - 110,
        width: 70,
        height: 60,
        color: 0x885500,
        level: this.baseUpgrades.library || 0,
        upgradeCost: level => 12 + (level * 7),
        maxLevel: 5,
        upgradeEffect: 'Experiencia +10% por nivel'
      },
      {
        id: 'garden',
        name: 'Jardín',
        description: 'Aumenta el oro obtenido',
        x: 4 * width / 5,
        y: height - 100,
        width: 80,
        height: 40,
        color: 0x227722,
        level: this.baseUpgrades.garden || 0,
        upgradeCost: level => 8 + (level * 6),
        maxLevel: 5,
        upgradeEffect: 'Oro +8% por nivel'
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
      
      // Decoraciones específicas según el tipo
      switch (data.id) {
        case 'campfire':
          // Crear hoguera
          const fireBase = this.add.polygon(
            data.x, data.y + data.height/2 - 5,
            [0, 0, -15, 10, 15, 10],
            0x553311
          );
          
          // Llamas
          const fire = this.add.polygon(
            data.x, data.y + data.height/2 - 15,
            [0, -20, -10, 0, 10, 0],
            0xff6600
          );
          
          // Animar llamas
          this.tweens.add({
            targets: fire,
            scaleX: 0.8,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
          });
          break;
          
        case 'forge':
          // Chimenea
          this.add.rectangle(
            data.x + 30,
            data.y - data.height/2 - 20,
            20,
            30,
            0x555555
          );
          
          // Yunque
          this.add.rectangle(
            data.x - 15,
            data.y + 15,
            30,
            10,
            0x444444
          );
          break;
          
        case 'library':
          // Techo
          this.add.triangle(
            data.x,
            data.y - data.height/2,
            -data.width/2 - 10, 0,
            data.width/2 + 10, 0,
            0, -30,
            0xaa7700
          );
          
          // Libros en estantes (rectángulos pequeños de colores)
          for (let i = 0; i < 3; i++) {
            const y = data.y - data.height/4 + i * 15;
            for (let j = 0; j < 5; j++) {
              const bookColor = Phaser.Utils.Array.GetRandom([
                0x884400, 0x336699, 0x663399, 0x339944
              ]);
              this.add.rectangle(
                data.x - data.width/3 + j * 12,
                y,
                8,
                10,
                bookColor
              );
            }
          }
          break;
          
        case 'garden':
          // Plantas
          for (let i = 0; i < 5; i++) {
            const x = data.x - data.width/2 + 10 + i * (data.width - 20)/4;
            
            // Tallo
            this.add.rectangle(
              x,
              data.y - 5,
              2,
              20,
              0x227722
            );
            
            // Hojas/flores
            const plantTop = this.add.circle(
              x,
              data.y - 20,
              5,
              Phaser.Utils.Array.GetRandom([0x22aa22, 0x99dd00, 0xddff00])
            );
            
            // Animar plantas
            this.tweens.add({
              targets: plantTop,
              y: plantTop.y - 3,
              duration: 2000 + i * 300,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
          break;
      }
      
      // Indicador de nivel
      const levelText = this.add.text(
        data.x,
        data.y - data.height/2 - 15,
        `Niv. ${data.level}/${data.maxLevel}`,
        {
          font: '12px Arial',
          fill: data.level >= data.maxLevel ? '#ffff00' : '#ffffff'
        }
      );
      levelText.setOrigin(0.5);
      
      // Nombre de la estructura
      const nameText = this.add.text(
        data.x,
        data.y + data.height/2 + 15,
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
        
        // Mostrar descripción y efecto de mejora
        let tooltipText = `${data.description}\n` + 
                          `${data.upgradeEffect}\n` + 
                          `Nivel actual: ${data.level}/${data.maxLevel}`;
        
        if (data.level < data.maxLevel) {
          tooltipText += `\nMejora: ${data.upgradeCost(data.level)} oro`;
        } else {
          tooltipText += '\n¡Nivel máximo!';
        }
        
        this.showTooltip(data.x, data.y - data.height/2 - 40, tooltipText);
      });
      
      structure.on('pointerout', () => {
        structure.setStrokeStyle(0);
        nameText.setStyle({ font: '14px Arial' });
        this.hideTooltip();
      });
      
      structure.on('pointerdown', () => {
        this.openStructureMenu(data);
      });
      
      // Guardar referencia
      this.structures.push({
        id: data.id,
        structure,
        nameText,
        levelText,
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
      { label: 'Vida', value: `${Math.ceil(this.playerData.health)}/${this.playerData.maxHealth}` },
      { label: 'Ataque', value: this.playerData.attack.toFixed(1) },
      { label: 'Defensa', value: this.playerData.defense.toFixed(1) },
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
    
    // Calcular dimensiones según el texto
    const lines = text.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const tooltipWidth = Math.max(200, maxLineLength * 7);
    const tooltipHeight = 20 + lines.length * 16;
    
    // Fondo
    this.tooltip = {
      bg: this.add.rectangle(
        x,
        y,
        tooltipWidth,
        tooltipHeight,
        0x000000,
        0.8
      ),
      text: this.add.text(
        x,
        y,
        text,
        {
          font: '12px Arial',
          fill: '#ffffff',
          align: 'center'
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
    if (this.rewardData && (this.rewardData.gold > 0 || this.rewardData.experience > 0)) {
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
   * Aplica las recompensas obtenidas
   */
  applyRewards() {
    if (!this.rewardData) return;
    
    // Añadir oro y experiencia
    this.playerData.gold += this.rewardData.gold || 0;
    
    // La experiencia maneja subida de nivel si corresponde
    if (this.rewardData.experience > 0) {
      let expRemaining = this.rewardData.experience;
      
      while (expRemaining > 0) {
        const expToLevel = this.playerData.experienceToNextLevel - this.playerData.experience;
        
        if (expRemaining >= expToLevel) {
          // Subir de nivel
          this.playerData.level++;
          this.playerData.experience = 0;
          expRemaining -= expToLevel;
          
          // Actualizar exp para siguiente nivel
          this.playerData.experienceToNextLevel = Math.floor(10 * Math.pow(1.5, this.playerData.level - 1));
          
          // Mejorar estadísticas
          this.playerData.maxHealth += 5;
          this.playerData.health = this.playerData.maxHealth;
          this.playerData.attack += 1;
          this.playerData.defense += 0.5;
        } else {
          // Añadir exp restante
          this.playerData.experience += expRemaining;
          expRemaining = 0;
        }
      }
    }
    
    // Actualizar la UI
    this.refreshUI();
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
      if (!this.structureMenu && !this.isTransitioning) {
        this.startNewExpedition();
      }
    });
  }

  /**
   * Abre el menú de una estructura
   * @param {Object} structureData - Datos de la estructura
   */
  openStructureMenu(structureData) {
    const { width, height } = this.cameras.main;
    
    // Si ya hay un menú abierto, cerrarlo
    if (this.structureMenu) {
      this.closeStructureMenu();
      return;
    }
    
    // Crear panel de menú
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
        structureData.name,
        {
          font: 'bold 24px Arial',
          fill: '#ffffff'
        }
      ),
      description: this.add.text(
        width / 2,
        height / 2 - 80,
        structureData.description,
        {
          font: '16px Arial',
          fill: '#ffffff',
          align: 'center'
        }
      ),
      effect: this.add.text(
        width / 2,
        height / 2 - 50,
        structureData.upgradeEffect,
        {
          font: '14px Arial',
          fill: '#aaaaaa',
          align: 'center'
        }
      ),
      level: this.add.text(
        width / 2,
        height / 2 - 20,
        `Nivel: ${structureData.level}/${structureData.maxLevel}`,
        {
          font: 'bold 16px Arial',
          fill: structureData.level >= structureData.maxLevel ? '#ffff00' : '#ffffff',
          align: 'center'
        }
      ),
      options: []
    };
    
    // Configurar objetos del menú
    this.structureMenu.panel.setStrokeStyle(2, 0xaaaaaa);
    this.structureMenu.title.setOrigin(0.5);
    this.structureMenu.description.setOrigin(0.5);
    this.structureMenu.effect.setOrigin(0.5);
    this.structureMenu.level.setOrigin(0.5);
    
    // Botón de mejora si no está al máximo nivel
    if (structureData.level < structureData.maxLevel) {
      const upgradeCost = structureData.upgradeCost(structureData.level);
      const canUpgrade = this.playerData.gold >= upgradeCost;
      
      const upgradeButton = this.add.rectangle(
        width / 2,
        height / 2 + 30,
        200,
        40,
        canUpgrade ? 0x006600 : 0x660000,
        canUpgrade ? 0.7 : 0.4
      );
      
      const upgradeText = this.add.text(
        width / 2,
        height / 2 + 30,
        `Mejorar (${upgradeCost} oro)`,
        {
          font: '16px Arial',
          fill: canUpgrade ? '#ffffff' : '#aaaaaa'
        }
      );
      upgradeText.setOrigin(0.5);
      
      // Hacer interactivo solo si puede mejorar
      if (canUpgrade) {
        upgradeButton.setInteractive();
        
        upgradeButton.on('pointerover', () => {
          upgradeButton.setFillStyle(0x008800, 0.9);
        });
        
        upgradeButton.on('pointerout', () => {
          upgradeButton.setFillStyle(0x006600, 0.7);
        });
        
        upgradeButton.on('pointerdown', () => {
          this.upgradeStructure(structureData);
        });
      }
      
      this.structureMenu.options.push({
        button: upgradeButton,
        text: upgradeText
      });
    } else {
      // Texto de nivel máximo
      const maxText = this.add.text(
        width / 2,
        height / 2 + 30,
        '¡Nivel Máximo Alcanzado!',
        {
          font: 'bold 16px Arial',
          fill: '#ffff00'
        }
      );
      maxText.setOrigin(0.5);
      
      this.structureMenu.options.push({
        text: maxText
      });
    }
    
    // Acciones especiales según la estructura
    switch (structureData.id) {
      case 'campfire':
        // Opción para descansar y recuperar vida
        const restButton = this.add.rectangle(
          width / 2,
          height / 2 + 80,
          200,
          40,
          0x555555,
          0.7
        );
        restButton.setInteractive();
        
        const restText = this.add.text(
          width / 2,
          height / 2 + 80,
          'Descansar (recuperar vida)',
          {
            font: '16px Arial',
            fill: '#ffffff'
          }
        );
        restText.setOrigin(0.5);
        
        restButton.on('pointerover', () => {
          restButton.setFillStyle(0x777777, 0.9);
        });
        
        restButton.on('pointerout', () => {
          restButton.setFillStyle(0x555555, 0.7);
        });
        
        restButton.on('pointerdown', () => {
          this.playerData.health = this.playerData.maxHealth;
          this.showToast('¡Vida completamente recuperada!');
          this.refreshUI();
          this.closeStructureMenu();
        });
        
        this.structureMenu.options.push({
          button: restButton,
          text: restText
        });
        break;
    }
    
    // Botón de cerrar
    const closeButton = this.add.rectangle(
      width / 2,
      height / 2 + 130,
      100,
      30,
      0x555555
    );
    closeButton.setInteractive();
    
    const closeText = this.add.text(
      width / 2,
      height / 2 + 130,
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
    const menuElements = [
      this.structureMenu.overlay, 
      this.structureMenu.panel, 
      this.structureMenu.title, 
      this.structureMenu.description,
      this.structureMenu.effect,
      this.structureMenu.level,
      this.structureMenu.closeButton, 
      this.structureMenu.closeText
    ];
    
    this.structureMenu.options.forEach(option => {
      if (option.button) menuElements.push(option.button);
      if (option.text) menuElements.push(option.text);
    });
    
    menuElements.forEach(element => element.alpha = 0);
    
    this.tweens.add({
      targets: menuElements,
      alpha: 1,
      duration: 200
    });
  }

  /**
   * Mejora una estructura
   * @param {Object} structureData - Datos de la estructura
   */
  upgradeStructure(structureData) {
    // Verificar que puede mejorar
    const currentLevel = this.baseUpgrades[structureData.id] || 0;
    const maxLevel = structureData.maxLevel;
    
    if (currentLevel >= maxLevel) {
      this.showToast('Esta estructura ya está al nivel máximo');
      return;
    }
    
    // Calcular costo
    const upgradeCost = structureData.upgradeCost(currentLevel);
    
    // Verificar oro suficiente
    if (this.playerData.gold < upgradeCost) {
      this.showToast('No tienes suficiente oro para esta mejora');
      return;
    }
    
    // Aplicar mejora
    this.baseUpgrades[structureData.id] = currentLevel + 1;
    
    // Restar oro
    this.playerData.gold -= upgradeCost;
    
    // Actualizar nivel en la estructura visual
    const structureObj = this.structures.find(s => s.id === structureData.id);
    if (structureObj) {
      structureObj.levelText.setText(`Niv. ${currentLevel + 1}/${maxLevel}`);
      if (currentLevel + 1 >= maxLevel) {
        structureObj.levelText.setStyle({ font: '12px Arial', fill: '#ffff00' });
      }
    }
    
    // Guardar mejoras
    this.saveBaseUpgrades();
    
    // Mostrar mensaje
    this.showToast(`¡${structureData.name} mejorada al nivel ${currentLevel + 1}!`);
    
    // Cerrar menú
    this.closeStructureMenu();
    
    // Actualizar UI
    this.refreshUI();
  }

  /**
   * Cierra el menú de estructura actual
   */
  closeStructureMenu() {
    if (!this.structureMenu) return;
    
    // Recopilar todos los elementos
    const elements = [
      this.structureMenu.overlay, 
      this.structureMenu.panel, 
      this.structureMenu.title, 
      this.structureMenu.description,
      this.structureMenu.effect,
      this.structureMenu.level,
      this.structureMenu.closeButton, 
      this.structureMenu.closeText
    ];
    
    this.structureMenu.options.forEach(option => {
      if (option.button) elements.push(option.button);
      if (option.text) elements.push(option.text);
    });
    
    // Efecto de salida
    this.tweens.add({
      targets: elements,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Destruir elementos
        elements.forEach(element => {
          if (element) element.destroy();
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
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    // Transición de salida
    this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
      if (progress === 1) {
        // Iniciar escena de juego con los datos actualizados del jugador
        this.scene.start('GameScene', { 
          playerData: this.playerData,
          baseUpgrades: this.baseUpgrades
        });
      }
    });
  }
}