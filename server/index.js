// server/index.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

// Ajusta credenciales de tu BD
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",       // tu password, si corresponde
  database: "futbolenraya"
};

const app = express();
app.use(cors());            // Permite peticiones desde el frontend
app.use(express.json());    // Para parsear JSON en POST

// 1) Endpoint: generar las etiquetas (3 columnas, 3 filas)
app.get("/generate-board", async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);

    // a) Seleccionamos 3 clubes aleatorios
    const [clubs] = await conn.execute(`
      SELECT name 
      FROM clubs
      ORDER BY RAND()
      LIMIT 3
    `);

    // b) Seleccionamos 3 nacionalidades aleatorias
    const [nations] = await conn.execute(`
      SELECT name
      FROM nationalities
      ORDER BY RAND()
      LIMIT 3
    `);

    // OPCIONAL: Verificar que cada intersección (club, nacionalidad)
    // tenga al menos 1 jugador. Si no, podrías reintentar.
    // Aquí, por simplicidad, devolvemos lo que salga.

    await conn.end();

    res.json({
      clubs: clubs.map(c => c.name),
      nationalities: nations.map(n => n.name)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando el tablero" });
  }
});

// 2) Endpoint: comprobar el jugador que el usuario propone
app.post("/check-guess", async (req, res) => {
  // El body vendrá con: { guess, club, nationality }
  const { guess, club, nationality } = req.body;
  if (!guess || !club || !nationality) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);

    // Consulta para ver si existe un jugador con ese nombre
    // que tenga esa nacionalidad y haya jugado en ese club.
    // Asumiendo tablas: players, clubs, nationalities, player_clubs
    // Estructura:
    // players: id, name, nationality_id
    // clubs: id, name
    // nationalities: id, name
    // player_clubs: player_id, club_id

    const sql = `
      SELECT COUNT(*) AS count
      FROM players p
      JOIN nationalities n ON n.id = p.nationality_id
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      WHERE p.name = ?
        AND n.name = ?
        AND c.name = ?
    `;
    const [rows] = await conn.execute(sql, [guess, nationality, club]);
    await conn.end();

    // Si count > 0, el jugador cumple las condiciones
    if (rows[0].count > 0) {
      return res.json({ success: true, message: "¡Acierto!" });
    } else {
      return res.json({ success: false, message: "No cumple requisitos" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error verificando el jugador" });
  }
});

// 3) Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
