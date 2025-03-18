// src/entities/enemy/EnemyBehaviors.js
/**
 * Definiciones de comportamientos para enemigos
 */
export const EnemyBehaviors = {
    // Comportamientos de enemigos básicos
    slime: [
      {
        name: 'bounceAttack',
        cooldown: 3000,
        initialCooldown: 1000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de carga
          scene.tweens.add({
            targets: enemy.sprite,
            scaleY: 0.6,
            scaleX: 1.4,
            duration: 300,
            onComplete: () => {
              // Animación de salto
              scene.tweens.add({
                targets: enemy,
                y: enemy.y - 20,
                duration: enemy.inCombat ? 150 : 300,
                yoyo: true,
                onComplete: () => {
                  // Atacar al llegar
                  if (enemy.inCombat && target.isActive()) {
                    // 20% daño extra
                    const damage = enemy.stats.attack * 1.2;
                    target.takeDamage(damage, enemy);
                    
                    // Efecto visual si existe el sistema
                    if (scene.combatEffectsSystem) {
                      scene.combatEffectsSystem.createImpact(target.x, target.y, {
                        size: 0.8,
                        color: 0x55ff55
                      });
                    }
                  }
                }
              });
            }
          });
          
          return true;
        }
      }
    ],
    
    skeleton: [
      {
        name: 'boneThrow',
        cooldown: 5000,
        initialCooldown: 2000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Crear proyectil
          const projectile = scene.add.circle(enemy.x, enemy.y, 4, 0xffffff);
          
          // Calcular dirección hacia el objetivo
          const dx = target.x - enemy.x;
          const dy = target.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const vx = dx / distance;
          const vy = dy / distance;
          
          // Animar proyectil
          scene.tweens.add({
            targets: projectile,
            x: target.x,
            y: target.y,
            duration: 500,
            onComplete: () => {
              // Impacto
              projectile.destroy();
              
              if (target.isActive()) {
                // Hacer daño (algo menos que ataque normal)
                target.takeDamage(enemy.stats.attack * 0.8, enemy);
                
                // Efecto visual
                if (scene.combatEffectsSystem) {
                  scene.combatEffectsSystem.createImpact(target.x, target.y, {
                    size: 0.6,
                    color: 0xaaaaaa
                  });
                }
              }
            }
          });
          
          return true;
        }
      }
    ],
    
    goblin: [
      {
        name: 'quickStrike',
        cooldown: 4000,
        initialCooldown: 1000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Primer golpe
          scene.tweens.add({
            targets: enemy,
            x: target.x - 10,
            y: target.y,
            duration: 200,
            onComplete: () => {
              if (target.isActive()) {
                target.takeDamage(enemy.stats.attack * 0.6, enemy);
                
                // Segundo golpe después de un breve delay
                scene.time.delayedCall(300, () => {
                  if (enemy.isActive() && target.isActive()) {
                    target.takeDamage(enemy.stats.attack * 0.6, enemy);
                    
                    // Efecto visual
                    if (scene.combatEffectsSystem) {
                      scene.combatEffectsSystem.createAttackEffect(enemy, target, {
                        color: 0x77cc77
                      });
                    }
                  }
                });
              }
            }
          });
          
          return true;
        }
      }
    ],
    
    bat: [
      {
        name: 'sonicScream',
        cooldown: 7000,
        initialCooldown: 3000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de grito
          const soundWave = scene.add.circle(enemy.x, enemy.y, 5, 0xaaaaff, 0.7);
          
          // Expandir onda
          scene.tweens.add({
            targets: soundWave,
            radius: 30,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              soundWave.destroy();
            }
          });
          
          // Ataque en área pequeña
          const entities = [target]; // Inicialmente solo el objetivo principal
          
          // Aplicar daño tras un pequeño delay
          scene.time.delayedCall(100, () => {
            entities.forEach(entity => {
              if (entity.isActive()) {
                // Aplicar daño reducido
                const damage = enemy.stats.attack * 0.7;
                entity.takeDamage(damage, enemy);
                
                // Aplicar brevemente un efecto de aturdimiento
                const slowEffect = {
                  id: 'batSlow',
                  duration: 1500,
                  onStart: (affected) => {
                    affected.stats._originalSpeed = affected.stats.speed;
                    affected.stats.speed *= 0.7;
                  },
                  onEnd: (affected) => {
                    if (affected.stats._originalSpeed) {
                      affected.stats.speed = affected.stats._originalSpeed;
                      delete affected.stats._originalSpeed;
                    }
                  }
                };
                
                entity.addStatusEffect(slowEffect);
              }
            });
          });
          
          return true;
        }
      }
    ],
    
    spider: [
      {
        name: 'webShot',
        cooldown: 6000,
        initialCooldown: 2000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Crear línea de telaraña
          const web = scene.add.line(
            0, 0, 
            enemy.x, enemy.y, 
            target.x, target.y, 
            0xffffff, 0.8
          );
          web.setOrigin(0, 0);
          
          // Animar telaraña
          scene.tweens.add({
            targets: web,
            alpha: 0.4,
            duration: 400,
            onComplete: () => {
              if (target.isActive()) {
                // Daño leve
                target.takeDamage(enemy.stats.attack * 0.5, enemy);
                
                // Efecto de ralentización
                const webEffect = {
                  id: 'spiderWeb',
                  duration: 3000,
                  onStart: (affected) => {
                    affected.stats._originalSpeed = affected.stats.speed;
                    affected.stats.speed = Math.max(0.4, affected.stats.speed * 0.5);
                    
                    // Efecto visual de ralentización
                    if (affected.sprite) {
                      affected.sprite.setTint(0xaaaaaa);
                    }
                  },
                  onEnd: (affected) => {
                    if (affected.stats._originalSpeed) {
                      affected.stats.speed = affected.stats._originalSpeed;
                      delete affected.stats._originalSpeed;
                    }
                    
                    if (affected.sprite) {
                      affected.sprite.clearTint();
                    }
                  }
                };
                
                target.addStatusEffect(webEffect);
              }
              
              // Desvanecer telaraña
              scene.tweens.add({
                targets: web,
                alpha: 0,
                duration: 2000,
                onComplete: () => {
                  web.destroy();
                }
              });
            }
          });
          
          return true;
        }
      },
      {
        name: 'poisonBite',
        cooldown: 8000,
        initialCooldown: 4000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de movimiento rápido hacia el objetivo
          const originalPosition = { x: enemy.x, y: enemy.y };
          
          scene.tweens.add({
            targets: enemy,
            x: target.x - 5,
            y: target.y,
            duration: 200,
            onComplete: () => {
              if (target.isActive()) {
                // Daño directo
                target.takeDamage(enemy.stats.attack, enemy);
                
                // Aplicar veneno con probabilidad
                if (Math.random() < 0.7) {
                  const poisonEffect = {
                    id: 'poison',
                    duration: 5000,
                    tickInterval: 1000,
                    onStart: (affected) => {
                      if (affected.sprite) {
                        affected.sprite.setTint(0x00ff88);
                      }
                      
                      // Efecto visual de veneno
                      if (scene.combatEffectsSystem) {
                        scene.combatEffectsSystem.createStatusEffect(
                          affected, 'poison', 5000
                        );
                      }
                    },
                    onTick: (affected, delta) => {
                      // Daño por veneno cada segundo
                      if (affected.isActive() && affected.stats._lastPoisonTick + 1000 < scene.time.now) {
                        const poisonDamage = enemy.stats.attack * 0.2;
                        affected.takeDamage(poisonDamage, enemy);
                        affected.stats._lastPoisonTick = scene.time.now;
                      }
                    },
                    onEnd: (affected) => {
                      if (affected.sprite) {
                        affected.sprite.clearTint();
                      }
                    }
                  };
                  
                  // Inicializar timestamp para el tick
                  target.stats._lastPoisonTick = scene.time.now;
                  
                  target.addStatusEffect(poisonEffect);
                  
                  // Notificación de veneno
                  if (scene.events) {
                    scene.events.emit('show-combat-notification', 
                      'Envenenado', {
                        color: '#00ff88',
                        fontSize: 12,
                        x: target.x,
                        y: target.y - 20
                    });
                  }
                }
              }
              
              // Volver a posición original
              scene.tweens.add({
                targets: enemy,
                x: originalPosition.x,
                y: originalPosition.y,
                duration: 300
              });
            }
          });
          
          return true;
        }
      }
    ],
    
    wolf: [
      {
        name: 'ferociousBite',
        cooldown: 5000,
        initialCooldown: 2000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Posición original
          const originalPosition = { x: enemy.x, y: enemy.y };
          
          // Preparación (agacharse)
          scene.tweens.add({
            targets: enemy.sprite,
            scaleY: 0.8,
            duration: 200,
            onComplete: () => {
              // Embestida rápida
              scene.tweens.add({
                targets: enemy,
                x: target.x - 15,
                duration: 150,
                onComplete: () => {
                  if (target.isActive()) {
                    // Mordisco potente (daño aumentado)
                    const criticalChance = 0.4; // 40% de probabilidad de crítico
                    const isCritical = Math.random() < criticalChance;
                    const damageMultiplier = isCritical ? 1.8 : 1.3;
                    
                    const damage = enemy.stats.attack * damageMultiplier;
                    target.takeDamage(damage, enemy);
                    
                    // Efecto visual de mordisco
                    if (scene.combatEffectsSystem) {
                      scene.combatEffectsSystem.createAttackEffect(enemy, target, {
                        color: 0x777777,
                        critical: isCritical
                      });
                      
                      if (isCritical) {
                        // Efecto de sangrado si es crítico
                        const bleedEffect = {
                          id: 'wolfBleed',
                          duration: 4000,
                          tickInterval: 1000,
                          onStart: (affected) => {
                            // Efecto visual de sangrado
                            if (scene.combatEffectsSystem) {
                              scene.combatEffectsSystem.createStatusEffect(
                                affected, 'bleed', 4000
                              );
                            }
                          },
                          onTick: (affected, delta) => {
                            // Daño por sangrado cada segundo
                            if (affected.isActive() && affected.stats._lastBleedTick + 1000 < scene.time.now) {
                              const bleedDamage = enemy.stats.attack * 0.15;
                              affected.takeDamage(bleedDamage, enemy);
                              affected.stats._lastBleedTick = scene.time.now;
                            }
                          }
                        };
                        
                        // Inicializar timestamp para el tick
                        target.stats._lastBleedTick = scene.time.now;
                        
                        target.addStatusEffect(bleedEffect);
                      }
                    }
                  }
                  
                  // Volver a posición original
                  scene.tweens.add({
                    targets: enemy,
                    x: originalPosition.x,
                    duration: 300,
                    onComplete: () => {
                      // Restaurar escala
                      scene.tweens.add({
                        targets: enemy.sprite,
                        scaleY: 1,
                        duration: 200
                      });
                    }
                  });
                }
              });
            }
          });
          
          return true;
        }
      }
    ],
    
    troll: [
      {
        name: 'groundSmash',
        cooldown: 7000,
        initialCooldown: 3000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de preparación
          scene.tweens.add({
            targets: enemy.sprite,
            y: -5,
            duration: 300,
            onComplete: () => {
              // Golpe al suelo
              scene.tweens.add({
                targets: enemy.sprite,
                y: 5,
                duration: 200,
                onComplete: () => {
                  // Efecto de impacto en el suelo
                  const impact = scene.add.circle(enemy.x, enemy.y + 10, 5, 0x555555, 0.8);
                  
                  // Expandir impacto
                  scene.tweens.add({
                    targets: impact,
                    radius: 40,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                      impact.destroy();
                    }
                  });
                  
                  // Aplicar daño en área
                  if (target.isActive()) {
                    // Daño al objetivo
                    const damage = enemy.stats.attack * 1.2;
                    target.takeDamage(damage, enemy);
                    
                    // Efecto de aturdimiento
                    const stunEffect = {
                      id: 'trollStun',
                      duration: 1500,
                      onStart: (affected) => {
                        affected.stats._originalSpeed = affected.stats.speed;
                        affected.stats.speed = 0.3;
                        
                        // Efecto visual de aturdimiento
                        if (affected.sprite) {
                          affected.sprite.setTint(0xffff00);
                        }
                        
                        // Notificación
                        if (scene.events) {
                          scene.events.emit('show-combat-notification', 
                            'Aturdido', {
                              color: '#ffff00',
                              fontSize: 12,
                              x: affected.x,
                              y: affected.y - 20
                          });
                        }
                      },
                      onEnd: (affected) => {
                        if (affected.stats._originalSpeed) {
                          affected.stats.speed = affected.stats._originalSpeed;
                          delete affected.stats._originalSpeed;
                        }
                        
                        if (affected.sprite) {
                          affected.sprite.clearTint();
                        }
                      }
                    };
                    
                    // Aplicar aturdimiento con 50% de probabilidad
                    if (Math.random() < 0.5) {
                      target.addStatusEffect(stunEffect);
                    }
                  }
                  
                  // Sacudir la cámara
                  scene.cameras.main.shake(200, 0.01);
                  
                  // Volver a posición normal
                  scene.tweens.add({
                    targets: enemy.sprite,
                    y: 0,
                    duration: 200
                  });
                }
              });
            }
          });
          
          return true;
        }
      }
    ],
    
    ghost: [
      {
        name: 'phaseShift',
        cooldown: 6000,
        initialCooldown: 2000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Volverse intangible
          scene.tweens.add({
            targets: enemy.sprite,
            alpha: 0.2,
            duration: 300,
            onComplete: () => {
              // Teletransportarse detrás del objetivo
              const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
              enemy.x = target.x - Math.cos(angle) * 20;
              enemy.y = target.y - Math.sin(angle) * 20;
              
              // Ataque fantasmal
              scene.time.delayedCall(200, () => {
                if (target.isActive()) {
                  // Daño con posibilidad de ignorar defensa
                  const bypassDefense = Math.random() < 0.5;
                  let damage = enemy.stats.attack;
                  
                  if (bypassDefense) {
                    // Notificación defensa ignorada
                    if (scene.events) {
                      scene.events.emit('show-combat-notification', 
                        'Defensa ignorada', {
                          color: '#ccccff',
                          fontSize: 12,
                          x: target.x,
                          y: target.y - 30
                      });
                    }
                    
                    // Aplicar daño directamente
                    target.stats.health = Math.max(0, target.stats.health - damage);
                    
                    // Comprobar si ha muerto
                    if (target.stats.health <= 0) {
                      target.die(enemy);
                    }
                  } else {
                    // Daño normal
                    target.takeDamage(damage, enemy);
                  }
                  
                  // Efecto visual de ataque
                  if (scene.combatEffectsSystem) {
                    scene.combatEffectsSystem.createImpact(
                      target.x, 
                      target.y, 
                      { size: 0.9, color: 0xccccff }
                    );
                  }
                }
                
                // Volver a ser visible
                scene.tweens.add({
                  targets: enemy.sprite,
                  alpha: 0.7,
                  duration: 300
                });
              });
            }
          });
          
          return true;
        }
      },
      {
        name: 'terrify',
        cooldown: 10000,
        initialCooldown: 5000,
        execute: (enemy, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Efecto visual de terror
          const terrorRadius = scene.add.circle(
            enemy.x, 
            enemy.y, 
            10, 
            0xccccff, 
            0.3
          );
          
          // Expandir radio
          scene.tweens.add({
            targets: terrorRadius,
            radius: 60,
            alpha: 0,
            duration: 700,
            onComplete: () => {
              terrorRadius.destroy();
            }
          });
          
          // Efecto de miedo
          const fearEffect = {
            id: 'ghostFear',
            duration: 4000,
            onStart: (affected) => {
              affected.stats._originalAttack = affected.stats.attack;
              affected.stats.attack *= 0.7; // Reducir ataque por miedo
              
              // Efecto visual
              if (affected.sprite) {
                affected.sprite.setTint(0xaaccff);
              }
              
              // Notificación
              if (scene.events) {
                scene.events.emit('show-combat-notification', 
                  'Aterrorizado', {
                    color: '#ccccff',
                    fontSize: 14,
                    x: affected.x,
                    y: affected.y - 20
                });
              }
            },
            onEnd: (affected) => {
              if (affected.stats._originalAttack) {
                affected.stats.attack = affected.stats._originalAttack;
                delete affected.stats._originalAttack;
              }
              
              if (affected.sprite) {
                affected.sprite.clearTint();
              }
            }
          };
          
          target.addStatusEffect(fearEffect);
          
          return true;
        }
      }
    ]
  };
  
  /**
   * Comportamientos específicos para jefes
   */
  export const BossBehaviors = {
    // Rey Goblin
    goblin_king: [
      {
        name: 'summonReinforcements',
        cooldown: 15000,
        initialCooldown: 5000,
        execute: (boss, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de invocación
          const callCircle = scene.add.circle(
            boss.x, 
            boss.y, 
            15, 
            0x77cc77, 
            0.3
          );
          
          // Expandir círculo
          scene.tweens.add({
            targets: callCircle,
            radius: 40,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              callCircle.destroy();
              
              // Crear minions
              const count = 2 + Math.floor(Math.random());
              const minions = [];
              
              for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const distance = 30 + Math.random() * 20;
                const x = boss.x + Math.cos(angle) * distance;
                const y = boss.y + Math.sin(angle) * distance;
                
                // Crear goblin
                const minion = scene.entitySystem.createEnemy(x, y, 'goblin', {
                  level: Math.max(1, boss.stats.level - 2)
                });
                
                // Marcar como minion
                minion.minionOf = boss.id;
                minions.push(minion);
                
                // Inicialmente invisible
                minion.alpha = 0;
                
                // Animación de aparición
                scene.tweens.add({
                  targets: minion,
                  alpha: 1,
                  duration: 300,
                  delay: i * 100
                });
              }
              
              // Efecto visual de invocación
              if (scene.combatEffectsSystem) {
                scene.combatEffectsSystem.createSummonEffect(boss, minions);
              }
              
              // Notificación
              if (scene.events) {
                scene.events.emit('show-combat-notification', 
                  `Refuerzos invocados!`, {
                    color: '#77cc77',
                    fontSize: 16,
                    x: boss.x,
                    y: boss.y - 40,
                    duration: 1500
                });
              }
            }
          });
          
          return true;
        }
      },
      {
        name: 'warCry',
        cooldown: 20000,
        initialCooldown: 8000,
        execute: (boss, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de grito
          scene.tweens.add({
            targets: boss.sprite,
            scaleY: 1.2,
            scaleX: 1.1,
            duration: 300,
            yoyo: true,
            onComplete: () => {
              // Onda expansiva
              const cryWave = scene.add.circle(
                boss.x, 
                boss.y, 
                20, 
                0xffaa00, 
                0.4
              );
              
              // Expandir onda
              scene.tweens.add({
                targets: cryWave,
                radius: 80,
                alpha: 0,
                duration: 800,
                onComplete: () => {
                  cryWave.destroy();
                }
              });
              
              // Buff para todos los goblins en el área (incluyendo al jefe)
              const goblinEntities = [boss];
              
              // Buscar goblins cercanos
              if (scene.entitySystem && scene.entitySystem.enemies) {
                scene.entitySystem.enemies.forEach(enemy => {
                  if (enemy.isActive() && 
                      (enemy.enemyType === 'goblin' || enemy.minionOf === boss.id)) {
                    const distance = Phaser.Math.Distance.Between(
                      boss.x, boss.y,
                      enemy.x, enemy.y
                    );
                    
                    if (distance < 100) {
                      goblinEntities.push(enemy);
                    }
                  }
                });
              }
              
              // Aplicar buff a todos los goblins encontrados
              goblinEntities.forEach(goblin => {
                // Buff de ataque y velocidad
                const warCryBuff = {
                  id: 'goblinWarCry',
                  duration: 10000,
                  onStart: (affected) => {
                    affected.stats._originalAttack = affected.stats.attack;
                    affected.stats._originalSpeed = affected.stats.speed;
                    
                    affected.stats.attack *= 1.3;
                    affected.stats.speed *= 1.2;
                    
                    // Efecto visual
                    if (affected.sprite) {
                      affected.sprite.setTint(0xff8800);
                    }
                    
                    if (scene.combatEffectsSystem) {
                      scene.combatEffectsSystem.createStatusEffect(
                        affected, 'buff', 10000
                      );
                    }
                  },
                  onEnd: (affected) => {
                    if (affected.stats._originalAttack) {
                      affected.stats.attack = affected.stats._originalAttack;
                      delete affected.stats._originalAttack;
                    }
                    
                    if (affected.stats._originalSpeed) {
                      affected.stats.speed = affected.stats._originalSpeed;
                      delete affected.stats._originalSpeed;
                    }
                    
                    if (affected.sprite) {
                      affected.sprite.clearTint();
                    }
                  }
                };
                
                goblin.addStatusEffect(warCryBuff);
              });
              
              // Sacudir ligeramente la cámara
              scene.cameras.main.shake(200, 0.005);
              
              // Notificación
              if (scene.events) {
                scene.events.emit('show-combat-notification', 
                  `¡Grito de guerra!`, {
                    color: '#ffaa00',
                    fontSize: 16,
                    x: boss.x,
                    y: boss.y - 40,
                    duration: 1500
                });
              }
            }
          });
          
          return true;
        }
      }
    ],
    
    // Reina Slime
    slime_queen: [
      {
        name: 'split',
        cooldown: 30000,
        initialCooldown: 10000,
        execute: (boss, target, scene) => {
          // Solo dividirse si tiene menos de 50% de vida
          if (boss.stats.health > boss.stats.maxHealth * 0.5) return false;
          
          // Crear 3-4 slimes pequeños
          const count = 3 + Math.floor(Math.random());
          const minions = [];
          
          // Flash en el sprite del jefe
          scene.tweens.add({
            targets: boss.sprite,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            onComplete: () => {
              // Crear slimes
              for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const distance = 30;
                const x = boss.x + Math.cos(angle) * distance;
                const y = boss.y + Math.sin(angle) * distance;
                
                // Crear slime
                const minion = scene.entitySystem.createEnemy(x, y, 'slime', {
                  level: Math.max(1, boss.stats.level - 3),
                  health: boss.stats.health * 0.15,
                  maxHealth: boss.stats.maxHealth * 0.15
                });
                
                // Marcar como minion
                minion.minionOf = boss.id;
                minions.push(minion);
                
                // Inicialmente pequeño
                minion.setScale(0.3);
                
                // Animación de crecimiento
                scene.tweens.add({
                  targets: minion,
                  scale: 1,
                  duration: 400,
                  ease: 'Back.easeOut'
                });
              }
              
              // Efecto visual de división
              if (scene.combatEffectsSystem) {
                scene.combatEffectsSystem.createSplitEffect(boss, minions);
              }
              
              // Notificación
              if (scene.events) {
                scene.events.emit('show-combat-notification', 
                  `¡División!`, {
                    color: '#55ff55',
                    fontSize: 16,
                    x: boss.x,
                    y: boss.y - 40,
                    duration: 1500
                });
              }
            }
          });
          
          return true;
        }
      },
      {
        name: 'acidSplash',
        cooldown: 8000,
        initialCooldown: 3000,
        execute: (boss, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de carga
          scene.tweens.add({
            targets: boss.sprite,
            scaleY: 1.3,
            scaleX: 0.8,
            duration: 300,
            onComplete: () => {
              // Lanzar proyectiles ácidos
              const projectileCount = 5 + Math.floor(Math.random() * 3);
              
              for (let i = 0; i < projectileCount; i++) {
                // Determinar objetivo aleatorio en rango cercano al jugador
                const offset = 20 + Math.random() * 40;
                const angle = Math.random() * Math.PI * 2;
                const targetX = target.x + Math.cos(angle) * offset;
                const targetY = target.y + Math.sin(angle) * offset;
                
                // Crear proyectil
                const projectile = scene.add.circle(boss.x, boss.y, 5, 0x00ff88);
                
                // Animar proyectil
                scene.tweens.add({
                  targets: projectile,
                  x: targetX,
                  y: targetY,
                  duration: 400 + Math.random() * 200,
                  onComplete: () => {
                    // Charco de ácido
                    const acid = scene.add.circle(targetX, targetY, 8, 0x00ff88, 0.6);
                    
                    // Expandir y desvanecer charco
                    scene.tweens.add({
                      targets: acid,
                      radius: 15,
                      alpha: 0,
                      duration: 3000,
                      onComplete: () => {
                        acid.destroy();
                      }
                    });
                    
                    // Daño al objetivo si está en rango del impacto
                    if (target.isActive()) {
                      const distance = Phaser.Math.Distance.Between(
                        targetX, targetY,
                        target.x, target.y
                      );
                      
                      if (distance < 20) {
                        // 25% del daño normal
                        target.takeDamage(boss.stats.attack * 0.25, boss);
                        
                        // Aplicar efecto de ácido
                        const acidEffect = {
                          id: 'slimeAcid',
                          duration: 3000,
                          tickInterval: 1000,
                          onStart: (affected) => {
                            if (affected.sprite) {
                              affected.sprite.setTint(0x00ff88);
                            }
                          },
                          onTick: (affected, delta) => {
                            // Daño por ácido cada segundo
                            if (affected.isActive() && affected.stats._lastAcidTick + 1000 < scene.time.now) {
                              const acidDamage = boss.stats.attack * 0.1;
                              affected.takeDamage(acidDamage, boss);
                              affected.stats._lastAcidTick = scene.time.now;
                            }
                          },
                          onEnd: (affected) => {
                            if (affected.sprite) {
                              affected.sprite.clearTint();
                            }
                          }
                        };
                        
                        // Inicializar timestamp para el tick
                        target.stats._lastAcidTick = scene.time.now;
                        
                        target.addStatusEffect(acidEffect);
                      }
                    }
                    
                    projectile.destroy();
                  }
                });
              }
              
              // Volver a forma normal
              scene.tweens.add({
                targets: boss.sprite,
                scaleY: 1,
                scaleX: 1,
                duration: 200
              });
            }
          });
          
          return true;
        }
      }
    ],
    
    // Lord Esqueleto
    skeleton_lord: [
      {
        name: 'boneStorm',
        cooldown: 12000,
        initialCooldown: 4000,
        execute: (boss, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Daño en área
          const entitiesInRange = [target];
          
          // Animación de invocación
          const stormCircle = scene.add.circle(
            boss.x, 
            boss.y, 
            15, 
            0xdddddd, 
            0.3
          );
          
          // Expandir círculo
          scene.tweens.add({
            targets: stormCircle,
            radius: 40,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              stormCircle.destroy();
              
              // Lanzar 5-8 proyectiles
              const projectileCount = 5 + Math.floor(Math.random() * 3);
              
              for (let i = 0; i < projectileCount; i++) {
                // Determinar objetivo aleatorio en rango cercano al jugador
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 60;
                const targetX = target.x + Math.cos(angle) * distance;
                const targetY = target.y + Math.sin(angle) * distance;
                
                // Crear proyectil
                const projectile = scene.add.circle(boss.x, boss.y, 5, 0xffffff);
                
                // Animar proyectil
                scene.tweens.add({
                  targets: projectile,
                  x: targetX,
                  y: targetY,
                  duration: 400 + Math.random() * 200,
                  onComplete: () => {
                    // Efecto de impacto
                    if (scene.combatEffectsSystem) {
                      scene.combatEffectsSystem.createImpact(
                        targetX,
                        targetY,
                        { size: 0.7, color: 0xaaaaaa }
                      );
                    }
                    
                    // Daño en el punto de impacto
                    if (target.isActive()) {
                      const distance = Phaser.Math.Distance.Between(
                        targetX, targetY,
                        target.x, target.y
                      );
                      
                      if (distance < 30) {
                        const damage = boss.stats.attack * 0.3; // 30% del daño normal
                        target.takeDamage(damage, boss);
                      }
                    }
                    
                    projectile.destroy();
                  }
                });
              }
              
              // Sacudir ligeramente la cámara
              scene.cameras.main.shake(150, 0.005);
              
              // Notificación
              if (scene.events) {
                scene.events.emit('show-combat-notification', 
                  `¡Tormenta de huesos!`, {
                    color: '#ffffff',
                    fontSize: 16,
                    x: boss.x,
                    y: boss.y - 40,
                    duration: 1500
                });
              }
            }
          });
          
          return true;
        }
      },
      {
        name: 'undeadSummoning',
        cooldown: 25000,
        initialCooldown: 8000,
        execute: (boss, target, scene) => {
          if (!target || !target.isActive()) return false;
          
          // Animación de invocación
          const summonCircle = scene.add.circle(
            boss.x, 
            boss.y, 
            20, 
            0xaaaaaa, 
            0.4
          );
          
          // Expandir círculo con pulso
          scene.tweens.add({
            targets: summonCircle,
            radius: 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
              summonCircle.destroy();
              
              // Invocar esqueletos
              const count = 2;
              const minions = [];
              
              // Posiciones de invocación (desde el suelo)
              for (let i = 0; i < count; i++) {
                const offsetX = -40 + i * 80;
                const x = boss.x + offsetX;
                const y = boss.y + 30;
                
                // Crear mano emergiendo del suelo
                const hand = scene.add.rectangle(x, y, 6, 12, 0xffffff);
                hand.setOrigin(0.5, 1); // Origen en la base
                
                // Animar mano emergiendo
                scene.tweens.add({
                  targets: hand,
                  y: y - 20,
                  duration: 600,
                  onComplete: () => {
                    hand.destroy();
                    
                    // Crear esqueleto
                    const minion = scene.entitySystem.createEnemy(x, y - 30, 'skeleton', {
                      level: Math.max(1, boss.stats.level - 2)
                    });
                    
                    // Marcar como minion
                    minion.minionOf = boss.id;
                    minions.push(minion);
                    
                    // Inicialmente bajo tierra
                    minion.y += 20;
                    minion.alpha = 0.7;
                    
                    // Animación de emerger
                    scene.tweens.add({
                      targets: minion,
                      y: y - 30,
                      alpha: 1,
                      duration: 400
                    });
                  }
                });
              }
              
              // Sacudir la cámara
              scene.cameras.main.shake(200, 0.01);
              
              // Notificación
              if (scene.events) {
                scene.events.emit('show-combat-notification', 
                  `¡Los muertos se levantan!`, {
                    color: '#aaaaaa',
                    fontSize: 16,
                    x: boss.x,
                    y: boss.y - 40,
                    duration: 1500
                });
              }
            }
          });
          
          return true;
        }
      }
    ]
  };
  
  /**
   * Obtener comportamientos para un tipo de enemigo específico
   * @param {string} enemyType - Tipo de enemigo
   * @returns {Array} Lista de comportamientos
   */
  export function getBehaviorsForEnemyType(enemyType) {
    return EnemyBehaviors[enemyType] || [];
  }
  
  /**
   * Obtener comportamientos para un tipo de jefe específico
   * @param {string} bossType - Tipo de jefe
   * @returns {Array} Lista de comportamientos de jefe
   */
  export function getBehaviorsForBossType(bossType) {
    return BossBehaviors[bossType] || [];
  }
  
  /**
   * Inicializa los comportamientos para un enemigo
   * @param {Enemy} enemy - Instancia del enemigo
   * @param {Phaser.Scene} scene - Escena actual
   */
  export function initBehaviorsForEnemy(enemy, scene) {
    // Obtener comportamientos según tipo
    let behaviors = [];
    
    if (enemy.isBoss && enemy.bossType) {
      // Comportamientos de jefe
      behaviors = getBehaviorsForBossType(enemy.bossType);
    } else {
      // Comportamientos normales
      behaviors = getBehaviorsForEnemyType(enemy.enemyType);
    }
    
    // Inicializar comportamientos
    enemy.behaviors = behaviors.map(behavior => ({
      ...behavior,
      currentCooldown: behavior.initialCooldown || 0,
      execute: (target) => behavior.execute(enemy, target, scene)
    }));
  }