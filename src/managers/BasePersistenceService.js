// src/services/BasePersistenceService.js

/**
 * Servicio para persistencia de datos de la base
 * Encargado de guardar y cargar datos entre sesiones
 */
export default class BasePersistenceService {
    /**
     * Clave para almacenamiento de mejoras
     */
    static STORAGE_KEY = 'loop_adventure_base_upgrades';
  
    /**
     * Carga las mejoras de la base desde localStorage
     * @returns {Object} Objeto con niveles de mejoras
     */
    loadBaseUpgrades() {
      try {
        const savedUpgrades = localStorage.getItem(BasePersistenceService.STORAGE_KEY);
        
        if (savedUpgrades) {
          return JSON.parse(savedUpgrades);
        }
      } catch (e) {
        console.error('Error cargando mejoras de la base:', e);
      }
      
      // Valores por defecto si no hay datos guardados o hay error
      return {
        campfire: 0,
        forge: 0,
        library: 0,
        garden: 0
      };
    }
  
    /**
     * Guarda las mejoras de la base en localStorage
     * @param {Object} upgrades - Objeto con niveles de mejoras
     * @returns {boolean} Si se guardó correctamente
     */
    saveBaseUpgrades(upgrades) {
      if (!upgrades) return false;
      
      try {
        localStorage.setItem(
          BasePersistenceService.STORAGE_KEY,
          JSON.stringify(upgrades)
        );
        return true;
      } catch (e) {
        console.error('Error guardando mejoras de la base:', e);
        return false;
      }
    }
  
    /**
     * Elimina las mejoras guardadas (reset)
     * @returns {boolean} Si se eliminó correctamente
     */
    clearBaseUpgrades() {
      try {
        localStorage.removeItem(BasePersistenceService.STORAGE_KEY);
        return true;
      } catch (e) {
        console.error('Error eliminando mejoras de la base:', e);
        return false;
      }
    }
  }