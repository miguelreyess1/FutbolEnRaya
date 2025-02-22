// exportarJugadores.js
const fs = require("fs");
const mysql = require("mysql2/promise");

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
      database: "futbolenraya"
    });

    // 1) Obtener jugadores + nacionalidad
    const [playersRows] = await conn.execute(`
      SELECT p.id, p.name, n.name AS nationality
      FROM players p
      JOIN nationalities n ON n.id = p.nationality_id
    `);

    // 2) Obtener clubs de cada jugador
    const [clubsRows] = await conn.execute(`
      SELECT p.id AS player_id, c.name AS club_name
      FROM players p
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      ORDER BY p.id
    `);

    await conn.end();

    // 3) Crear un map { player_id: [club1, club2, ...], ... }
    const clubsMap = {};
    for (const row of clubsRows) {
      if (!clubsMap[row.player_id]) {
        clubsMap[row.player_id] = [];
      }
      clubsMap[row.player_id].push(row.club_name);
    }

    // 4) Array de jugadores
    const players = playersRows.map(p => ({
      name: p.name,
      nationality: p.nationality,
      clubs: clubsMap[p.id] || []
    }));

    const lines = players.map((p, i) => {
    const jsonStr = JSON.stringify(p);
    if (i < players.length - 1) {
      return jsonStr + ",";
    } else {
      return jsonStr;
    }
  });
  
  const finalStr = lines.join("\n");

  fs.writeFileSync("C:/Users/Miguel/Documents/FutbolEnRaya/db/fullDB.json", "[" + finalStr + "]");
  

    console.log("Exportación completada. Datos guardados en ese formato pseudo-JSON.");
  } catch (err) {
    console.error("Error exportando jugadores:", err);
  }
})();
