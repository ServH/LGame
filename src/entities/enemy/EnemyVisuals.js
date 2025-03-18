// src/entities/enemy/EnemyVisuals.js
/**
 * Encargado de crear y gestionar la representación visual de los enemigos
 */
export default class EnemyVisuals {
    /**
     * Crea la representación visual de un enemigo
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Enemy} enemy - Instancia del enemigo
     */
    static createSprite(scene, enemy) {
      // Limpiar sprite anterior si existe
      if (enemy.sprite) {
        enemy.sprite.destroy();
      }
  
      // Seleccionar método de creación según tipo
      switch (enemy.enemyType) {
        case 'slime':
          return this.createSlimeSprite(scene, enemy);
        case 'goblin':
          return this.createGoblinSprite(scene, enemy);
        case 'skeleton':
          return this.createSkeletonSprite(scene, enemy);
        case 'bat':
          return this.createBatSprite(scene, enemy);
        case 'spider':
          return this.createSpiderSprite(scene, enemy);
        case 'wolf':
          return this.createWolfSprite(scene, enemy);
        case 'troll':
          return this.createTrollSprite(scene, enemy);
        case 'ghost':
          return this.createGhostSprite(scene, enemy);
        default:
          return this.createDefaultSprite(scene, enemy);
      }
    }
  
    /**
     * Crea sprites específicos para cada tipo de enemigo
     */
    static createSlimeSprite(scene, enemy) {
      // Sprite slime (rectángulo redondeado verde)
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo principal
      const body = scene.add.graphics();
      body.fillStyle(0x55ff55, 1);
      body.fillRoundedRect(-8, -6, 16, 12, 6);
      
      // Ojos simples
      body.fillStyle(0x000000, 1);
      body.fillCircle(-3, -2, 1.5);
      body.fillCircle(3, -2, 1.5);
      
      sprite.add(body);
      enemy.add(sprite);
      
      // Animación de rebote constante
      scene.tweens.add({
        targets: sprite,
        scaleY: 0.85,
        scaleX: 1.15,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      return sprite;
    }
    
    static createGoblinSprite(scene, enemy) {
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo principal
      const body = scene.add.rectangle(0, 0, 12, 14, 0x77cc77);
      sprite.add(body);
      
      // Cabeza
      const head = scene.add.circle(0, -9, 6, 0x77cc77);
      sprite.add(head);
      
      // Ojos
      const leftEye = scene.add.circle(-2, -10, 1.5, 0xff0000);
      const rightEye = scene.add.circle(2, -10, 1.5, 0xff0000);
      sprite.add(leftEye);
      sprite.add(rightEye);
      
      // Arma simple
      const weapon = scene.add.rectangle(8, 0, 6, 2, 0x8B4513);
      sprite.add(weapon);
      
      enemy.add(sprite);
      
      // Animación de nerviosismo
      scene.tweens.add({
        targets: sprite,
        x: 1,
        duration: 200,
        yoyo: true,
        repeat: -1
      });
      
      return sprite;
    }
    
    static createSkeletonSprite(scene, enemy) {
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo principal
      const body = scene.add.rectangle(0, 0, 12, 16, 0xdddddd);
      sprite.add(body);
      
      // Cráneo
      const skull = scene.add.circle(0, -10, 6, 0xffffff);
      sprite.add(skull);
      
      // Ojos huecos
      const leftSocket = scene.add.circle(-2, -10, 1.5, 0x000000);
      const rightSocket = scene.add.circle(2, -10, 1.5, 0x000000);
      sprite.add(leftSocket);
      sprite.add(rightSocket);
      
      // Costillas (líneas)
      for (let i = -4; i <= 4; i += 2) {
        const rib = scene.add.line(0, i, -5, 0, 5, 0, 0xffffff);
        sprite.add(rib);
      }
      
      enemy.add(sprite);
      
      // Animación de balanceo lento
      scene.tweens.add({
        targets: sprite,
        angle: { from: -3, to: 3 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      return sprite;
    }
    
    static createBatSprite(scene, enemy) {
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo
      const body = scene.add.circle(0, 0, 5, 0x555555);
      sprite.add(body);
      
      // Alas
      const leftWing = scene.add.triangle(-3, 0, 0, 0, -12, -8, -12, 8, 0x555555);
      const rightWing = scene.add.triangle(3, 0, 0, 0, 12, -8, 12, 8, 0x555555);
      sprite.add(leftWing);
      sprite.add(rightWing);
      
      // Ojos
      const leftEye = scene.add.circle(-2, -1, 1, 0xff0000);
      const rightEye = scene.add.circle(2, -1, 1, 0xff0000);
      sprite.add(leftEye);
      sprite.add(rightEye);
      
      enemy.add(sprite);
      
      // Animación de aleteo
      scene.tweens.add({
        targets: [leftWing, rightWing],
        scaleX: 0.7,
        scaleY: 0.8,
        duration: 200,
        yoyo: true,
        repeat: -1
      });
      
      // Animación de flotación
      scene.tweens.add({
        targets: sprite,
        y: { from: 0, to: -3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      return sprite;
    }
    
    static createSpiderSprite(scene, enemy) {
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo
      const body = scene.add.circle(0, 0, 6, 0x000000);
      sprite.add(body);
      
      // Patas (8)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const legX = Math.cos(angle) * 8;
        const legY = Math.sin(angle) * 8;
        
        const leg = scene.add.line(0, 0, 0, 0, legX, legY, 0x000000);
        leg.setLineWidth(1.5);
        sprite.add(leg);
        
        // Animación individual de cada pata
        scene.tweens.add({
          targets: leg,
          rotation: { from: -0.1, to: 0.1 },
          duration: 300 + i * 50,
          yoyo: true,
          repeat: -1
        });
      }
      
      // Ojos (varios puntos)
      for (let i = -2; i <= 2; i += 2) {
        const eyeLeft = scene.add.circle(i - 0.5, -3, 0.8, 0xff0000);
        const eyeRight = scene.add.circle(i + 0.5, -3, 0.8, 0xff0000);
        sprite.add(eyeLeft);
        sprite.add(eyeRight);
      }
      
      enemy.add(sprite);
      
      return sprite;
    }
    
    static createWolfSprite(scene, enemy) {
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo
      const body = scene.add.rectangle(0, 0, 16, 10, 0x777777);
      sprite.add(body);
      
      // Cabeza
      const head = scene.add.rectangle(8, 0, 10, 8, 0x777777);
      sprite.add(head);
      
      // Orejas
      const ear1 = scene.add.triangle(10, -6, 0, 0, 3, -4, -3, -4, 0x777777);
      const ear2 = scene.add.triangle(13, -6, 0, 0, 3, -4, -3, -4, 0x777777);
      sprite.add(ear1);
      sprite.add(ear2);
      
      // Ojos
      const eye = scene.add.circle(10, -1, 1.5, 0xffff00);
      sprite.add(eye);
      
      // Cola
      const tail = scene.add.rectangle(-10, -2, 8, 3, 0x777777);
      tail.setOrigin(0, 0.5);
      sprite.add(tail);
      
      enemy.add(sprite);
      
      // Animación de cola
      scene.tweens.add({
        targets: tail,
        rotation: { from: -0.2, to: 0.2 },
        duration: 600,
        yoyo: true,
        repeat: -1
      });
      
      return sprite;
    }
    
    static createTrollSprite(scene, enemy) {
      const sprite = scene.add.container(0, 0);
      
      // Cuerpo corpulento
      const body = scene.add.rectangle(0, 0, 18, 20, 0x55aa55);
      sprite.add(body);
      
      // Cabeza
      const head = scene.add.circle(0, -14, 8, 0x55aa55);
      sprite.add(head);
      
      // Ojos pequeños
      const leftEye = scene.add.circle(-3, -15, 1.5, 0xff0000);
      const rightEye = scene.add.circle(3, -15, 1.5, 0xff0000);
      sprite.add(leftEye);
      sprite.add(rightEye);
      
      // Boca
      const mouth = scene.add.rectangle(0, -11, 8, 2, 0x000000);
      sprite.add(mouth);
      
      // Brazos grandes
      const arm1 = scene.add.rectangle(-12, -5, 6, 12, 0x55aa55);
      const arm2 = scene.add.rectangle(12, -5, 6, 12, 0x55aa55);
      sprite.add(arm1);
      sprite.add(arm2);
      
      enemy.add(sprite);
      
      // Animación de respiración pesada
      scene.tweens.add({
        targets: body,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 0.95 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      return sprite;
    }
    
    static createGhostSprite(scene, enemy) {
      const sprite = scene.add.container(0, 0);
      
      // Forma base del fantasma
      const ghostBody = scene.add.graphics();
      ghostBody.fillStyle(0xccccff, 0.7);
      ghostBody.fillCircle(0, 0, 10);
      ghostBody.fillRect(-10, 0, 20, 12);
      
      // Ondulaciones en la parte inferior
      for (let i = -8; i <= 8; i += 4) {
        ghostBody.fillCircle(i, 12, 4);
      }
      
      sprite.add(ghostBody);
      
      // Ojos
      const leftEye = scene.add.circle(-4, -2, 2, 0x000000);
      const rightEye = scene.add.circle(4, -2, 2, 0x000000);
      sprite.add(leftEye);
      sprite.add(rightEye);
      
      enemy.add(sprite);
      
      // Animación de fluctuación
      scene.tweens.add({
        targets: sprite,
        y: { from: 0, to: -4 },
        alpha: { from: 0.7, to: 1 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      return sprite;
    }
    
    static createDefaultSprite(scene, enemy) {
      const sprite = scene.add.rectangle(0, 0, 14, 14, 0xff5555);
      enemy.add(sprite);
      return sprite;
    }
  
    /**
     * Crea efectos visuales para jefes
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Enemy} enemy - Instancia del enemigo jefe
     */
    static createBossEffects(scene, enemy) {
      if (!enemy.sprite) return;
      
      // Aumentar tamaño
      enemy.sprite.setScale(1.5);
      
      // Aura de poder
      const aura = scene.add.graphics();
      aura.fillStyle(0xffff00, 0.2);
      aura.fillCircle(0, 0, 25);
      enemy.add(aura);
      
      // Pulsación del aura
      scene.tweens.add({
        targets: aura,
        alpha: { from: 0.2, to: 0.4 },
        scale: { from: 1, to: 1.1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Corona o indicador de jefe
      const crown = scene.add.graphics();
      crown.fillStyle(0xffcc00, 1);
      
      // Dibujar corona
      crown.moveTo(-8, -22);
      crown.lineTo(8, -22);
      crown.lineTo(10, -18);
      crown.lineTo(6, -20);
      crown.lineTo(2, -18);
      crown.lineTo(-2, -20);
      crown.lineTo(-6, -18);
      crown.lineTo(-10, -20);
      crown.closePath();
      crown.fill();
      
      enemy.add(crown);
      
      // Texto de jefe
      const bossText = scene.add.text(0, -30, 'JEFE', {
        font: 'bold 10px Arial',
        fill: '#ff0000'
      });
      bossText.setOrigin(0.5);
      enemy.add(bossText);
    }
  
    /**
     * Crea la animación de ataque para un enemigo
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Enemy} enemy - Instancia del enemigo
     * @param {Entity} target - Objetivo del ataque
     */
    static playAttackAnimation(scene, enemy, target) {
      if (!target || !enemy.sprite) return;
      
      // Animaciones específicas por tipo
      switch (enemy.enemyType) {
        case 'slime':
          this.playSlimeAttackAnimation(scene, enemy, target);
          break;
        case 'goblin':
          this.playGoblinAttackAnimation(scene, enemy, target);
          break;
        case 'skeleton':
          this.playSkeletonAttackAnimation(scene, enemy, target);
          break;
        case 'bat':
          this.playBatAttackAnimation(scene, enemy, target);
          break;
        case 'spider':
          this.playSpiderAttackAnimation(scene, enemy, target);
          break;
        case 'wolf':
          this.playWolfAttackAnimation(scene, enemy, target);
          break;
        case 'troll':
          this.playTrollAttackAnimation(scene, enemy, target);
          break;
        case 'ghost':
          this.playGhostAttackAnimation(scene, enemy, target);
          break;
        default:
          this.playDefaultAttackAnimation(scene, enemy, target);
          break;
      }
    }
  
    /**
     * Animaciones de ataque específicas por tipo de enemigo
     */
    static playSlimeAttackAnimation(scene, enemy, target) {
      scene.tweens.add({
        targets: enemy,
        y: enemy.y - 20,
        scaleY: 0.5,
        scaleX: 1.3,
        duration: 300,
        yoyo: true,
        onComplete: () => {
          if (scene.combatEffectsSystem) {
            scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.8, color: 0x55ff55 }
            );
          }
        }
      });
    }
    
    static playGoblinAttackAnimation(scene, enemy, target) {
      const startX = enemy.x;
      
      scene.tweens.add({
        targets: enemy,
        x: target.x - 20,
        duration: 200,
        onComplete: () => {
          if (enemy.sprite) {
            scene.tweens.add({
              targets: enemy.sprite,
              angle: 15,
              duration: 100,
              yoyo: true
            });
          }
          
          if (scene.combatEffectsSystem) {
            scene.combatEffectsSystem.createAttackEffect(enemy, target, {
              color: 0x77cc77
            });
          }
          
          scene.tweens.add({
            targets: enemy,
            x: startX,
            duration: 200
          });
        }
      });
    }
    
    static playSkeletonAttackAnimation(scene, enemy, target) {
      const bone = scene.add.rectangle(
        enemy.x, 
        enemy.y, 
        6, 
        2, 
        0xffffff
      );
      
      scene.tweens.add({
        targets: bone,
        x: target.x,
        y: target.y,
        rotation: 10,
        duration: 400,
        onComplete: () => {
          bone.destroy();
          
          if (scene.combatEffectsSystem) {
            scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.7, color: 0xffffff }
            );
          }
        }
      });
    }
    
    static playBatAttackAnimation(scene, enemy, target) {
      const originalX = enemy.x;
      const originalY = enemy.y;
      
      scene.tweens.add({
        targets: enemy,
        x: target.x,
        y: target.y - 10,
        duration: 300,
        onComplete: () => {
          if (scene.combatEffectsSystem) {
            scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.6, color: 0xaa5555 }
            );
          }
          
          scene.tweens.add({
            targets: enemy,
            x: originalX,
            y: originalY,
            duration: 300
          });
        }
      });
    }
    
    static playSpiderAttackAnimation(scene, enemy, target) {
      const webLine = scene.add.line(
        0, 0,
        enemy.x, enemy.y,
        target.x, target.y,
        0xffffff, 0.7
      );
      webLine.setLineWidth(1);
      webLine.setOrigin(0, 0);
      
      scene.tweens.add({
        targets: webLine,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          webLine.destroy();
        }
      });
      
      scene.tweens.add({
        targets: target.sprite,
        alpha: 0.7,
        duration: 100,
        yoyo: true,
        repeat: 2
      });
    }
    
    static playWolfAttackAnimation(scene, enemy, target) {
      const startPos = { x: enemy.x, y: enemy.y };
      
      scene.tweens.add({
        targets: enemy.sprite,
        y: 3,
        scaleY: 0.8,
        duration: 200,
        onComplete: () => {
          scene.tweens.add({
            targets: enemy,
            x: target.x - 10,
            duration: 150,
            onComplete: () => {
              if (scene.combatEffectsSystem) {
                scene.combatEffectsSystem.createAttackEffect(enemy, target, {
                  color: 0x777777
                });
              }
              
              scene.tweens.add({
                targets: [enemy, enemy.sprite],
                x: startPos.x,
                y: startPos.y,
                scaleY: 1,
                duration: 400
              });
            }
          });
        }
      });
    }
    
    static playTrollAttackAnimation(scene, enemy, target) {
      scene.tweens.add({
        targets: enemy,
        x: enemy.x - 10,
        duration: 200,
        onComplete: () => {
          if (enemy.sprite.list && enemy.sprite.list.length > 4) {
            const arm = enemy.sprite.list[4]; // Brazo derecho
            scene.tweens.add({
              targets: arm,
              angle: 45,
              x: 15,
              duration: 100,
              yoyo: true
            });
          }
          
          scene.tweens.add({
            targets: enemy,
            x: target.x - 20,
            duration: 200,
            onComplete: () => {
              if (scene.combatEffectsSystem) {
                scene.combatEffectsSystem.createImpact(
                  target.x, 
                  target.y, 
                  { size: 1.2, color: 0x55aa55, particles: 12 }
                );
                
                scene.cameras.main.shake(100, 0.01);
              }
              
              scene.tweens.add({
                targets: enemy,
                x: enemy.x + 10,
                duration: 400
              });
            }
          });
        }
      });
    }
    
    static playGhostAttackAnimation(scene, enemy, target) {
      scene.tweens.add({
        targets: enemy.sprite,
        alpha: 0.3,
        duration: 200,
        onComplete: () => {
          enemy.x = target.x + (Math.random() > 0.5 ? 15 : -15);
          enemy.y = target.y;
          
          if (scene.combatEffectsSystem) {
            scene.combatEffectsSystem.createImpact(
              target.x, 
              target.y, 
              { size: 0.9, color: 0xccccff }
            );
          }
          
          scene.tweens.add({
            targets: enemy.sprite,
            alpha: 0.7,
            duration: 300
          });
        }
      });
    }
    
    static playDefaultAttackAnimation(scene, enemy, target) {
      scene.tweens.add({
        targets: enemy.sprite,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          const line = scene.add.line(
            0, 0,
            enemy.x, enemy.y,
            target.x, target.y,
            0xff0000, 0.6
          );
          line.setOrigin(0, 0);
          
          scene.tweens.add({
            targets: line,
            alpha: 0,
            duration: 200,
            onComplete: () => {
              line.destroy();
            }
          });
        }
      });
    }
  
    /**
     * Crea efectos visuales de daño crítico
     * @param {Phaser.Scene} scene - Escena de Phaser
     * @param {Enemy} enemy - Instancia del enemigo
     * @param {Entity} target - Objetivo del ataque
     */
    static playCriticalEffect(scene, enemy, target) {
      if (!scene.combatEffectsSystem) return;
      
      // Efecto adicional si es jefe
      if (enemy.isBoss) {
        scene.time.delayedCall(200, () => {
          scene.combatEffectsSystem.createImpact(
            target.x, 
            target.y, 
            { size: 1.5, color: 0xff0000, particles: 15 }
          );
          
          scene.cameras.main.shake(150, 0.015);
        });
      }
    }
  }