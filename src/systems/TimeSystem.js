// src/systems/TimeSystem.js
export default class TimeSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Configuración del sistema de tiempo
    this.dayDuration = 120000; // Aumentado a 2 minutos = 1 día completo
    this.dayStartTime = 0;
    this.nightStartTime = 0.5; // La noche comienza a mitad del ciclo
    
    // Estado inicial
    this.timeOfDay = 0; // 0 a 1, donde 0 es amanecer y 0.5 es atardecer
    this.isDay = true;
    this.isPaused = false;
    this.timeScale = 0.5; // Reducido a la mitad para ralentizar
    this.speedMultiplier = 1; // Multiplicador de velocidad sincronizado
    
    // Tiempo acumulado para prevenir problemas con grandes deltas
    this.accumulatedTime = 0;
    this.maxTimeStep = 100; // Límite de tiempo por paso en ms
    
    // Referencia visual del ciclo
    this.timeIndicator = null;
    
    // Eventos del ciclo
    this.dayStartCallbacks = [];
    this.nightStartCallbacks = [];
    this.timeChangeCallbacks = [];

    // Colores para transiciones
    this.dayColor = 0x000000;    // Color de "tinte" diurno
    this.nightColor = 0x0a0a30;  // Color azul oscuro para la noche
    this.dayAlpha = 0;           // Transparencia en el día
    this.nightAlpha = 0.5;       // Opacidad en la noche
    
    // Inicializar overlay para tinte de día/noche
    this.createTimeOverlay();
    
    console.log("TimeSystem iniciado con dayDuration:", this.dayDuration);
  }

  /**
   * Crea el overlay para efectos visuales de día/noche
   */
  createTimeOverlay() {
    // Crear un rectángulo que cubra toda la pantalla
    const { width, height } = this.scene.cameras.main;
    this.timeOverlay = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      this.dayColor,
      this.dayAlpha
    );
    
    // Asegurar que esté en una capa superior
    this.timeOverlay.setDepth(1000);
    this.timeOverlay.setOrigin(0.5, 0.5);
    
    // Anclar a la cámara para que siga al jugador
    this.timeOverlay.setScrollFactor(0);
  }

  /**
   * Crea un indicador visual del tiempo
   * @param {number} x - Posición X del indicador
   * @param {number} y - Posición Y del indicador
   * @param {number} width - Ancho del indicador
   */
  createTimeIndicator(x, y, width) {
    const height = 20;
    
    // Fondo del indicador
    this.timeIndicatorBg = this.scene.add.rectangle(
      x,
      y,
      width,
      height,
      0x222222,
      0.7
    );
    this.timeIndicatorBg.setScrollFactor(0);
    this.timeIndicatorBg.setDepth(1001);
    
    // Indicador de progreso
    this.timeIndicator = this.scene.add.rectangle(
      x - width / 2,
      y,
      1,
      height - 4,
      0xffff00,
      1
    );
    this.timeIndicator.setScrollFactor(0);
    this.timeIndicator.setDepth(1002);
    this.timeIndicator.setOrigin(0, 0.5);
    
    // Iconos de sol y luna
    this.sunIcon = this.scene.add.circle(
      x - width / 2 + 10,
      y,
      8,
      0xffff00
    );
    this.sunIcon.setScrollFactor(0);
    this.sunIcon.setDepth(1003);
    
    this.moonIcon = this.scene.add.circle(
      x + width / 2 - 10,
      y,
      6,
      0xaaaaff
    );
    this.moonIcon.setScrollFactor(0);
    this.moonIcon.setDepth(1003);
    
    // Crear un arco alrededor del círculo de la luna para darle forma
    const moonArc = this.scene.add.graphics();
    moonArc.fillStyle(0x222222, 1);
    moonArc.slice(
      x + width / 2 - 13,
      y - 2,
      7,
      Math.PI * 1.3,
      Math.PI * 0.3,
      true
    );
    moonArc.fillPath();
    moonArc.setScrollFactor(0);
    moonArc.setDepth(1004);
  }

  /**
   * Actualiza el sistema de tiempo
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta, time) {
    if (this.isPaused) return;
    
    // Detección de cambio de pestaña o pérdida de foco
    const MAX_REASONABLE_DELTA = 2000; // 2 segundos
    if (delta > MAX_REASONABLE_DELTA) {
      console.warn(`TimeSystem: Delta time extremadamente alto (${delta.toFixed(1)}ms), probablemente cambio de pestaña. Omitiendo actualización.`);
      return; // No procesar esta actualización para evitar saltos
    }
    
    // Verificar delta muy grande
    if (delta > 500) {
      console.warn(`TimeSystem: Delta time anormalmente alto: ${delta.toFixed(1)}ms. Limitando a 500ms.`);
      delta = 500;
    }
    
    // Acumular tiempo y procesar en pasos pequeños para prevenir saltos
    this.accumulatedTime += delta * this.timeScale * this.speedMultiplier;
    
    // Procesar el tiempo acumulado en pasos pequeños
    let timeProcessed = 0;
    const oldTimeOfDay = this.timeOfDay;
    
    while (this.accumulatedTime >= this.maxTimeStep && timeProcessed < delta) {
      // Actualizar el tiempo del día con ajuste de multiplicador
      const deltaTime = this.maxTimeStep;
      this.timeOfDay = (this.timeOfDay + deltaTime / this.dayDuration) % 1;
      
      // Restar el tiempo procesado
      this.accumulatedTime -= this.maxTimeStep;
      timeProcessed += this.maxTimeStep;
    }
    
    // Log ocasional para depurar
    if (Math.random() < 0.01) {
      console.log(`TimeSystem: delta=${delta.toFixed(1)}, speedMultiplier=${this.speedMultiplier}, timeOfDay=${this.timeOfDay.toFixed(3)}`);
    }
    
    // Verificar cambios de día/noche
    const wasDay = this.isDay;
    this.isDay = this.timeOfDay < this.nightStartTime || this.timeOfDay > (this.nightStartTime + 0.5);
    
    // Si cambió de día a noche o viceversa
    if (wasDay !== this.isDay) {
      if (this.isDay) {
        console.log("TimeSystem: Iniciando día");
        this.dayStartCallbacks.forEach(callback => callback());
        this.scene.events.emit('day-started');
      } else {
        console.log("TimeSystem: Iniciando noche");
        this.nightStartCallbacks.forEach(callback => callback());
        this.scene.events.emit('night-started');
      }
    }
    
    // Solo actualizar visuales si hay un cambio significativo
    if (Math.abs(this.timeOfDay - oldTimeOfDay) > 0.001) {
      this.updateTimeVisuals();
      
      // Notificar a otros sistemas del cambio de tiempo
      this.timeChangeCallbacks.forEach(callback => callback(this.timeOfDay, this.isDay));
      this.scene.events.emit('time-changed', this.timeOfDay, this.isDay);
    }
  }

  /**
   * Actualiza los elementos visuales relacionados con el tiempo
   */
  updateTimeVisuals() {
    // Actualizar la posición del indicador si existe
    if (this.timeIndicator && this.timeIndicatorBg) {
      const width = this.timeIndicatorBg.width;
      this.timeIndicator.width = width * this.timeOfDay;
    }
    
    // Determinar la opacidad del overlay basada en la hora del día
    let targetAlpha;
    let targetColor;
    
    if (this.isDay) {
      // Transición de noche a día o de día a noche
      const dayProgress = this.timeOfDay < this.nightStartTime 
        ? this.timeOfDay / this.nightStartTime 
        : (1 - this.timeOfDay) / (1 - (this.nightStartTime + 0.5));
        
      targetAlpha = this.dayAlpha + (this.nightAlpha - this.dayAlpha) * (1 - dayProgress);
      targetColor = this.dayColor;
    } else {
      // Durante la noche
      const nightProgress = (this.timeOfDay - this.nightStartTime) / 0.5;
      const nightIntensity = nightProgress <= 0.5 
        ? nightProgress * 2 
        : (1 - nightProgress) * 2;
        
      targetAlpha = this.nightAlpha * nightIntensity;
      targetColor = this.nightColor;
    }
    
    // Aplicar cambios al overlay
    if (this.timeOverlay) {
      this.timeOverlay.setFillStyle(targetColor, targetAlpha);
    }
  }

  /**
   * Establece la duración de un día completo en milisegundos
   * @param {number} duration - Duración en ms
   */
  setDayDuration(duration) {
    this.dayDuration = duration;
    console.log(`TimeSystem: Duración del día establecida a ${duration}ms`);
  }

  /**
   * Establece la escala de tiempo interna
   * @param {number} scale - Multiplicador de velocidad del tiempo
   */
  setTimeScale(scale) {
    this.timeScale = Math.max(0, scale);
  }

  /**
   * Establece el multiplicador de velocidad general
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setSpeedMultiplier(multiplier) {
    console.log(`TimeSystem: Estableciendo multiplicador a ${multiplier}x (era ${this.speedMultiplier}x)`);
    this.speedMultiplier = multiplier;
  }

  /**
   * Pausa o reanuda el sistema de tiempo
   * @param {boolean} isPaused - Estado de pausa
   */
  setPaused(isPaused) {
    this.isPaused = isPaused;
    console.log(`TimeSystem: ${isPaused ? 'Pausado' : 'Reanudado'}`);
  }

  /**
   * Registra un callback para cuando inicie el día
   * @param {Function} callback - Función a ejecutar
   */
  onDayStart(callback) {
    this.dayStartCallbacks.push(callback);
  }

  /**
   * Registra un callback para cuando inicie la noche
   * @param {Function} callback - Función a ejecutar
   */
  onNightStart(callback) {
    this.nightStartCallbacks.push(callback);
  }

  /**
   * Registra un callback para cambios en el tiempo
   * @param {Function} callback - Función a ejecutar
   */
  onTimeChange(callback) {
    this.timeChangeCallbacks.push(callback);
  }

  /**
   * Obtiene un string descriptivo del momento del día
   * @returns {string} Descripción del momento del día
   */
  getTimeDescription() {
    if (this.timeOfDay < 0.1) return 'Amanecer';
    if (this.timeOfDay < 0.3) return 'Mañana';
    if (this.timeOfDay < 0.45) return 'Mediodía';
    if (this.timeOfDay < 0.5) return 'Tarde';
    if (this.timeOfDay < 0.6) return 'Atardecer';
    if (this.timeOfDay < 0.8) return 'Noche';
    return 'Medianoche';
  }
}