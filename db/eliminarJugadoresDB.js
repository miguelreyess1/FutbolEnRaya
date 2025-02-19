const mysql = require("mysql2/promise");

async function deletePlayersByName(playerNames) 
{
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
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Uso: node eliminarJugadoresDB.js \"Nombre Jugador\"");
  process.exit(1);
}

deletePlayersByName(args);
