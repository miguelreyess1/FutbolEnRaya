FutbolEnRaya

FutbolEnRaya es un juego de tres en raya (tic-tac-toe) donde, en lugar de usar “X” y “O”, los jugadores deben adivinar futbolistas que cumplan ciertas condiciones (club, nacionalidad, etc.). 

La aplicación se conecta a una base de datos MySQL con millones de registros (jugadores, clubes, nacionalidades) y permite validar si el futbolista elegido coincide con la casilla.

Características

Tablero dinámico 3×3: se generan aleatoriamente 3 “etiquetas” en la parte superior (por ejemplo, nacionalidades) y 3 en la parte izquierda (por ejemplo, clubes), creando 9 intersecciones posibles.

Validación en tiempo real: cada vez que el usuario introduce un nombre de jugador, se verifica en la base de datos si cumple las condiciones de la casilla (club y/o nacionalidad).

Interfaz sencilla: el usuario puede hacer clic en una celda y escribir el nombre del jugador en un buscador único, sin ventanas emergentes.

Conexión a MySQL: el servidor Node.js se conecta a una base de datos MySQL donde se almacenan los jugadores y sus relaciones con nacionalidades y clubes.

Adaptable: se pueden cambiar las reglas para incluir más atributos (ej. ligas, selecciones, etc.) y variar el tamaño del tablero.

Requisitos

Node.js (versión 14 o superior recomendada).
MySQL instalado y en ejecución.
Git (opcional, si vas a clonar este repositorio).

Instalación

Clona este repositorio (o descárgalo en zip):

git clone https://github.com/tu-usuario/FutbolEnRaya.git

Entra en la carpeta del proyecto:
cd FutbolEnRaya

Instala dependencias del servidor (dentro de la carpeta server):
cd server
npm install

Configura la base de datos:
Crea una base de datos en MySQL (por ejemplo TresEnRayaDB).

Ejecuta el script db/init.sql para crear tablas y datos de ejemplo.
Ajusta las credenciales en server/index.js (host, user, password, database).

Uso
Inicia el servidor:

node index.js
Esto levantará la aplicación en http://localhost:3000.

Abre tu navegador y visita http://localhost:3000.

Verás la página principal con un botón para generar el tablero.

Al pulsarlo, se mostrará una cuadrícula 3×3 con condiciones (club/nacionalidad) en filas y columnas.

Haz clic en una casilla:

Debajo del tablero aparece un buscador.
Escribe el nombre de un jugador que creas que cumple las condiciones.
Si aciertas, el nombre aparecerá en la casilla.
Si no, la casilla no cambia (podrías intentar otro nombre).
Objetivo: Conseguir hacer 3 en raya (horizontal, vertical o diagonal) con jugadores válidos.

Estructura del Proyecto
pgsql

FutbolEnRaya/
├─ db/
│   └─ init.sql              (Script para crear e insertar datos en la BD)
├─ server/
│   ├─ index.js              (Servidor Node + Express)
│   ├─ package.json          (Dependencias del proyecto)
│   └─ (otros archivos)
└─ public/
    ├─ index.html            (Interfaz principal)
    ├─ main.js               (Lógica de frontend para generar tablero y usar buscador)
    └─ styles.css            (Hoja de estilos)

db/init.sql: Crea las tablas players, clubs, nationalities, etc., y las relaciones (player_clubs).
server/index.js: Configura Express, conecta con MySQL y define los endpoints:
GET /generate-board: genera aleatoriamente 3 clubs y 3 nacionalidades.
POST /check-guess: comprueba si el jugador cumple las condiciones.
public/: Contiene los archivos estáticos (HTML, CSS, JS) que conforman la interfaz.

Personalización
Puedes cambiar la lógica de “generar tablero” para incluir ligas, selecciones, o cualquier otro atributo.
Puedes modificar las consultas a la base de datos para filtrar jugadores por distintas condiciones.
El sistema de “turnos” y “marcador” es ampliable: actualmente se muestra un marcador básico, pero podrías controlar dos jugadores y alternar turnos.

Estado del Proyecto
 Conexión a MySQL
 Generación de tablero aleatorio
 Verificación de jugadores
 Sistema de puntuación y turnos avanzado
 Soporte para autocompletado en el buscador

Contribuciones
¡Las contribuciones son bienvenidas! Si quieres proponer mejoras, por favor:
Haz un fork del repositorio.
Crea una rama con tu nueva funcionalidad (git checkout -b feature/nueva-funcionalidad).
Haz commit de tus cambios y súbelos a tu fork.
Abre un Pull Request explicando el cambio.

Licencia
Este proyecto se distribuye bajo la MIT License. Siéntete libre de usarlo y modificarlo en tus propios proyectos.

¡Disfruta de FutbolEnRaya y no dudes en mejorar o personalizar el juego a tu gusto!