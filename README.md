# LGame

Un juego estilo Loop Hero desarrollado con Phaser.js, siguiendo un estilo pixel art.

## Características

- Loops automáticos donde el personaje recorre un camino
- Combate automático con controles de velocidad
- Sistema de colocación de tiles que afectan al entorno
- Progresión a través de niveles, equipamiento y desbloqueos
- Sistema día/noche y eventos aleatorios

## Desarrollo

### Requisitos previos

- Node.js (versión 14.x o superior)
- npm (normalmente viene con Node.js)

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd LGame

# Instalar dependencias
npm install
```

### Comandos disponibles

```bash
# Iniciar servidor de desarrollo
npm start

# Construir para producción
npm run build

# Ejecutar linting
npm run lint

# Formatear código
npm run format
```

## Estructura de directorios

- `/src`: Código fuente
  - `/scenes`: Escenas de Phaser
  - `/entities`: Clases para entidades del juego
  - `/systems`: Sistemas del juego (combate, progresión, etc.)
  - `/ui`: Componentes de interfaz de usuario
  - `/utils`: Utilidades y funciones auxiliares
- `/assets`: Recursos del juego
  - `/images`: Sprites e imágenes
  - `/audio`: Música y efectos de sonido
  - `/fonts`: Fuentes utilizadas
- `/dist`: Archivos generados para producción
- `/docs`: Documentación del proyecto
