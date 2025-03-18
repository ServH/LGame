// src/entities/SmokeParticle.js
import Phaser from 'phaser';

export default class SmokeParticle extends Phaser.GameObjects.Particles.Particle {
  constructor(emitter) {
    super(emitter);
    this.t = 0;
    this.i = 0;
  }
  
  update(delta, step, processors) {
    super.update(delta, step, processors);
    
    this.t += step;
    this.i++;
    
    if (this.i % 2 === 0) {
      this.x += Math.sin(this.t * 0.01) * 0.2;
    }
  }
}