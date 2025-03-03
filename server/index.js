// index.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");

// 1. Configuración inicial de Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../web")));

// 2. Configuración de la base de datos
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "futbolenraya"
};

// 3. Cache para combinaciones válidas
const validPairsCache = {};

// 4. Función para cargar combinaciones válidas
async function loadValidPairs(mode) {
  const conn = await mysql.createConnection(dbConfig);
  
  try {
    // Consulta Club-Club
    const [clubClubRows] = await conn.execute(`
      SELECT LEAST(c1.id, c2.id) AS club1, GREATEST(c1.id, c2.id) AS club2
      FROM players p
      JOIN player_clubs pc1 ON pc1.player_id = p.id
      JOIN player_clubs pc2 ON pc2.player_id = p.id
      JOIN clubs c1 ON c1.id = pc1.club_id
      JOIN clubs c2 ON c2.id = pc2.club_id
      ${mode === 'espana' ? "WHERE c1.league = 'España' AND c2.league = 'España'" : ""}
      GROUP BY club1, club2
    `);

    // Consulta Club-Nación
    const [clubNationRows] = await conn.execute(`
      SELECT c.id AS club, n.id AS nation
      FROM players p
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      JOIN nationalities n ON n.id = p.nationality_id
      ${mode === 'espana' ? "WHERE c.league = 'España'" : ""}
      GROUP BY c.id, n.id
    `);

    return {
      clubClub: new Set(clubClubRows.map(r => `${r.club1}-${r.club2}`)),
      clubNation: new Set(clubNationRows.map(r => `${r.club}-${r.nation}`))
    };
  } finally {
    await conn.end();
  }
}

// Helpers para manejar elementos únicos
function getUniqueRandomElements(allTags, count, exclude = new Set()) {
  const available = allTags.filter(tag => 
    ![...exclude].some(used => 
      used.id === tag.id && used.type === tag.type
    )
  );

  if (available.length < count) return null;

  const selected = [];
  while (selected.length < count) {
    const candidate = available[Math.floor(Math.random() * available.length)];
    if (!selected.some(s => s.id === candidate.id)) {
      selected.push(candidate);
      exclude.add(candidate); // Registrar como usado
    }
  }
  return selected;
}

// Función de validación mejorada
function isValidPair(a, b, clubClub, clubNation) {
  // Evitar duplicados exactos
  if (a.id === b.id && a.type === b.type) return false;
  if (a.type === "nation" && b.type === "nation") return false;
  
  // Evitar mismos nombres en diferentes tipos
  if (a.name === b.name) return false;

  // Validar club-club
  if (a.type === "club" && b.type === "club") {
    const ids = [a.id, b.id].sort((x, y) => x - y);
    return clubClub.has(`${ids[0]}-${ids[1]}`);
  }

  // Validar club-nación
  if (a.type === "club" && b.type === "nation") {
    return clubNation.has(`${a.id}-${b.id}`);
  }

  // Validar nación-club (inverso)
  if (a.type === "nation" && b.type === "club") {
    return clubNation.has(`${b.id}-${a.id}`);
  }

  return false;
}

async function loadValidPairs(mode) {
  const conn = await mysql.createConnection(dbConfig);
  
  try {
    // 1. Combinaciones Club-Club optimizadas
    const [clubClubRows] = await conn.execute(`
      SELECT 
        LEAST(c1.id, c2.id) AS club1_id,
        GREATEST(c1.id, c2.id) AS club2_id
      FROM players p
      INNER JOIN player_clubs pc1 ON pc1.player_id = p.id
      INNER JOIN player_clubs pc2 ON pc2.player_id = p.id
        AND pc1.club_id < pc2.club_id
      INNER JOIN clubs c1 ON c1.id = pc1.club_id
      INNER JOIN clubs c2 ON c2.id = pc2.club_id
      ${mode === 'espana' 
        ? "WHERE c1.league = 'España' AND c2.league = 'España'" 
        : ""}
      GROUP BY club1_id, club2_id
      HAVING COUNT(DISTINCT p.id) >= 1
    `);

    // 2. Combinaciones Club-Nación optimizadas
    const [clubNationRows] = await conn.execute(`
      SELECT 
        c.id AS club_id,
        n.id AS nation_id,
        COUNT(DISTINCT p.id) AS player_count
      FROM players p
      INNER JOIN player_clubs pc ON pc.player_id = p.id
      INNER JOIN clubs c ON c.id = pc.club_id
      INNER JOIN nationalities n ON n.id = p.nationality_id
      ${mode === 'espana' ? "WHERE c.league = 'España'" : ""}
      GROUP BY c.id, n.id
      HAVING player_count >= 1
    `);

    // 3. Procesar resultados
    return {
      clubClub: new Set(
        clubClubRows.map(r => `${r.club1_id}-${r.club2_id}`)
      ),
      clubNation: new Set(
        clubNationRows.map(r => `${r.club_id}-${r.nation_id}`)
      )
    };
  } finally {
    await conn.end();
  }
}

// 5. Endpoint para generar el tablero
app.get("/generate-board", async (req, res) => {
  const mode = req.query.mode || 'todos';
  const MAX_ATTEMPTS = 100;
  const BOARD_SIZE = 3;
  
  try {
    const conn = await mysql.createConnection(dbConfig);
    
    // Obtener clubes según el modo
    const [clubs] = await conn.execute(
      mode === 'espana' 
        ? "SELECT id, name, league FROM clubs WHERE league = 'España'"
        : "SELECT id, name, league FROM clubs"
    );
    
    // Obtener todas las nacionalidades
    const [nations] = await conn.execute("SELECT id, name FROM nationalities");
    await conn.end();

    // Cargar combinaciones válidas
    if (!validPairsCache[mode]) {
      validPairsCache[mode] = await loadValidPairs(mode);
    }
    const { clubClub, clubNation } = validPairsCache[mode];

    // Preparar lista de tags
    const allTags = [
      ...clubs.map(c => ({ type: "club", id: c.id, name: c.name })),
      ...nations.map(n => ({ type: "nation", id: n.id, name: n.name }))
    ];

    // Función para encontrar elementos únicos
    function getUniqueElements(pool, count, used = new Set()) {
      // Convertir a string para comparación efectiva
      const isUsed = (item) => 
        [...used].some(u => 
          `${u.type}-${u.id}` === `${item.type}-${item.id}`
        );
    
      const available = pool.filter(item => !isUsed(item));
      
      if (available.length < count) return null;
    
      // Mejor shuffle con Fisher-Yates
      const shuffled = [...available];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    
      return shuffled.slice(0, count);
    }

    // Algoritmo mejorado de generación
    let board = null;
    let attempt = 0;

    while (!board && attempt < MAX_ATTEMPTS) {
      attempt++;
      const usedTags = new Set();
      
      try {
        // Reiniciar todo en cada intento
        const cols = getUniqueElements(allTags, BOARD_SIZE);
        if (!cols || cols.length < BOARD_SIZE) continue;
    
        // Nueva verificación de compatibilidad
        const validRows = allTags.filter(row => 
          !cols.some(c => c.id === row.id && c.type === row.type) &&
          cols.every(col => isValidPair(row, col, clubClub, clubNation))
        );
    
        if (validRows.length < BOARD_SIZE) continue;
    
        // Seleccionar filas únicas de las válidas
        const rows = getUniqueElements(validRows, BOARD_SIZE, new Set(cols));
        
        if (rows && rows.length === BOARD_SIZE) {
          board = {
            rows: rows.map(r => ({ type: r.type, name: r.name })),
            cols: cols.map(c => ({ type: c.type, name: c.name }))
          };
        }
      } catch (error) {
        console.log(`Intento ${attempt} fallido: ${error.message}`);
      }
    }
    if (!board) {
      return res.status(400).json({ 
        error: "No se pudo generar un tablero válido después de múltiples intentos",
        suggestion: "Intenta con otro modo de juego o añade más datos a la base"
      });
    }

    res.json(board);

  } catch (err) {
    console.error("Error en /generate-board:", err);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: err.message
    });
  }
});

// 6. Endpoint para verificar jugadas
app.post("/check-guess", async (req, res) => {
  const { guess } = req.body;
  
  if (!guess) {
    return res.status(400).json({ error: "Falta el nombre del jugador" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    
    // Obtener clubes del jugador
    const [clubs] = await conn.execute(`
      SELECT c.id, c.name 
      FROM players p
      JOIN player_clubs pc ON pc.player_id = p.id
      JOIN clubs c ON c.id = pc.club_id
      WHERE p.name = ?
    `, [guess]);

    // Obtener nacionalidad
    const [nations] = await conn.execute(`
      SELECT n.id, n.name 
      FROM players p
      JOIN nationalities n ON n.id = p.nationality_id
      WHERE p.name = ?
      LIMIT 1
    `, [guess]);

    // Generar combinaciones válidas
    const validCombinations = [];
    
    // Combinaciones Club-Club
    for (let i = 0; i < clubs.length; i++) {
      for (let j = i + 1; j < clubs.length; j++) {
        validCombinations.push(
          `${clubs[i].name}|${clubs[j].name}`,
          `${clubs[j].name}|${clubs[i].name}`
        );
      }
    }

    // Combinaciones Club-Nación
    if (nations.length > 0) {
      const nation = nations[0].name;
      clubs.forEach(club => {
        validCombinations.push(
          `${club.name}|${nation}`,
          `${nation}|${club.name}`
        );
      });
    }

    res.json({ 
      validCombinations,
      isValid: validCombinations.length > 0
    });

  } catch (err) {
    console.error("Error en /check-guess:", err);
    res.status(500).json({ error: "Error en la verificación" });
  } finally {
    if (conn) await conn.end();
  }
});

// 7. Endpoint para búsqueda de jugadores
app.get("/search-players", async (req, res) => {
  const query = req.query.query;
  
  if (!query || query.length < 2) {
    return res.json([]);
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    
    const [players] = await conn.execute(
      "SELECT name FROM players WHERE name LIKE ? LIMIT 10",
      [`%${query}%`]
    );
    
    res.json(players);
  } catch (err) {
    console.error("Error en /search-players:", err);
    res.status(500).json({ error: "Error en la búsqueda" });
  } finally {
    if (conn) await conn.end();
  }
});

// 8. Iniciar servidor
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});