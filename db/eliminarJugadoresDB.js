// eliminarJugadoresDB.js
const mysql = require("mysql2/promise");

// Función para borrar jugadores por nombre
async function deletePlayersByName(playerNames) {
  // Ajusta credenciales de tu DB
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "futbolenraya"
  });

  try {
    // 1) Borrar relaciones en player_clubs
    await connection.query(`
      DELETE pc
      FROM player_clubs pc
      JOIN players p ON pc.player_id = p.id
      WHERE p.name IN (?);
    `, [playerNames]);

    // 2) Borrar los jugadores de la tabla players
    await connection.query(`
      DELETE FROM players
      WHERE name IN (?);
    `, [playerNames]);

    console.log(`Jugadores eliminados: ${playerNames.join(", ")}`);
  } catch (err) {
    console.error("Error al borrar jugadores:", err);
  } finally {
    await connection.end();
  }
}

// === LÓGICA PRINCIPAL ===

// Lee los argumentos de la línea de comandos.
// process.argv es un array con [rutaNode, rutaScript, ...args]
const args = process.argv.slice(2);

// Si no hay argumentos, salimos
if (args.length === 0) {
  console.log("Uso: node eliminarJugadoresDB.js \"Nombre Jugador\"");
  process.exit(1);
}

// Aquí 'args' será un array con lo que pongas tras el script.
// Por ejemplo, si escribes: node eliminarJugadoresDB.js "Eric García"
// => args = ["Eric García"]

// Llamamos a la función con el array de nombres
deletePlayersByName(args);
