// server/index.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "futbolenraya"
};

const app = express();
app.use(cors());
app.use(express.json());

app.get("/generate-board", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    let isValid = false;
    let attempts = 0;

    while (!isValid && attempts < 50) {
      attempts++;
      
      const clubLimit = 3 + Math.floor(Math.random() * 2);
      const nationLimit = 3 + Math.floor(Math.random() * 2);
      
      const [clubs] = await conn.execute(`
        SELECT name FROM clubs 
        ORDER BY RAND() 
        LIMIT ${clubLimit}
      `);
      
      const [nations] = await conn.execute(`
        SELECT name FROM nationalities
        ORDER BY RAND()
        LIMIT ${nationLimit}
      `);

      // Verificar combinaciones
      const combinations = clubs.flatMap(c => 
        nations.map(n => [c.name, n.name])
      );

      const validCombinations = await Promise.all(
        combinations.map(async ([club, nation]) => {
          const [rows] = await conn.execute(
            `SELECT COUNT(*) AS count 
             FROM players p
             JOIN nationalities n ON n.id = p.nationality_id
             JOIN player_clubs pc ON pc.player_id = p.id
             JOIN clubs c ON c.id = pc.club_id
             WHERE c.name = ? AND n.name = ?`,
            [club, nation]
          );
          return rows[0].count > 0;
        })
      );
      isValid = validCombinations.every(Boolean);
      
      if (isValid) {
        await conn.end();
        return res.json({
          clubs: clubs.map(c => c.name),
          nationalities: nations.map(n => n.name)
        });
      }
    }

    await conn.end();
    res.status(400).json({ 
      error: "No se pudo generar un tablero válido después de 10 intentos" 
    });
    
  } catch (err) {
    console.error("Error en generate-board:", err);
    if (conn) await conn.end();
    res.status(500).json({ 
      error: "Error interno del servidor: " + err.message 
    });
  }
});

app.post("/check-guess", async (req, res) => {
  const { guess } = req.body;
  
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    const [playerData] = await conn.execute(`
      SELECT c.name AS club, n.name AS nationality
      FROM players p
      JOIN nationalities n ON n.id = p.nationality_id
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      WHERE p.name = ?
    `, [guess]);

    await conn.end();
    
    const playerCombinations = playerData.map(p => 
      `${p.club}|${p.nationality}`
    );

    res.json({
      validCombinations: playerCombinations,
      message: playerCombinations.length > 0 ? 
               "¡Jugador válido!" : "No cumple los requisitos"
    });
  } catch (err) {
    res.status(500).json({ error: "Error en la verificación" });
  }
});

app.get("/search-players", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.json([]);

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT name FROM players WHERE name LIKE ? LIMIT 10",
      [`%${query}%`]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

app.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});