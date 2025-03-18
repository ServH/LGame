// src/systems/PathSystem.js
export default class PathSystem {
  constructor(scene) {
    this.scene = scene;
    this.path = [];
    this.pathGraphics = scene.add.graphics();
    this.loopActive = false;
    this.currentNodeIndex = 0;
    this.movementSpeed = 60; // píxeles por segundo
    this.nodeReachedDistance = 10; // Aumentado para evitar saltos
    this.pathColor = 0x555555;
    this.pathWidth = 16;
    this.speedMultiplier = 1;
    
    console.log('PathSystem inicializado con movementSpeed:', this.movementSpeed);
    console.log('PathSystem inicializado con nodeReachedDistance:', this.nodeReachedDistance);
  }

  /**
   * Genera un camino básico rectangular
   * @param {number} centerX - Centro X del camino
   * @param {number} centerY - Centro Y del camino
   * @param {number} width - Ancho del rectángulo
   * @param {number} height - Alto del rectángulo
   * @param {number} nodeCount - Cantidad de nodos en el camino
   */
  generateRectangularPath(centerX, centerY, width, height, nodeCount = 20) {
    this.path = [];
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Crear los puntos del rectángulo
    const topLeft = { x: centerX - halfWidth, y: centerY - halfHeight };
    const topRight = { x: centerX + halfWidth, y: centerY - halfHeight };
    const bottomRight = { x: centerX + halfWidth, y: centerY + halfHeight };
    const bottomLeft = { x: centerX - halfWidth, y: centerY + halfHeight };
    
    // Dividir cada lado en nodos
    const nodesPerSide = Math.floor(nodeCount / 4);
    
    // Lado superior
    for (let i = 0; i <= nodesPerSide; i++) {
      const t = i / nodesPerSide;
      this.path.push({
        x: topLeft.x + t * (topRight.x - topLeft.x),
        y: topLeft.y
      });
    }
    
    // Lado derecho
    for (let i = 1; i <= nodesPerSide; i++) {
      const t = i / nodesPerSide;
      this.path.push({
        x: topRight.x,
        y: topRight.y + t * (bottomRight.y - topRight.y)
      });
    }
    
    // Lado inferior (de derecha a izquierda)
    for (let i = 1; i <= nodesPerSide; i++) {
      const t = i / nodesPerSide;
      this.path.push({
        x: bottomRight.x - t * (bottomRight.x - bottomLeft.x),
        y: bottomRight.y
      });
    }
    
    // Lado izquierdo (de abajo hacia arriba)
    for (let i = 1; i < nodesPerSide; i++) {
      const t = i / nodesPerSide;
      this.path.push({
        x: bottomLeft.x,
        y: bottomLeft.y - t * (bottomLeft.y - topLeft.y)
      });
    }
    
    console.log(`Path generado con ${this.path.length} nodos`);
    this.drawPath();
    
    return this.path;
  }

  /**
   * Dibuja el camino visualmente
   */
  drawPath() {
    if (this.path.length < 2) return;
    
    this.pathGraphics.clear();
    this.pathGraphics.lineStyle(this.pathWidth, this.pathColor, 1);
    
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(this.path[0].x, this.path[0].y);
    
    for (let i = 1; i < this.path.length; i++) {
      this.pathGraphics.lineTo(this.path[i].x, this.path[i].y);
    }
    
    // Cerrar el camino conectando con el primer punto
    this.pathGraphics.lineTo(this.path[0].x, this.path[0].y);
    
    this.pathGraphics.closePath();
    this.pathGraphics.strokePath();
  }

  /**
   * Inicia el movimiento en el loop
   * @param {Phaser.GameObjects.Sprite} entity - Entidad que recorrerá el camino
   */
  startLoop(entity) {
    if (this.path.length === 0) return;
    
    this.entity = entity;
    this.loopActive = true;
    this.currentNodeIndex = 0;
    
    // Colocar la entidad en el primer nodo
    if (entity && this.path[0]) {
      entity.x = this.path[0].x;
      entity.y = this.path[0].y;
      console.log(`Iniciando loop con entidad en posición (${entity.x}, ${entity.y})`);
    }
  }

  /**
   * Detiene el movimiento en el loop
   */
  stopLoop() {
    this.loopActive = false;
    console.log("Loop detenido");
  }

  /**
   * Modifica la velocidad de movimiento
   * @param {number} multiplier - Multiplicador de velocidad
   */
  setSpeedMultiplier(multiplier) {
    const oldMultiplier = this.speedMultiplier;
    this.speedMultiplier = multiplier;
    console.log(`PathSystem: Velocidad cambiada de ${oldMultiplier}x a ${multiplier}x`);
  }

  /**
   * Actualiza el movimiento de la entidad en el camino
   * @param {number} delta - Tiempo transcurrido desde el último frame
   */
  update(delta) {
    if (!this.loopActive || !this.entity || this.path.length === 0) return;
    
    // Añadir LOG: Verificar delta y speedMultiplier
    if (this.entity.type === 'player' && Math.random() < 0.05) {
      console.log(`PathSystem: delta=${delta}, speedMultiplier=${this.speedMultiplier}`);
    }
    
    const targetNode = this.path[this.currentNodeIndex];
    const dx = targetNode.x - this.entity.x;
    const dy = targetNode.y - this.entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // LOG: Verificar distancia al nodo y nodeReachedDistance
    if (this.entity.type === 'player' && distance < this.nodeReachedDistance * 2 && Math.random() < 0.1) {
      console.log(`Distancia al nodo: ${distance}, umbral: ${this.nodeReachedDistance}`);
    }
    
    // Si llegamos al nodo objetivo, avanzamos al siguiente
    if (distance < this.nodeReachedDistance) {
      // Forzar posición exacta para evitar desviaciones acumulativas
      this.entity.x = targetNode.x;
      this.entity.y = targetNode.y;
      
      this.currentNodeIndex = (this.currentNodeIndex + 1) % this.path.length;
      
      // LOG: Nodo alcanzado
      console.log(`Nodo alcanzado: ${this.currentNodeIndex}, total nodos: ${this.path.length}`);
      
      // Disparar evento de nodo alcanzado
      this.scene.events.emit('path-node-reached', this.currentNodeIndex);
      
      // Si completamos un loop
      if (this.currentNodeIndex === 0) {
        console.log("¡Loop completado!");
        this.scene.events.emit('loop-completed');
      }
      
      return;
    }
    
    // Normalizar el vector de dirección
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    // Velocidad ajustada por el delta time para movimiento constante
    const adjustedDelta = delta / 1000; // Convertir a segundos
    const actualSpeed = this.movementSpeed * this.speedMultiplier * adjustedDelta;
    
    // LOG: Verificar velocidad aplicada
    if (this.entity.type === 'player' && Math.random() < 0.02) {
      console.log(`Velocidad aplicada: ${actualSpeed}, movSpeed: ${this.movementSpeed}, delta: ${adjustedDelta}`);
    }
    
    // Antes de actualizar las coordenadas - guardar posición anterior para log
    const oldX = this.entity.x;
    const oldY = this.entity.y;
    
    // Calcular el desplazamiento en cada eje
    const moveX = normalizedDx * actualSpeed;
    const moveY = normalizedDy * actualSpeed;
    
    // Verificar que el movimiento no exceda la distancia al nodo objetivo
    if (Math.abs(moveX) > Math.abs(dx) || Math.abs(moveY) > Math.abs(dy)) {
      // Si el movimiento calculado sobrepasa el nodo, simplemente ir al nodo
      this.entity.x = targetNode.x;
      this.entity.y = targetNode.y;
      console.log("Movimiento excesivo corregido - saltando directamente al nodo");
    } else {
      // Movimiento normal
      this.entity.x += moveX;
      this.entity.y += moveY;
    }
    
    // LOG: Verificar cambio de posición
    if (this.entity.type === 'player' && (Math.random() < 0.01)) {
      console.log(`Posición: (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) -> (${this.entity.x.toFixed(2)}, ${this.entity.y.toFixed(2)}), movimiento: (${moveX.toFixed(2)}, ${moveY.toFixed(2)})`);
    }
    
    // Actualizar orientación de la entidad - verificar si tiene el método setFlipX
    if (Math.abs(dx) > Math.abs(dy)) {
      // Cambiar la orientación del sprite si existe el método setFlipX
      if (this.entity.sprite && typeof this.entity.sprite.setFlipX === 'function') {
        this.entity.sprite.setFlipX(dx < 0);
      }
    }
  }

  /**
   * Añade un evento interactivo en el camino
   * @param {number} nodeIndex - Índice del nodo donde colocar el evento
   * @param {Function} callback - Función a ejecutar cuando la entidad pase por el nodo
   */
  addEventAtNode(nodeIndex, callback) {
    const validIndex = nodeIndex % this.path.length;
    
    // Guardar el callback para ese nodo
    this._nodeEvents = this._nodeEvents || {};
    this._nodeEvents[validIndex] = callback;
    
    // Escuchar el evento de nodo alcanzado
    this.scene.events.on('path-node-reached', (index) => {
      if (index === validIndex && this._nodeEvents[validIndex]) {
        this._nodeEvents[validIndex]();
      }
    });
    
    console.log(`Evento añadido en nodo ${validIndex}`);
  }

  /**
   * Añade una bifurcación en el camino
   * @param {number} nodeIndex - Índice del nodo donde colocar la bifurcación
   * @param {Array} alternativePath - Array de puntos que forman el camino alternativo
   */
  addBranch(nodeIndex, alternativePath) {
    // Esta es una implementación básica que se expandirá en fases posteriores
    this._branches = this._branches || {};
    this._branches[nodeIndex] = alternativePath;
    console.log(`Bifurcación añadida en nodo ${nodeIndex}`);
  }
}