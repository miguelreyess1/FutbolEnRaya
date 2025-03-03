const API_URL = "http://localhost:3002";

// Variables de estado
let currentPlayer = 1;
const playerNames = ["Jugador 1", "Jugador 2"];
let selectedCell = null;
let selectedMode = 'todos';

// Elementos DOM
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const turnoDiv = document.getElementById("turno");
const btnGenerate = document.getElementById("btnGenerate");
const btnGuess = document.getElementById("btnGuess");
const guessInput = document.getElementById("guessInput");
const suggestionsDiv = document.getElementById("suggestions");
const buscadorDiv = document.getElementById("buscador");
const tableroDiv = document.getElementById("tablero");

// Función para iniciar el juego
function startGame(mode) {
  selectedMode = mode;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateTurnDisplay();
}

// Actualizar display de turno
function updateTurnDisplay() {
  turnoDiv.textContent = `Turno de: ${playerNames[currentPlayer - 1]}`;
}

// Event listeners
btnGenerate.addEventListener("click", generateBoard);
btnGuess.addEventListener("click", doGuess);
guessInput.addEventListener("input", onGuessInput);

// Generar tablero
async function generateBoard() {
  try {
    const resp = await fetch(`${API_URL}/generate-board?mode=${selectedMode}`);
    if (!resp.ok) {
      const error = await resp.json();
      alert(error.error || "Error generando tablero");
      return;
    }

    const data = await resp.json();
    renderBoard(data);
  } catch (err) {
    alert("Error de conexión con el servidor");
  }
}

// Renderizar tablero
function renderBoard(data) {
  tableroDiv.innerHTML = '';
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  // Cabeceras
  const headerRow = document.createElement("tr");
  headerRow.appendChild(createHeaderCell(""));
  data.cols.forEach(n => headerRow.appendChild(createHeaderCell(n.name)));
  tbody.appendChild(headerRow);

  // Filas
  data.rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.appendChild(createHeaderCell(row.name));

    data.cols.forEach(col => {
      const td = document.createElement("td");
      td.dataset.club = row.name;
      td.dataset.nationality = col.name;
      td.classList.add("empty-cell");

      td.addEventListener("click", () => {
        if (!td.classList.contains("filled")) {
          selectedCell = td;
          buscadorDiv.style.display = "block";
          guessInput.value = "";
          guessInput.focus();
        }
      });

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableroDiv.appendChild(table);
  buscadorDiv.style.display = "none";
}

// Autocompletado
async function onGuessInput() {
  const query = guessInput.value.trim();
  suggestionsDiv.innerHTML = "";

  if (query.length < 2) return;

  try {
    const resp = await fetch(`${API_URL}/search-players?query=${encodeURIComponent(query)}`);
    const data = await resp.json();
    
    data.forEach(player => {
      const div = document.createElement("div");
      div.textContent = player.name;
      div.onclick = () => {
        guessInput.value = player.name;
        suggestionsDiv.innerHTML = "";
      };
      suggestionsDiv.appendChild(div);
    });
  } catch (err) {
    console.error("Error en búsqueda:", err);
  }
}

// Verificar jugada
async function doGuess() {
  if (!selectedCell || !guessInput.value.trim()) return;

  try {
    const resp = await fetch(`${API_URL}/check-guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess: guessInput.value.trim() })
    });
    
    const data = await resp.json();
    processGuessResult(data);
  } catch (err) {
    alert("Error verificando jugada");
  }
}

// Procesar resultado
function processGuessResult(data) {
  const combination = `${selectedCell.dataset.club}|${selectedCell.dataset.nationality}`;
  
  if (data.validCombinations.includes(combination)) {
    selectedCell.textContent = guessInput.value.trim();
    selectedCell.classList.add("filled");
    selectedCell.style.backgroundColor = "#c8e6c9";
    alert(`¡Acierto de ${playerNames[currentPlayer - 1]}!`);
  } else {
    alert(`Fallo de ${playerNames[currentPlayer - 1]}`);
  }

  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateTurnDisplay();
  resetGuessInterface();
}

function resetGuessInterface() {
  buscadorDiv.style.display = "none";
  selectedCell = null;
  guessInput.value = "";
  suggestionsDiv.innerHTML = "";
}

function createHeaderCell(content) {
  const th = document.createElement("th");
  th.textContent = content;
  return th;
}