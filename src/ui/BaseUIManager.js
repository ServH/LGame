// src/ui/BaseUIManager.js

/**
 * Gestor de interfaz de usuario para la base
 * Maneja toda la creación y actualización de elementos UI
 */
export default class BaseUIManager {
    /**
     * Inicializa el gestor de UI para la base
     * @param {Phaser.Scene} scene - Escena principal
     * @param {BaseManager} baseManager - Gestor de la base
     */
    constructor(scene, baseManager) {
      this.scene = scene;
      this.baseManager = baseManager;
      this.tooltip = null;
      this.structureMenu = null;
      
      // Suscribirse a eventos
      this.subscribeToEvents();
    }
  
    /**
     * Suscribe a eventos para actualizar la UI
     */
    subscribeToEvents() {
      this.scene.events.on('show-tooltip', this.showTooltip, this);
      this.scene.events.on('hide-tooltip', this.hideTooltip, this);
      this.scene.events.on('open-structure-menu', this.openStructureMenu, this);
      this.scene.events.on('player-data-updated', this.refreshUI, this);
      this.scene.events.on('player-rested', () => {
        this.showToast('¡Vida completamente recuperada!');
      });
      this.scene.events.on('structure-upgraded', (data) => {
        const structureDef = this.baseManager.getStructureDefinition(data.structureId);
        this.showToast(`¡${structureDef.name} mejorada al nivel ${data.newLevel}!`);
      });
    }
  
    /**
     * Crea el fondo de la base
     */
    createBackground() {
      const { width, height } = this.scene.cameras.main;
      
      // Fondo oscuro con grid
      this.scene.add.grid(
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
      this.scene.add.rectangle(
        width / 2,
        height - 100,
        width,
        200,
        0x333333
      );
      
      // Cielo
      const skyGradient = this.scene.add.graphics();
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
        
        const star = this.scene.add.circle(x, y, size, 0xffffff, alpha);
        
        // Algunas estrellas parpadean
        if (Math.random() < 0.3) {
          this.scene.tweens.add({
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
     * Crea la interfaz de usuario de la base
     * @param {Object} playerData - Datos del jugador
     */
    createUI(playerData) {
      const { width, height } = this.scene.cameras.main;
      
      // Panel de estadísticas
      this.createStatsPanel(20, 20, 220, 160, playerData);
      
      // Botón de salir
      const returnButton = this.scene.add.rectangle(
        width - 100,
        height - 40,
        160,
        50,
        0x555555
      );
      returnButton.setInteractive();
      
      const returnText = this.scene.add.text(
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
        this.scene.startNewExpedition();
      });
    }
  
    /**
     * Crea el panel de estadísticas del jugador
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho
     * @param {number} height - Alto
     * @param {Object} playerData - Datos del jugador
     */
    createStatsPanel(x, y, width, height, playerData) {
      // Fondo
      const panel = this.scene.add.rectangle(
        x + width / 2,
        y + height / 2,
        width,
        height,
        0x000000,
        0.7
      );
      panel.setStrokeStyle(1, 0xaaaaaa);
      
      // Título
      const title = this.scene.add.text(
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
        { label: 'Nivel', value: playerData.level, id: 'stat_level' },
        { label: 'Vida', value: `${Math.ceil(playerData.health)}/${playerData.maxHealth}`, id: 'stat_health' },
        { label: 'Ataque', value: playerData.attack.toFixed(1), id: 'stat_attack' },
        { label: 'Defensa', value: playerData.defense.toFixed(1), id: 'stat_defense' },
        { label: 'Velocidad', value: playerData.speed.toFixed(1), id: 'stat_speed' },
        { label: 'Oro', value: playerData.gold, id: 'stat_gold' }
      ];
      
      this.statTexts = {};
      
      stats.forEach((stat, index) => {
        const yPos = y + 40 + index * 20;
        
        // Etiqueta
        this.scene.add.text(
          x + 20,
          yPos,
          stat.label,
          {
            font: '14px Arial',
            fill: '#aaaaaa'
          }
        );
        
        // Valor
        const valueText = this.scene.add.text(
          x + width - 20,
          yPos,
          String(stat.value),
          {
            font: '14px Arial',
            fill: '#ffffff'
          }
        );
        valueText.setOrigin(1, 0);
        
        // Guardar referencia para actualización
        this.statTexts[stat.id] = valueText;
      });
    }
  
    /**
     * Muestra mensaje de bienvenida y recompensas
     * @param {Object} rewardData - Datos de recompensa (opcional)
     */
    showWelcomeMessage(rewardData = null) {
      const { width, height } = this.scene.cameras.main;
      
      // Texto de bienvenida
      const welcomeText = this.scene.add.text(
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
      if (rewardData && (rewardData.gold > 0 || rewardData.experience > 0)) {
        const rewardText = this.scene.add.text(
          width / 2,
          height / 4 + 50,
          `Has conseguido: ${rewardData.gold} de oro, ${rewardData.experience} de experiencia`,
          {
            font: '18px Arial',
            fill: '#ffff00'
          }
        );
        rewardText.setOrigin(0.5);
        
        // Animación
        this.scene.tweens.add({
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
        this.scene.tweens.add({
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
     * Muestra un tooltip
     * @param {Object} tooltipData - Datos del tooltip
     */
    showTooltip(tooltipData) {
      if (this.tooltip) {
        this.hideTooltip();
      }
      
      const { x, y, text } = tooltipData;
      
      // Calcular dimensiones según el texto
      const lines = text.split('\n');
      const maxLineLength = Math.max(...lines.map(line => line.length));
      const tooltipWidth = Math.max(200, maxLineLength * 7);
      const tooltipHeight = 20 + lines.length * 16;
      
      // Fondo
      this.tooltip = {
        bg: this.scene.add.rectangle(
          x,
          y,
          tooltipWidth,
          tooltipHeight,
          0x000000,
          0.8
        ),
        text: this.scene.add.text(
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
      
      this.scene.tweens.add({
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
      
      this.scene.tweens.add({
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
     * Abre el menú de una estructura
     * @param {string} structureId - ID de la estructura
     */
    openStructureMenu(structureId) {
      const { width, height } = this.scene.cameras.main;
      
      // Si ya hay un menú abierto, cerrarlo
      if (this.structureMenu) {
        this.closeActiveMenus();
        return;
      }
      
      // Obtener información de la estructura
      const structureData = this.baseManager.getStructureDefinition(structureId);
      if (!structureData) return;
      
      const level = this.baseManager.getUpgrades()[structureId] || 0;
      const maxLevel = structureData.maxLevel;
      
      // Crear panel de menú
      this.structureMenu = {
        id: structureId,
        overlay: this.scene.add.rectangle(
          width / 2,
          height / 2,
          width,
          height,
          0x000000,
          0.7
        ),
        panel: this.scene.add.rectangle(
          width / 2,
          height / 2,
          400,
          300,
          0x222222,
          0.9
        ),
        title: this.scene.add.text(
          width / 2,
          height / 2 - 120,
          structureData.name,
          {
            font: 'bold 24px Arial',
            fill: '#ffffff'
          }
        ),
        description: this.scene.add.text(
          width / 2,
          height / 2 - 80,
          structureData.description,
          {
            font: '16px Arial',
            fill: '#ffffff',
            align: 'center'
          }
        ),
        effect: this.scene.add.text(
          width / 2,
          height / 2 - 50,
          structureData.upgradeEffect,
          {
            font: '14px Arial',
            fill: '#aaaaaa',
            align: 'center'
          }
        ),
        level: this.scene.add.text(
          width / 2,
          height / 2 - 20,
          `Nivel: ${level}/${maxLevel}`,
          {
            font: 'bold 16px Arial',
            fill: level >= maxLevel ? '#ffff00' : '#ffffff',
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
      if (level < maxLevel) {
        const upgradeCost = structureData.upgradeCost(level);
        const canUpgrade = this.baseManager.getPlayerData().gold >= upgradeCost;
        
        const upgradeButton = this.scene.add.rectangle(
          width / 2,
          height / 2 + 30,
          200,
          40,
          canUpgrade ? 0x006600 : 0x660000,
          canUpgrade ? 0.7 : 0.4
        );
        
        const upgradeText = this.scene.add.text(
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
            this.baseManager.upgradeStructure(structureId);
            this.closeActiveMenus();
          });
        }
        
        this.structureMenu.options.push({
          button: upgradeButton,
          text: upgradeText
        });
      } else {
        // Texto de nivel máximo
        const maxText = this.scene.add.text(
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
      this.addStructureSpecificOptions(structureId);
      
      // Botón de cerrar
      const closeButton = this.scene.add.rectangle(
        width / 2,
        height / 2 + 130,
        100,
        30,
        0x555555
      );
      closeButton.setInteractive();
      
      const closeText = this.scene.add.text(
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
        this.closeActiveMenus();
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
      
      this.scene.tweens.add({
        targets: menuElements,
        alpha: 1,
        duration: 200
      });
    }
  
    /**
     * Añade opciones específicas según el tipo de estructura
     * @param {string} structureId - ID de la estructura
     */
    addStructureSpecificOptions(structureId) {
      if (!this.structureMenu) return;
      
      const { width, height } = this.scene.cameras.main;
      
      switch (structureId) {
        case 'campfire':
          // Opción para descansar y recuperar vida
          const restButton = this.scene.add.rectangle(
            width / 2,
            height / 2 + 80,
            200,
            40,
            0x555555,
            0.7
          );
          restButton.setInteractive();
          
          const restText = this.scene.add.text(
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
            this.baseManager.performStructureAction('campfire', 'rest');
            this.closeActiveMenus();
          });
          
          this.structureMenu.options.push({
            button: restButton,
            text: restText
          });
          break;
          
        // Otras estructuras pueden tener acciones adicionales
      }
    }
  
    /**
     * Cierra menús activos
     */
    closeActiveMenus() {
      this.closeStructureMenu();
    }
  
    /**
     * Comprueba si hay menús activos
     * @returns {boolean} Si hay algún menú abierto
     */
    hasActiveMenus() {
      return this.structureMenu !== null;
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
      this.scene.tweens.add({
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
     * @param {Object} playerData - Datos actualizados del jugador
     */
    refreshUI(playerData) {
      if (!playerData) return;
      
      // Actualizar estadísticas
      if (this.statTexts['stat_level']) {
        this.statTexts['stat_level'].setText(playerData.level.toString());
      }
      
      if (this.statTexts['stat_health']) {
        this.statTexts['stat_health'].setText(`${Math.ceil(playerData.health)}/${playerData.maxHealth}`);
      }
      
      if (this.statTexts['stat_attack']) {
        this.statTexts['stat_attack'].setText(playerData.attack.toFixed(1));
      }
      
      if (this.statTexts['stat_defense']) {
        this.statTexts['stat_defense'].setText(playerData.defense.toFixed(1));
      }
      
      if (this.statTexts['stat_speed']) {
        this.statTexts['stat_speed'].setText(playerData.speed.toFixed(1));
      }
      
      if (this.statTexts['stat_gold']) {
        this.statTexts['stat_gold'].setText(playerData.gold.toString());
        
        // Efectos visuales para oro
        this.scene.tweens.add({
          targets: this.statTexts['stat_gold'],
          scale: 1.2,
          duration: 150,
          yoyo: true
        });
      }
    }
  
    /**
     * Muestra un mensaje de tostada
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms
     */
    showToast(message, duration = 2000) {
      const { width, height } = this.scene.cameras.main;
      
      // Crear texto
      const toast = this.scene.add.text(width / 2, height - 50, message, {
        font: '16px Arial',
        fill: '#ffffff',
        backgroundColor: '#00000080',
        padding: { x: 10, y: 5 }
      });
      toast.setOrigin(0.5);
      toast.alpha = 0;
      
      // Animación de entrada y salida
      this.scene.tweens.add({
        targets: toast,
        y: height - 80,
        alpha: 1,
        duration: 300,
        onComplete: () => {
          // Mantener visible
          this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
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
  }