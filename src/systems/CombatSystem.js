// src/systems/CombatSystem.js
export default class CombatSystem {
    constructor(scene) {
      this.scene = scene;
      this.activeEncounters = new Map();
      this.effectsManager = null;
      this.combatLog = [];
      this.maxLogEntries = 5;
      this.isActive = false;
      
      // Registrar eventos
      this.registerEvents();
    }
  
    /**
     * Inicializa el sistema de efectos visuales de combate
     * @param {CombatEffectsManager} effectsManager - Gestor de efectos
     */
    setEffectsManager(effectsManager) {
      this.effectsManager = effectsManager;
    }
  
    /**
     * Registra los eventos necesarios para el sistema de combate
     */
    registerEvents() {
      // Cuando un jugador inicia combate con un enemigo
      this.scene.events.on('combat-started', this.handleCombatStarted, this);
      
      // Cuando se produce un ataque
      this.scene.events.on('entity-attack', this.handleEntityAttack, this);
      
      // Cuando una entidad recibe daño
      this.scene.events.on('entity-damaged', this.handleEntityDamaged, this);
      
      // Cuando una entidad muere
      this.scene.events.on('entity-died', this.handleEntityDied, this);
    }
  
    /**
     * Maneja el inicio de combate entre entidades
     * @param {Entity} attacker - Entidad atacante
     * @param {Entity} defender - Entidad defensora
     */
    handleCombatStarted(attacker, defender) {
      // Identificador único para este encuentro
      const encounterId = `${attacker.id}_vs_${defender.id}`;
      
      // Verificar si ya existe este encuentro
      if (this.activeEncounters.has(encounterId)) {
        return;
      }
      
      // Registrar el nuevo encuentro
      this.activeEncounters.set(encounterId, {
        attacker,
        defender,
        startTime: this.scene.time.now,
        lastActionTime: this.scene.time.now,
        roundCount: 0
      });
      
      // Añadir al log
      this.addLogEntry(`${this.getEntityName(attacker)} entra en combate con ${this.getEntityName(defender)}`);
      
      // Activar sistema si es el primer combate
      if (this.activeEncounters.size === 1) {
        this.isActive = true;
      }
    }
  
    /**
     * Maneja un ataque de una entidad a otra
     * @param {Entity} attacker - Entidad que ataca
     * @param {Entity} defender - Entidad que defiende
     * @param {number} damage - Daño causado
     */
    handleEntityAttack(attacker, defender, damage) {
      // Buscar el encuentro correspondiente
      for (const [id, encounter] of this.activeEncounters.entries()) {
        if ((encounter.attacker === attacker && encounter.defender === defender) ||
            (encounter.attacker === defender && encounter.defender === attacker)) {
          // Actualizar estado del encuentro
          encounter.lastActionTime = this.scene.time.now;
          encounter.roundCount++;
          
          // Añadir al log
          this.addLogEntry(`${this.getEntityName(attacker)} ataca a ${this.getEntityName(defender)} causando ${damage} de daño`);
          
          // Reproducir efectos visuales si está disponible
          if (this.effectsManager) {
            this.effectsManager.playAttackEffect(attacker, defender, damage);
          }
          
          break;
        }
      }
    }
  
    /**
     * Maneja cuando una entidad recibe daño
     * @param {Entity} entity - Entidad que recibe daño
     * @param {number} damage - Cantidad de daño
     * @param {Entity} source - Fuente del daño
     */
    handleEntityDamaged(entity, damage, source) {
      // Reproducir efectos visuales si está disponible
      if (this.effectsManager) {
        this.effectsManager.playDamageEffect(entity, damage);
      }
      
      // Si es daño crítico, efectos especiales
      if (damage > entity.stats.maxHealth * 0.2) {
        // Añadir al log para daños significativos
        this.addLogEntry(`¡${this.getEntityName(entity)} recibe un golpe crítico de ${damage}!`);
        
        if (this.effectsManager) {
          this.effectsManager.playCriticalEffect(entity);
        }
      }
    }
  
    /**
     * Maneja cuando una entidad muere
     * @param {Entity} entity - Entidad que muere
     * @param {Entity} killer - Entidad que causa la muerte
     */
    handleEntityDied(entity, killer) {
      // Buscar y eliminar todos los encuentros relacionados con esta entidad
      for (const [id, encounter] of this.activeEncounters.entries()) {
        if (encounter.attacker === entity || encounter.defender === entity) {
          this.activeEncounters.delete(id);
        }
      }
      
      // Añadir al log
      if (killer) {
        this.addLogEntry(`${this.getEntityName(killer)} ha derrotado a ${this.getEntityName(entity)}`);
      } else {
        this.addLogEntry(`${this.getEntityName(entity)} ha muerto`);
      }
      
      // Reproducir efectos visuales
      if (this.effectsManager) {
        this.effectsManager.playDeathEffect(entity);
      }
      
      // Desactivar sistema si no hay más combates
      if (this.activeEncounters.size === 0) {
        this.isActive = false;
      }
    }
  
    /**
     * Obtiene el nombre descriptivo de una entidad
     * @param {Entity} entity - Entidad
     * @returns {string} Nombre descriptivo
     */
    getEntityName(entity) {
      if (entity.type === 'player') {
        return 'Jugador';
      } else if (entity.type === 'enemy') {
        const typeNames = {
          'slime': 'Slime',
          'skeleton': 'Esqueleto',
          'goblin': 'Goblin',
          'default': 'Enemigo'
        };
        return typeNames[entity.enemyType] || typeNames.default;
      }
      return 'Entidad desconocida';
    }
  
    /**
     * Añade una entrada al log de combate
     * @param {string} message - Mensaje a añadir
     */
    addLogEntry(message) {
      // Añadir timestamp
      const entry = {
        message,
        time: this.scene.time.now
      };
      
      // Añadir al inicio del array
      this.combatLog.unshift(entry);
      
      // Limitar tamaño
      if (this.combatLog.length > this.maxLogEntries) {
        this.combatLog.pop();
      }
      
      // Emitir evento para UI
      this.scene.events.emit('combat-log-updated', this.combatLog);
    }
  
    /**
     * Actualiza el estado de todos los combates
     * @param {number} delta - Tiempo transcurrido desde el último frame
     */
    update(delta) {
      if (!this.isActive) return;
      
      // Comprobar encuentros que puedan haberse quedado sin resolver
      const now = this.scene.time.now;
      const timeoutThreshold = 30000; // 30 segundos sin acción
      
      for (const [id, encounter] of this.activeEncounters.entries()) {
        // Si alguna entidad ya no está activa, eliminar encuentro
        if (!encounter.attacker.isActive() || !encounter.defender.isActive()) {
          this.activeEncounters.delete(id);
          continue;
        }
        
        // Verificar timeout
        if (now - encounter.lastActionTime > timeoutThreshold) {
          // Timeout - cancelar encuentro
          this.addLogEntry(`Combate entre ${this.getEntityName(encounter.attacker)} y ${this.getEntityName(encounter.defender)} terminado`);
          this.activeEncounters.delete(id);
        }
      }
      
      // Desactivar sistema si no hay más combates
      if (this.activeEncounters.size === 0) {
        this.isActive = false;
      }
    }
  }