const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

console.log("Iniciando servidor...");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "futbolenraya"
};

const app = express();
app.use(cors());
app.use(express.json());

console.log("Middleware de CORS y JSON configurados.");

/*************************************************************
 * Precalcular combinaciones válidas y almacenarlas en Sets
 *************************************************************/
async function loadValidPairs() {
  console.log("Cargando combinaciones válidas...");
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log("Conexión a la base de datos establecida.");

    // Obtener combinaciones club–club
    console.log("Obteniendo combinaciones club–club...");
    const [clubClubRows] = await conn.execute(`
      SELECT c1.id AS club1_id, c2.id AS club2_id
      FROM players p
      JOIN player_clubs pc1 ON pc1.player_id = p.id
      JOIN player_clubs pc2 ON pc2.player_id = p.id
      JOIN clubs c1 ON c1.id = pc1.club_id
      JOIN clubs c2 ON c2.id = pc2.club_id
      WHERE c1.id < c2.id
      GROUP BY c1.id, c2.id
    `);
    console.log("Combinaciones club–club obtenidas:", clubClubRows.length);

    // Obtener combinaciones club–nation
    console.log("Obteniendo combinaciones club–nation...");
    const [clubNationRows] = await conn.execute(`
      SELECT DISTINCT c.id AS club_id, n.id AS nation_id
      FROM players p
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      JOIN nationalities n ON n.id = p.nationality_id
    `);
    console.log("Combinaciones club–nation obtenidas:", clubNationRows.length);

    await conn.end();
    console.log("Conexión a la base de datos cerrada.");

    // Almacenar combinaciones válidas en Sets
    const validClubClubPairs = new Set();
    const validClubNationPairs = new Set();

    clubClubRows.forEach(row => {
      validClubClubPairs.add(`${row.club1_id}-${row.club2_id}`);
    });

    clubNationRows.forEach(row => {
      validClubNationPairs.add(`${row.club_id}-${row.nation_id}`);
    });

    console.log("Combinaciones válidas cargadas en Sets.");
    return { validClubClubPairs, validClubNationPairs };
  } catch (err) {
    console.error("Error al cargar combinaciones válidas:", err);
    if (conn) await conn.end();
    throw err;
  }
}

/*************************************************************
 * Función para verificar si (tagA, tagB) es válido
 *************************************************************/
function isValidPair(a, b, validClubClubPairs, validClubNationPairs) {
  console.log(`Validando par: ${a.type} (${a.name}) - ${b.type} (${b.name})`);

  if (a.type === "club" && b.type === "club") {
    const c1 = Math.min(a.id, b.id);
    const c2 = Math.max(a.id, b.id);
    return validClubClubPairs.has(`${c1}-${c2}`);
  }

  if (a.type === "club" && b.type === "nation") {
    return validClubNationPairs.has(`${a.id}-${b.id}`);
  }

  if (a.type === "nation" && b.type === "club") {
    return validClubNationPairs.has(`${b.id}-${a.id}`);
  }

  return false;
}

/*************************************************************
 * Función para filtrar los "tags" que sean válidos con un tag dado
 *************************************************************/
function findCompatibleTags(rowTag, allTags, validClubClubPairs, validClubNationPairs) {
  console.log(`Buscando tags compatibles con: ${rowTag.type} (${rowTag.name})`);
  return allTags.filter(t => {
    if (t.id === rowTag.id && t.type === rowTag.type) return false; // El mismo tag no es válido
    return isValidPair(rowTag, t, validClubClubPairs, validClubNationPairs);
  });
}

/*************************************************************
 * GET /generate-board (Greedy mejorado)
 *************************************************************/
app.get("/generate-board", async (req, res) => {
  console.log("Solicitud recibida en /generate-board");
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log("Conexión a la base de datos establecida.");

    // Obtener clubs y nacionalidades
    console.log("Obteniendo clubs y nacionalidades...");
    const [clubRows] = await conn.execute("SELECT id, name FROM clubs");
    const [nationRows] = await conn.execute("SELECT id, name FROM nationalities");

    // Unificar en allTags
    const allTags = [
      ...clubRows.map(c => ({ type: "club", id: c.id, name: c.name })),
      ...nationRows.map(n => ({ type: "nation", id: n.id, name: n.name }))
    ];
    console.log("Tags disponibles:", allTags.length);

    // Precalcular combinaciones válidas
    console.log("Precalculando combinaciones válidas...");
    const { validClubClubPairs, validClubNationPairs } = await loadValidPairs();

    /*******************************************************
     * Método Greedy con reintentos
     *******************************************************/
    const MAX_ATTEMPTS = 300;
    let foundBoard = null;

    function pickRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    console.log("Generando tablero...");
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      console.log(`Intento ${attempt + 1} de ${MAX_ATTEMPTS}`);

      // 1) Elegir 1er fila (tag) al azar
      const row1 = pickRandom(allTags);
      console.log(`Fila 1 seleccionada: ${row1.type} (${row1.name})`);

      // 2) Encontrar tags compatibles con row1 (para columnas)
      const possibleCols = findCompatibleTags(row1, allTags, validClubClubPairs, validClubNationPairs);
      console.log(`Columnas compatibles encontradas: ${possibleCols.length}`);

      if (possibleCols.length < 3) {
        console.log("No hay suficientes columnas compatibles. Reintentando...");
        continue;
      }

      // Elegir 3 columnas al azar
      const columns = [];
      for (let i = 0; i < 3; i++) {
        const col = pickRandom(possibleCols);
        columns.push(col);
        possibleCols.splice(possibleCols.indexOf(col), 1); // Evitar duplicados
      }
      console.log("Columnas seleccionadas:", columns.map(c => c.name));

      // 3) Elegir row2
      let row2 = null;
      for (let i = 0; i < 50; i++) {
        const candidate = pickRandom(allTags);
        if (candidate.id === row1.id && candidate.type === row1.type) continue;
        if (columns.every(col => isValidPair(candidate, col, validClubClubPairs, validClubNationPairs))) {
          row2 = candidate;
          break;
        }
      }
      if (!row2) {
        console.log("No se encontró una fila 2 válida. Reintentando...");
        continue;
      }
      console.log(`Fila 2 seleccionada: ${row2.type} (${row2.name})`);

      // 4) Elegir row3
      let row3 = null;
      for (let i = 0; i < 50; i++) {
        const candidate = pickRandom(allTags);
        if ((candidate.id === row1.id && candidate.type === row1.type) ||
            (candidate.id === row2.id && candidate.type === row2.type)) continue;
        if (columns.every(col => isValidPair(candidate, col, validClubClubPairs, validClubNationPairs))) {
          row3 = candidate;
          break;
        }
      }
      if (!row3) {
        console.log("No se encontró una fila 3 válida. Reintentando...");
        continue;
      }
      console.log(`Fila 3 seleccionada: ${row3.type} (${row3.name})`);

      // Si llegamos aquí, tenemos un tablero válido
      foundBoard = {
        rows: [row1, row2, row3],
        cols: columns
      };
      console.log("Tablero válido generado.");
      break;
    }

    if (!foundBoard) {
      console.error("No se pudo generar un tablero válido después de varios intentos.");
      return res.status(400).json({
        error: "No se pudo generar un tablero válido (greedy)."
      });
    }

    // Responder con type + name
    res.json({
      rows: foundBoard.rows.map(t => ({ type: t.type, name: t.name })),
      cols: foundBoard.cols.map(t => ({ type: t.type, name: t.name }))
    });

  } catch (err) {
    console.error("Error en /generate-board:", err);
    if (conn) await conn.end();
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/*******************************************************
 * POST /check-guess
 * Parecido a antes: generamos club–club, club–nation
 *******************************************************/
app.post("/check-guess", async (req, res) => {
  console.log("Solicitud recibida en /check-guess");
  const { guess } = req.body;
  if (!guess) {
    return res.status(400).json({ error: "Falta el nombre del jugador" });
  }
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log("Conexión a la base de datos establecida.");

    // Clubs donde jugó
    const [clubData] = await conn.execute(`
      SELECT c.id, c.name
      FROM players p
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      WHERE p.name = ?
    `, [guess]);

    // Nacionalidad
    const [nationData] = await conn.execute(`
      SELECT n.id, n.name
      FROM players p
      JOIN nationalities n ON n.id = p.nationality_id
      WHERE p.name = ?
      LIMIT 1
    `, [guess]);

    await conn.end();
    console.log("Conexión a la base de datos cerrada.");

    const validCombinations = [];

    // (A) club–club
    for (let i = 0; i < clubData.length; i++) {
      for (let j = i + 1; j < clubData.length; j++) {
        const c1 = clubData[i].name;
        const c2 = clubData[j].name;
        // Añadimos ambas direcciones
        validCombinations.push(`${c1}|${c2}`);
        validCombinations.push(`${c2}|${c1}`);
      }
    }

    // (B) club–nation
    if (nationData.length > 0) {
      const natName = nationData[0].name;
      for (const c of clubData) {
        validCombinations.push(`${c.name}|${natName}`);
        validCombinations.push(`${natName}|${c.name}`);
      }
    }

    console.log("Combinaciones válidas encontradas:", validCombinations);
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

/*******************************************************
 * GET /search-players?query=...
 * Para autocompletado
 *******************************************************/
app.get("/search-players", async (req, res) => {
  console.log("Solicitud recibida en /search-players");
  const query = req.query.query;
  if (!query) {
    return res.json([]);
  }
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log("Conexión a la base de datos establecida.");

    const [rows] = await conn.execute(
      "SELECT name FROM players WHERE name LIKE ? LIMIT 10",
      [`%${query}%`]
    );

    await conn.end();
    console.log("Conexión a la base de datos cerrada.");
    res.json(rows);
  } catch (err) {
    console.error("Error en /search-players:", err);
    if (conn) await conn.end();
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

// Iniciar servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor (greedy mejorado) escuchando en http://localhost:${PORT}`);
});