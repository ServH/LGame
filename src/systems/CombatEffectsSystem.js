// src/systems/CombatEffectsSystem.js
/**
 * Sistema que gestiona los efectos visuales de combate
 */
export default class CombatEffectsSystem {
    /**
     * Inicializa el sistema de efectos de combate
     * @param {Phaser.Scene} scene - Escena de Phaser
     */
    constructor(scene) {
      this.scene = scene;
      this.activeEffects = [];
    }
  
    /**
     * Inicializa el sistema con datos del juego
     * @param {Object} gameData - Datos iniciales
     */
    initialize(gameData) {
      // Nada específico por ahora
    }
  
    /**
     * Crea un efecto de impacto en una posición
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {Object} options - Opciones de personalización
     */
    createImpact(x, y, options = {}) {
      const { 
        size = 1, 
        color = 0xffffff, 
        duration = 300,
        particles = 8
      } = options;
      
      // Grupo para todos los elementos de este efecto
      const group = this.scene.add.group();
      
      // Círculo central
      const circle = this.scene.add.circle(x, y, 5 * size, color, 0.7);
      circle.setDepth(10);
      group.add(circle);
      
      // Animar círculo
      this.scene.tweens.add({
        targets: circle,
        alpha: 0,
        scale: 1.5,
        duration: duration,
        ease: 'Power2'
      });
      
      // Partículas (líneas)
      for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2;
        const length = 10 * size;
        
        const line = this.scene.add.line(
          x, y,
          0, 0,
          Math.cos(angle) * length, Math.sin(angle) * length,
          color, 0.7
        );
        line.setDepth(9);
        group.add(line);
        
        // Animar línea
        this.scene.tweens.add({
          targets: line,
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: duration,
          ease: 'Power2'
        });
      }
      
      // Limpiar después de la animación
      this.scene.time.delayedCall(duration, () => {
        group.clear(true, true);
        
        // Eliminar de la lista de efectos activos
        const index = this.activeEffects.indexOf(group);
        if (index !== -1) {
          this.activeEffects.splice(index, 1);
        }
      });
      
      this.activeEffects.push(group);
      return group;
    }
  
    /**
     * Crea un efecto de ataque entre dos entidades
     * @param {Entity} attacker - Entidad atacante
     * @param {Entity} defender - Entidad defensora
     * @param {Object} options - Opciones de personalización
     */
    createAttackEffect(attacker, defender, options = {}) {
      const { 
        color = 0xffffff,
        critical = false,
        duration = 200
      } = options;
      
      // Grupo para todos los elementos de este efecto
      const group = this.scene.add.group();
      
      // Línea de ataque
      const line = this.scene.add.line(
        0, 0,
        attacker.x, attacker.y,
        defender.x, defender.y,
        color, critical ? 0.8 : 0.5
      );
      line.setOrigin(0, 0);
      line.setDepth(5);
      group.add(line);
      
      // Animar línea
      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: duration,
        ease: 'Power2'
      });
      
      // Flash en el defensor
      if (defender.sprite) {
        this.scene.tweens.add({
          targets: defender.sprite,
          alpha: 0.5,
          yoyo: true,
          duration: duration / 2,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Efecto de impacto en el objetivo
      this.createImpact(defender.x, defender.y, {
        size: critical ? 1.5 : 1,
        color: critical ? 0xff0000 : color,
        duration: duration,
        particles: critical ? 12 : 8
      });
      
      // Limpiar después de la animación
      this.scene.time.delayedCall(duration, () => {
        group.clear(true, true);
        
        // Eliminar de la lista de efectos activos
        const index = this.activeEffects.indexOf(group);
        if (index !== -1) {
          this.activeEffects.splice(index, 1);
        }
      });
      
      this.activeEffects.push(group);
      return group;
    }
  
    /**
     * Crea un efecto de curación
     * @param {Entity} entity - Entidad que recibe la curación
     * @param {number} amount - Cantidad de curación
     */
    createHealEffect(entity, amount) {
      const x = entity.x;
      const y = entity.y;
      
      // Grupo para todos los elementos de este efecto
      const group = this.scene.add.group();
      
      // Partículas de curación (pequeños círculos que suben)
      for (let i = 0; i < 8; i++) {
        const offsetX = Math.random() * 20 - 10;
        const startY = Math.random() * 10;
        
        const particle = this.scene.add.circle(
          x + offsetX,
          y + startY,
          2,
          0x00ff00,
          0.7
        );
        particle.setDepth(10);
        group.add(particle);
        
        // Animar partícula
        this.scene.tweens.add({
          targets: particle,
          y: y - 20 - Math.random() * 10,
          alpha: 0,
          duration: 1000,
          ease: 'Sine.easeOut'
        });
      }
      
      // Texto de curación
      const healText = this.scene.add.text(x, y - 15, `+${amount}`, {
        font: '14px Arial',
        fill: '#00ff00',
        stroke: '#000000',
        strokeThickness: 3
      });
      healText.setOrigin(0.5, 0.5);
      healText.setDepth(15);
      group.add(healText);
      
      // Animar texto
      this.scene.tweens.add({
        targets: healText,
        y: y - 35,
        alpha: 0,
        duration: 1500,
        ease: 'Power2'
      });
      
      // Limpiar después de la animación
      this.scene.time.delayedCall(1500, () => {
        group.clear(true, true);
        
        // Eliminar de la lista de efectos activos
        const index = this.activeEffects.indexOf(group);
        if (index !== -1) {
          this.activeEffects.splice(index, 1);
        }
      });
      
      this.activeEffects.push(group);
      return group;
    }
  
    /**
     * Crea un efecto de muerte
     * @param {Entity} entity - Entidad que muere
     */
    createDeathEffect(entity) {
      const x = entity.x;
      const y = entity.y;
      
      // Grupo para todos los elementos de este efecto
      const group = this.scene.add.group();
      
      // Onda expansiva
      const wave = this.scene.add.circle(x, y, 5, 0xffffff, 0.5);
      wave.setDepth(5);
      group.add(wave);
      
      // Animar onda
      this.scene.tweens.add({
        targets: wave,
        radius: 40,
        alpha: 0,
        duration: 500,
        ease: 'Power2'
      });
      
      // Partículas que se alejan del centro
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        
        const particle = this.scene.add.circle(
          x,
          y,
          2 + Math.random() * 2,
          0xaaaaaa,
          0.7
        );
        particle.setDepth(6);
        group.add(particle);
        
        // Animar partícula
        this.scene.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          duration: 700,
          ease: 'Power2'
        });
      }
      
      // Limpiar después de la animación
      this.scene.time.delayedCall(700, () => {
        group.clear(true, true);
        
        // Eliminar de la lista de efectos activos
        const index = this.activeEffects.indexOf(group);
        if (index !== -1) {
          this.activeEffects.splice(index, 1);
        }
      });
      
      this.activeEffects.push(group);
      return group;
    }
  
    /**
     * Crea un efecto de nivel subido
     * @param {Entity} entity - Entidad que sube de nivel
     * @param {number} level - Nuevo nivel
     */
    createLevelUpEffect(entity, level) {
      const x = entity.x;
      const y = entity.y;
      
      // Grupo para todos los elementos de este efecto
      const group = this.scene.add.group();
      
      // Anillos concéntricos
      for (let i = 0; i < 3; i++) {
        const delay = i * 200;
        const ring = this.scene.add.circle(x, y, 10, 0xffff00, 0.7);
        ring.setDepth(5);
        group.add(ring);
        
        // Animar anillo
        this.scene.tweens.add({
          targets: ring,
          radius: 40,
          alpha: 0,
          delay: delay,
          duration: 800,
          ease: 'Sine.easeOut'
        });
      }
      
      // Estrellas alrededor del personaje
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const starX = x + Math.cos(angle) * 20;
        const starY = y + Math.sin(angle) * 20;
        
        // Estrella (círculo por ahora, se podría mejorar con sprites)
        const star = this.scene.add.circle(starX, starY, 3, 0xffff00, 0.9);
        star.setDepth(6);
        group.add(star);
        
        // Animar estrella
        this.scene.tweens.add({
          targets: star,
          y: starY - 10,
          alpha: 0,
          duration: 1000,
          delay: Math.random() * 500,
          ease: 'Sine.easeOut'
        });
      }
      
      // Texto de nivel
      const levelText = this.scene.add.text(x, y - 30, `¡NIVEL ${level}!`, {
        font: 'bold 16px Arial',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      });
      levelText.setOrigin(0.5, 0.5);
      levelText.setDepth(10);
      group.add(levelText);
      
      // Animar texto
      this.scene.tweens.add({
        targets: levelText,
        y: y - 50,
        alpha: 0,
        duration: 1500,
        ease: 'Power2'
      });
      
      // Limpiar después de la animación
      this.scene.time.delayedCall(1500, () => {
        group.clear(true, true);
        
        // Eliminar de la lista de efectos activos
        const index = this.activeEffects.indexOf(group);
        if (index !== -1) {
          this.activeEffects.splice(index, 1);
        }
      });
      
      this.activeEffects.push(group);
      return group;
    }
  
    /**
     * Crea un efecto para un objeto que cae
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {Object} options - Opciones de personalización
     */
    createItemDropEffect(x, y, options = {}) {
      const {
        color = 0xffffff,
        rarity = 'común',
        duration = 1500
      } = options;
      
      // Colores según rareza
      let itemColor = color;
      if (rarity === 'raro') {
        itemColor = 0xaa00ff; // Púrpura
      } else if (rarity === 'inusual') {
        itemColor = 0x0088ff; // Azul
      } else if (color === 0xffffff) { // Si no se especificó un color personalizado
        itemColor = 0xaaaaaa; // Gris para items comunes
      }
      
      // Grupo para todos los elementos de este efecto
      const group = this.scene.add.group();
      
      // Sprite del objeto (círculo por ahora)
      const itemSprite = this.scene.add.circle(x, y, 4, itemColor, 0.9);
      itemSprite.setDepth(10);
      group.add(itemSprite);
      
      // Resplandor alrededor (para objetos raros)
      if (rarity === 'raro' || rarity === 'inusual') {
        const glow = this.scene.add.circle(x, y, 8, itemColor, 0.4);
        glow.setDepth(9);
        group.add(glow);
        
        // Animar resplandor
        this.scene.tweens.add({
          targets: glow,
          scale: 1.5,
          alpha: 0,
          duration: 1000,
          repeat: -1
        });
      }
      
      // Texto flotante
      let dropText;
      if (rarity !== 'común') {
        dropText = this.scene.add.text(x, y - 15, rarity, {
          font: rarity === 'raro' ? 'bold 12px Arial' : '10px Arial',
          fill: rarity === 'raro' ? '#aa00ff' : '#0088ff',
          stroke: '#000000',
          strokeThickness: 3
        });
        dropText.setOrigin(0.5, 0.5);
        dropText.setDepth(11);
        group.add(dropText);
        
        // Animar texto
        this.scene.tweens.add({
          targets: dropText,
          y: y - 30,
          alpha: 0,
          duration: duration,
          ease: 'Power2'
        });
      }
      
      // Animar el objeto
      this.scene.tweens.add({
        targets: itemSprite,
        y: y - 10,
        yoyo: true,
        repeat: 2,
        duration: 300,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Desvanecer al final
          this.scene.tweens.add({
            targets: itemSprite,
            alpha: 0,
            duration: 300,
            ease: 'Power2'
          });
        }
      });
      
      // Limpiar después de la animación
      this.scene.time.delayedCall(duration, () => {
        group.clear(true, true);
        
        // Eliminar de la lista de efectos activos
        const index = this.activeEffects.indexOf(group);
        if (index !== -1) {
          this.activeEffects.splice(index, 1);
        }
      });
      
      this.activeEffects.push(group);
      return group;
    }
  
    /**
     * Crea un efecto persistente en una entidad
     * @param {Entity} entity - Entidad afectada
     * @param {string} effectType - Tipo de efecto ('buff', 'debuff', etc)
     * @param {number} duration - Duración en ms, 0 para efectos permanentes
     */
    createStatusEffect(entity, effectType, duration = 0) {
      // Determinar color según tipo de efecto
      let color;
      switch (effectType) {
        case 'buff':
          color = 0x00ff00; // Verde
          break;
        case 'debuff':
          color = 0xff0000; // Rojo
          break;
        case 'poison':
          color = 0x00ff88; // Verde tóxico
          break;
        case 'burn':
          color = 0xff8800; // Naranja
          break;
        default:
          color = 0xffffff; // Blanco por defecto
      }
      
      // Grupo para todos los elementos de este efecto
      const group = this.scene.add.group();
      
      // Partículas que orbitan la entidad
      const particleCount = effectType === 'buff' ? 5 : 3;
      const particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const particle = this.scene.add.circle(entity.x, entity.y, 2, color, 0.7);
        particle.setDepth(5);
        particle.angle = (i / particleCount) * 360; // Distribuir alrededor
        particle.distance = 15; // Radio de órbita
        group.add(particle);
        particles.push(particle);
      }
      
      // Información del efecto
      const effect = {
        entity,
        type: effectType,
        particles,
        group,
        startTime: this.scene.time.now,
        duration,
        update: (time, delta) => {
          if (!entity.active) return false; // Terminar si la entidad ya no existe
          
          // Actualizar posición de las partículas
          particles.forEach((particle, index) => {
            particle.angle += 1 * (index % 2 === 0 ? 1 : -1); // Alternar dirección
            
            // Posición en órbita
            particle.x = entity.x + Math.cos(particle.angle * Math.PI / 180) * particle.distance;
            particle.y = entity.y + Math.sin(particle.angle * Math.PI / 180) * particle.distance;
          });
          
          // Comprobar si el efecto debe terminar
          if (duration > 0 && time > effect.startTime + duration) {
            this.removeStatusEffect(effect);
            return false; // Indicar que el efecto ha terminado
          }
          
          return true; // Efecto continúa
        }
      };
      
      // Añadir a la lista de efectos activos
      this.activeEffects.push(effect);
      
      return effect;
    }
  
    /**
     * Elimina un efecto de estado
     * @param {Object} effect - Efecto a eliminar
     */
    removeStatusEffect(effect) {
      if (!effect || !effect.group) return;
      
      // Animar desaparición
      this.scene.tweens.add({
        targets: effect.particles,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          effect.group.clear(true, true);
          
          // Eliminar de la lista de efectos activos
          const index = this.activeEffects.indexOf(effect);
          if (index !== -1) {
            this.activeEffects.splice(index, 1);
          }
        }
      });
    }
  
    /**
     * Crea un efecto visual para la aparición de un jefe
     * @param {Enemy} boss - Jefe que aparece
     */
    createBossSpawnEffect(boss) {
      // Crear onda expansiva
      const wave = this.scene.add.circle(boss.x, boss.y, 10, 0xff0000, 0.3);
      wave.setDepth(5);
      
      // Animar onda
      this.scene.tweens.add({
        targets: wave,
        radius: 100,
        alpha: 0,
        duration: 1000,
        ease: 'Sine.easeOut',
        onComplete: () => {
          wave.destroy();
        }
      });
      
      // Flash en el jefe
      if (boss.sprite) {
        this.scene.tweens.add({
          targets: boss.sprite,
          alpha: 0.3,
          yoyo: true,
          repeat: 3,
          duration: 150
        });
      }
      
      // Texto de alerta
      const bossText = this.scene.add.text(boss.x, boss.y - 40, '¡JEFE!', {
        font: 'bold 24px Arial',
        fill: '#ff0000',
        stroke: '#000000',
        strokeThickness: 4
      });
      bossText.setOrigin(0.5);
      bossText.setDepth(20);
      
      // Animar texto
      this.scene.tweens.add({
        targets: bossText,
        y: boss.y - 80,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => {
          bossText.destroy();
        }
      });
    }
  
    /**
     * Crea un efecto para la invocación de minions
     * @param {Enemy} summoner - Enemigo que invoca
     * @param {Array} minions - Minions invocados
     */
    createSummonEffect(summoner, minions) {
      minions.forEach((minion, index) => {
        // Posición inicial cerca del invocador
        const originalX = minion.x;
        const originalY = minion.y;
        minion.x = summoner.x;
        minion.y = summoner.y;
        minion.alpha = 0.2;
        
        // Animar aparición
        this.scene.tweens.add({
          targets: minion,
          x: originalX,
          y: originalY,
          alpha: 1,
          duration: 500 + index * 100,
          ease: 'Power2',
          onComplete: () => {
            // Crear círculo de aparición
            const circle = this.scene.add.circle(
              originalX,
              originalY,
              10,
              0x00ff00,
              0.5
            );
            
            // Animar círculo
            this.scene.tweens.add({
              targets: circle,
              radius: 30,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                circle.destroy();
              }
            });
          }
        });
      });
    }
  
    /**
     * Crea un efecto para la división de un enemigo
     * @param {Enemy} parent - Enemigo que se divide
     * @param {Array} children - Enemigos resultantes
     */
    createSplitEffect(parent, children) {
      // Partículas en el punto de división
      const particles = [];
      
      // Crear partículas
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 20 + Math.random() * 10;
        const speed = 0.5 + Math.random() * 0.5;
        
        const particle = this.scene.add.circle(
          parent.x,
          parent.y,
          2 + Math.random() * 2,
          0x00ff00,
          0.7
        );
        particle.setDepth(6);
        
        // Animar partícula
        this.scene.tweens.add({
          targets: particle,
          x: parent.x + Math.cos(angle) * distance,
          y: parent.y + Math.sin(angle) * distance,
          alpha: 0,
          duration: 600 / speed,
          ease: 'Power2',
          onComplete: () => {
            particle.destroy();
          }
        });
        
        particles.push(particle);
      }
      
      // Líneas de conexión entre el padre y los hijos
      children.forEach(child => {
        const line = this.scene.add.line(
          0, 0,
          parent.x, parent.y,
          child.x, child.y,
          0x00ff00,
          0.8
        );
        line.setOrigin(0, 0);
        
        // Desvanecer línea
        this.scene.tweens.add({
          targets: line,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            line.destroy();
          }
        });
        
        // Hacer que el hijo sea inicialmente pequeño y crezca
        child.setScale(0.3);
        this.scene.tweens.add({
          targets: child,
          scale: 1,
          duration: 400,
          ease: 'Back.easeOut'
        });
      });
    }
  
    /**
     * Actualiza todos los efectos activos
     * @param {number} time - Tiempo actual
     * @param {number} delta - Tiempo desde el último frame
     */
    update(time, delta) {
      // Actualizar efectos activos
      for (let i = this.activeEffects.length - 1; i >= 0; i--) {
        const effect = this.activeEffects[i];
        
        // Si el efecto tiene función de actualización, ejecutarla
        if (effect.update && !effect.update(time, delta)) {
          // Si devuelve false, el efecto ha terminado y ya se ha limpiado
          this.activeEffects.splice(i, 1);
        }
      }
    }
  }