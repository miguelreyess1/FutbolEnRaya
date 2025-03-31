# ⚽ FutbolEnRaya 🎮

[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC_BY--NC--ND_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
![Project Status](https://img.shields.io/badge/Status-En%20Desarrollo-yellowgreen)

**Un Tres en Raya Futbolero con Base de Datos en Tiem Real**  
¡Adivina jugadores que cumplan condiciones específicas para ganar!

## 🌟 Características Principales

| 🎯 Función                  | 📚 Descripción                                                                |
| --------------------------- | ----------------------------------------------------------------------------- |
| 🧩 Tablero Dinámico 3x3     | Genera aleatoriamente combinaciones de clubes y nacionalidades                |
| 🔍 Validación en Tiem Real  | Consulta instantánea a base de datos MySQL con millones de registros          |
| 📱 Interfaz Intuitiva       | Búsqueda unificada con autocompletado y sistema de puntuación visual          |
| 🛠️ Altamente Personalizable | Fácil adaptación para incluir nuevas categorías (ligas, edades, posiciones)   |

## 📋 Requisitos Técnicos

- Node.js v14+
- MySQL 8.0+
- Git (recomendado)

## 🚀 Instalación Rápida

1. **Clonar Repositorio**
   ```bash
   git clone https://github.com/tu-usuario/FutbolEnRaya.git
   cd FutbolEnRaya
2. Instalar Dependencias
    ```bash
    cd server
    npm install
3. Configurar Base de Datos
   ```bash
   -- Ejecutar en MySQL
    CREATE DATABASE TresEnRayaDB;
    USE TresEnRayaDB;
    SOURCE db/init.sql;
4. Configurar Variables de Entorno
    Editar server/inde.js con tus credenciales MySQL:
    ```bash
    const db = mysql.createConnection({
    host: 'localhost',
    user: 'tu_usuario',
    password: 'tu_contraseña',
    database: 'TresEnRayaDB'
    });

## ▶️ Cómo Jugar

1. Iniciar servidor:
    ```bash
    node server/index.js
2. Abrir navegador en http://localhost:3000
3. Generar nuevo tablero con el botón 🔄
4. Hacer clic en celda y buscar al jugador
5. !Gana consiguiendo 3 en raya válidos!

## 🗂️ Estructura del Proyecto
FutbolEnRaya/
├── db/
│   └── init.sql           # Scripts de inicialización BD
├── server/
│   ├── index.js           # Lógica del servidor
│   └── package.json       # Dependencias Node
└── public/
    ├── index.html         # Interfaz principal
    ├── main.js            # Lógica del juego
    └── styles.css         # Estilos visuales

## 📜 Licencia

Este proyecto está bajo la licencia Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International.

Puedes:

    Compartir el material en cualquier medio

    Usar el código para fines no comerciales

No puedes:

    Usar el material con fines comerciales

    Distribuir material modificado

Licencia CC

## 📞 Contacto

¿Preguntas o sugerencias?
✉️  miguel.reyesgomez1@gmail.com

¡Que empiece el juego! ⚽🎉
