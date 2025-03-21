// src/managers/SystemRegistry.js

/**
 * Registro central de todos los sistemas del juego
 * Permite acceso fácil a los sistemas desde cualquier parte del código
 */
export default class SystemRegistry {
  constructor() {
    this.systems = new Map();
    this.initialized = false;
    this.pendingInitializations = [];
    this.speedMultiplier = 1; // Valor predeterminado del multiplicador
  }

  /**
   * Registra un nuevo sistema
   * @param {string} name - Nombre único del sistema
   * @param {Object} system - Instancia del sistema
   */
  register(name, system) {
    if (this.systems.has(name)) {
      console.warn(`Sistema "${name}" ya registrado. Se sobrescribirá.`);
    }
    
    this.systems.set(name, system);
    
    // Si el registro ya ha sido inicializado, inicializar este sistema también
    if (this.initialized && system.initialize) {
      system.initialize();
    }
    
    // Aplicar multiplicador actual si el sistema lo soporta
    if (system.setSpeedMultiplier && this.speedMultiplier !== 1) {
      console.log(`Aplicando multiplicador existente ${this.speedMultiplier}x a sistema recién registrado: ${name}`);
      system.setSpeedMultiplier(this.speedMultiplier);
    }
  }

  /**
   * Obtiene un sistema por su nombre
   * @param {string} name - Nombre del sistema
   * @returns {Object|null} - Sistema encontrado o null
   */
  get(name) {
    return this.systems.get(name) || null;
  }

  /**
   * Inicializa todos los sistemas registrados
   * @param {Object} gameData - Datos iniciales del juego
   */
  initializeAll(gameData = {}) {
    // Marcar como inicializado
    this.initialized = true;
    
    // Inicializar sistemas
    for (const [name, system] of this.systems.entries()) {
      if (system.initialize) {
        system.initialize(gameData);
      }
    }
    
    // Ejecutar inicializaciones pendientes
    this.pendingInitializations.forEach(init => init());
    this.pendingInitializations = [];
    
    console.log(`${this.systems.size} sistemas inicializados`);
  }

/**
 * Actualiza todos los sistemas registrados
 * @param {number} time - Tiempo actual
 * @param {number} delta - Tiempo desde último frame
 */
updateAll(time, delta) {
  // CORRECCIÓN DE EMERGENCIA: Forzar un delta fijo para estabilidad
  // Esto debería resolver problemas de rendimiento a costa de fluidez 
  const FIXED_DELTA = 16.66; // Aproximadamente 60fps

  // Aplicar el delta fijo para TODAS las actualizaciones
  for (const system of this.systems.values()) {
    if (system.update) {
      system.update(FIXED_DELTA, time);
    }
  }
  
  // Cada 100 frames, comprobar si hay problemas de rendimiento graves
  if (time % 1000 < 16) {
    if (delta > 100) {
      console.warn(`Rendimiento bajo detectado: delta=${delta.toFixed(1)}ms. Usando delta fijo de ${FIXED_DELTA}ms.`);
    }
  }
}

  /**
   * Registra una función que debe ejecutarse después de la inicialización
   * @param {Function} callback - Función a ejecutar
   */
  registerInitCallback(callback) {
    if (this.initialized) {
      // Si ya está inicializado, ejecutar ahora
      callback();
    } else {
      // Sino, guardar para ejecutar cuando se inicialice
      this.pendingInitializations.push(callback);
    }
  }

  /**
   * Comprueba si un sistema está registrado
   * @param {string} name - Nombre del sistema
   * @returns {boolean} - Si está registrado
   */
  has(name) {
    return this.systems.has(name);
  }

  /**
   * Elimina un sistema del registro
   * @param {string} name - Nombre del sistema
   * @returns {boolean} - Si se eliminó correctamente
   */
  unregister(name) {
    return this.systems.delete(name);
  }

  /**
   * Obtiene un listado de todos los sistemas registrados
   * @returns {Array} - Array de pares [nombre, sistema]
   */
  getAll() {
    return Array.from(this.systems.entries());
  }

  /**
   * Establece pausa global en todos los sistemas
   * @param {boolean} paused - Estado de pausa
   */
  setPaused(paused) {
    console.log(`SystemRegistry: Estableciendo pausa global a ${paused}`);
    for (const system of this.systems.values()) {
      if (system.setPaused) {
        system.setPaused(paused);
      }
    }
  }

  /**
   * Establece multiplicador de velocidad global
   * @param {number} multiplier - Multiplicador
   */
  setSpeedMultiplier(multiplier) {
    // Guardar valor actual para sistemas futuros
    this.speedMultiplier = multiplier;
    
    console.log(`SystemRegistry: Estableciendo multiplicador global a ${multiplier}x`);
    for (const [name, system] of this.systems.entries()) {
      if (system.setSpeedMultiplier) {
        console.log(`Aplicando multiplicador ${multiplier}x a sistema: ${name}`);
        system.setSpeedMultiplier(multiplier);
      }
    }
  }

  /**
   * Reinicia todos los sistemas
   */
  resetAll() {
    for (const system of this.systems.values()) {
      if (system.reset) {
        system.reset();
      }
    }
  }

  /**
   * Sincroniza las referencias entre sistemas
   * Útil cuando los sistemas necesitan acceder a otros
   */
  syncSystemReferences() {
    for (const system of this.systems.values()) {
      if (system.syncReferences) {
        system.syncReferences(this);
      }
    }
  }
}

// Instancia global para todo el juego
export const globalRegistry = new SystemRegistry();