const fs = require("fs");
const mysql = require("mysql2/promise");

(async () => {
  try {
    // 1) Conectar a MySQL
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
      database: "FutbolEnRaya"
    });

    // 2) Leer fullDB.json (la base de datos JSON local)
    let fullDB = [];
    if (fs.existsSync("fullDB.json")) {
      const rawFullDB = fs.readFileSync("fullDB.json", "utf-8");
      fullDB = JSON.parse(rawFullDB); // array de jugadores ya conocidos
    }

    // 3) Leer el archivo con nuevos jugadores (newPlayers.json)
    const rawNew = fs.readFileSync("jugadores.json", "utf-8");
    const newPlayers = JSON.parse(rawNew); // array con jugadores nuevos

    // 4) Para cada jugador en newPlayers:
    for (const p of newPlayers) {
      // 4A) Comprobar si ya existe en fullDB
      const exists = fullDB.some(existing =>
        existing.name.toLowerCase() === p.name.toLowerCase() &&
        existing.nationality.toLowerCase() === p.nationality.toLowerCase()
      );

      if (!exists) {
        // => no existe en fullDB, lo insertamos en la BD y lo añadimos a fullDB

        // (A) Asegurar que la nacionalidad existe
        let [rows] = await connection.query(
          "SELECT id FROM nationalities WHERE name = ?",
          [p.nationality]
        );
        let nationalityId;
        if (rows.length > 0) {
          nationalityId = rows[0].id;
        } else {
          let [resultN] = await connection.query(
            "INSERT INTO nationalities (name) VALUES (?)",
            [p.nationality]
          );
          nationalityId = resultN.insertId;
        }

        // (B) Insertar en players
        let [resultP] = await connection.query(
          "INSERT INTO players (name, nationality_id) VALUES (?, ?)",
          [p.name, nationalityId]
        );
        const playerId = resultP.insertId;

        // (C) Para cada club
        for (const clubName of p.clubs) {
          // Ver si existe el club
          [rows] = await connection.query(
            "SELECT id FROM clubs WHERE name = ?",
            [clubName]
          );
          let clubId;
          if (rows.length > 0) {
            clubId = rows[0].id;
          } else {
            let [resultC] = await connection.query(
              "INSERT INTO clubs (name) VALUES (?)",
              [clubName]
            );
            clubId = resultC.insertId;
          }

          // Relacionar en player_clubs
          await connection.query(
            "INSERT INTO player_clubs (player_id, club_id) VALUES (?, ?)",
            [playerId, clubId]
          );
        }

        // (D) Añadirlo a fullDB
        fullDB.push(p);
        console.log(`Insertado jugador: ${p.name} (${p.nationality})`);
      } else {
        console.log(`Ya existe en fullDB: ${p.name} (${p.nationality}). Omitiendo...`);
      }
    }

    // 5) Guardar fullDB actualizado
    fs.writeFileSync("fullDB.json", JSON.stringify(fullDB, null, 2));
    console.log("Importación finalizada. fullDB.json actualizado.");

    await connection.end();
  } catch (err) {
    console.error("Error:", err);
  }
})();
