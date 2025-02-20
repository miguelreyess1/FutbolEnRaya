// index.js
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

// 1) GET /generate-board
app.get("/generate-board", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // 1A) Obtener todos los pares (club, nationality) que existan
    // (es decir, para los que hay al menos 1 jugador)
    const [pairs] = await conn.execute(`
      SELECT DISTINCT c.name AS club, n.name AS nationality
      FROM players p
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      JOIN nationalities n ON n.id = p.nationality_id
    `);

    // Cerrar conexión
    await conn.end();

    // Listas únicas de clubs y nacionalidades
    const allClubs = [...new Set(pairs.map(p => p.club))];
    const allNations = [...new Set(pairs.map(p => p.nationality))];

    // Función para generar todas las combinaciones de tamaño k
    function getCombinations(arr, k) {
      const results = [];
      function backtrack(start, combo) {
        if (combo.length === k) {
          results.push([...combo]);
          return;
        }
        for (let i = start; i < arr.length; i++) {
          combo.push(arr[i]);
          backtrack(i + 1, combo);
          combo.pop();
        }
      }
      backtrack(0, []);
      return results;
    }

    // Generar combinaciones de 3 clubs y 3 nacionalidades
    const clubCombos = getCombinations(allClubs, 3);
    const nationCombos = getCombinations(allNations, 3);

    // Almacenar TODAS las combinaciones de clubs y naciones que sean válidas
    const validBoards = [];

    // Recorremos todas las combinaciones 3x3
    for (const cCombo of clubCombos) {
      for (const nCombo of nationCombos) {
        // Verificamos que las 9 celdas (club, nationality) existan en pairs
        let allExist = true;
        for (const club of cCombo) {
          for (const nat of nCombo) {
            const exists = pairs.some(p => p.club === club && p.nationality === nat);
            if (!exists) {
              allExist = false;
              break;
            }
          }
          if (!allExist) break;
        }
        // Si existen todas las 9 celdas, guardamos esta combinación como válida
        if (allExist) {
          validBoards.push({
            clubs: cCombo,
            nationalities: nCombo
          });
        }
      }
    }

    // Si no hay ninguna combinación válida, error
    if (validBoards.length === 0) {
      return res.status(400).json({
        error: "No se pudo generar un tablero válido (3 clubs x 3 nacionalidades)."
      });
    }

    // Elegir UNA combinación válida al azar, para que no salga siempre la misma
    const randomIndex = Math.floor(Math.random() * validBoards.length);
    const chosen = validBoards[randomIndex];

    // Responder con la combinación elegida
    res.json({
      clubs: chosen.clubs,
      nationalities: chosen.nationalities
    });

  } catch (err) {
    console.error("Error en /generate-board:", err);
    if (conn) await conn.end();
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 2) POST /check-guess
app.post("/check-guess", async (req, res) => {
  const { guess } = req.body;
  if (!guess) {
    return res.status(400).json({ error: "Falta el nombre del jugador" });
  }
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Buscar club y nacionalidad de ese jugador
    const [rows] = await conn.execute(`
      SELECT c.name AS club, n.name AS nationality
      FROM players p
      JOIN nationalities n ON n.id = p.nationality_id
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      WHERE p.name = ?
    `, [guess]);

    await conn.end();

    // rows es un array de { club, nationality }
    const validCombinations = rows.map(r => `${r.club}|${r.nationality}`);

    res.json({
      validCombinations,
      message: validCombinations.length > 0
        ? "¡Jugador válido!"
        : "No cumple los requisitos"
    });

  } catch (err) {
    console.error("Error en /check-guess:", err);
    if (conn) await conn.end();
    res.status(500).json({ error: "Error en la verificación" });
  }
});

// 3) GET /search-players?query=...
// Para autocompletado
app.get("/search-players", async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.json([]);
  }
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT name FROM players WHERE name LIKE ? LIMIT 10",
      [`%${query}%`]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("Error en /search-players:", err);
    if (conn) await conn.end();
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

// 4) Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});