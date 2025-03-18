// src/entities/player/PlayerVisuals.js

/**
 * Gestiona los aspectos visuales del jugador
 */
export default class PlayerVisuals {
    /**
     * Crea los elementos visuales del jugador
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     */
    static createSprite(scene, player) {
      // Limpiar sprite anterior si existe
      if (player.sprite) {
        player.sprite.destroy();
      }
      
      // Contenedor para elementos visuales
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo principal (un rectángulo verde para el MVP)
      const body = scene.add.rectangle(0, 0, 16, 16, 0x00aa00);
      sprite.add(body);
      
      // Cabeza
      const head = scene.add.circle(0, -10, 8, 0x00cc00);
      sprite.add(head);
      
      // Ojos
      const leftEye = scene.add.circle(-3, -11, 2, 0xffffff);
      const rightEye = scene.add.circle(3, -11, 2, 0xffffff);
      const leftPupil = scene.add.circle(-3, -11, 1, 0x000000);
      const rightPupil = scene.add.circle(3, -11, 1, 0x000000);
      sprite.add(leftEye);
      sprite.add(rightEye);
      sprite.add(leftPupil);
      sprite.add(rightPupil);
      
      // Añadir al jugador
      player.add(sprite);
      
      // Animación idle
      scene.tweens.add({
        targets: sprite,
        y: -2,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      return sprite;
    }
    
    /**
     * Crea un emisor de partículas para el jugador
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     */
    static createParticleEmitter(scene, player) {
      // Emisor básico para efectos del jugador (desactivado por defecto)
      const particleEmitter = scene.add.particles(0, 0, 'placeholder', {
        x: player.x,
        y: player.y,
        speed: { min: 20, max: 50 },
        scale: { start: 0.4, end: 0 },
        lifespan: 300,
        quantity: 1,
        frequency: -1 // -1 = emisión manual
      });
      
      return particleEmitter;
    }
    
    /**
     * Actualiza la posición de los efectos visuales
     * @param {Player} player - Instancia del jugador
     */
    static updateVisuals(player) {
      // Actualizar posición de efectos
      if (player.particleEmitter) {
        player.particleEmitter.setPosition(player.x, player.y);
      }
    }
    
    /**
     * Reproduce animación de ataque
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     * @param {Entity} target - Objetivo del ataque
     */
    static playAttackAnimation(scene, player, target) {
      // Flash en el sprite
      scene.tweens.add({
        targets: player.sprite,
        scaleX: 1.3,
        scaleY: 0.9,
        duration: 100,
        yoyo: true
      });
      
      // Línea de ataque
      const line = scene.add.line(
        0, 0,
        player.x, player.y,
        target.x, target.y,
        0x00ff00, 0.5
      );
      line.setOrigin(0, 0);
      
      // Desvanecer línea
      scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          line.destroy();
        }
      });
    }
    
    /**
     * Reproduce animación de inicio de combate
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     */
    static playStartCombatEffect(scene, player) {
      if (!player.targetEnemy) return;
      
      // Flash rápido en el sprite
      scene.tweens.add({
        targets: player.sprite,
        alpha: 0.7,
        yoyo: true,
        duration: 100,
        repeat: 1
      });
      
      // Emisión de partículas de "iniciativa"
      if (player.particleEmitter) {
        player.particleEmitter.setPosition(player.x, player.y);
        player.particleEmitter.setSpeed({ min: 50, max: 100 });
        player.particleEmitter.setScale({ start: 0.5, end: 0 });
        player.particleEmitter.explode(5);
      }
      
      // Si existe el sistema de efectos de combate, usar eso en su lugar
      if (scene.combatEffectsSystem) {
        scene.combatEffectsSystem.createImpact(player.x, player.y, {
          size: 0.8,
          color: 0x00ff00,
          particles: 5
        });
      }
    }
    
    /**
     * Reproduce animación de subida de nivel
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     * @param {number} level - Nuevo nivel
     */
    static playLevelUpEffect(scene, player, level) {
      // Si existe el sistema de efectos de combate
      if (scene.combatEffectsSystem) {
        scene.combatEffectsSystem.createLevelUpEffect(player, level);
        return;
      }
      
      // Efecto de nivel básico
      const levelUpText = scene.add.text(player.x, player.y - 50, '¡NIVEL UP!', {
        font: 'bold 16px Arial',
        fill: '#ffff00'
      });
      levelUpText.setOrigin(0.5, 0.5);
      
      // Animación de nivel
      scene.tweens.add({
        targets: levelUpText,
        y: levelUpText.y - 30,
        alpha: 0,
        duration: 2000,
        onComplete: () => {
          levelUpText.destroy();
        }
      });
      
      // Efecto visual en el jugador
      scene.tweens.add({
        targets: player,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        yoyo: true
      });
    }
    
    /**
     * Muestra texto de experiencia ganada
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     * @param {number} amount - Cantidad de experiencia
     */
    static showExperienceText(scene, player, amount) {
      // Mostrar texto de experiencia
      const expText = scene.add.text(player.x, player.y - 40, `+${amount} EXP`, {
        font: '12px Arial',
        fill: '#ffff00'
      });
      expText.setOrigin(0.5, 0.5);
      
      // Animación
      scene.tweens.add({
        targets: expText,
        y: expText.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => {
          expText.destroy();
        }
      });
    }
    
    /**
     * Muestra texto de oro ganado
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     * @param {number} amount - Cantidad de oro
     */
    static showGoldText(scene, player, amount) {
      // Mostrar texto de oro
      const goldText = scene.add.text(player.x, player.y - 30, `+${amount} Oro`, {
        font: '12px Arial',
        fill: '#ffd700'
      });
      goldText.setOrigin(0.5, 0.5);
      
      // Animación
      scene.tweens.add({
        targets: goldText,
        y: goldText.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => {
          goldText.destroy();
        }
      });
    }
    
    /**
     * Actualiza la visualización basada en equipo
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Player} player - Instancia del jugador
     * @param {Object} item - Objeto equipado
     */
    static updateEquipmentVisuals(scene, player, item) {
      // En el futuro, aquí se cambiará la apariencia según equipo
      // En el MVP solo mostramos un efecto
      if (scene.combatEffectsSystem) {
        let color;
        switch (item.rarity) {
          case 'raro': color = 0xaa00ff; break;
          case 'inusual': color = 0x0088ff; break;
          default: color = 0xffffff;
        }
        
        scene.combatEffectsSystem.createStatusEffect(player, 'buff', 2000);
      }
    }
  }