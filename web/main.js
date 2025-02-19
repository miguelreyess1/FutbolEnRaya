// main.js
const API_URL = "http://localhost:3000";
let selectedCell = null;

// Elementos del DOM
const btnGenerate = document.getElementById("btnGenerate");
const btnGuess = document.getElementById("btnGuess");
const guessInput = document.getElementById("guessInput");
const suggestionsDiv = document.getElementById("suggestions");
const buscadorDiv = document.getElementById("buscador");
const tableroDiv = document.getElementById("tablero");

// Listeners
btnGenerate.addEventListener("click", generateBoard);
btnGuess.addEventListener("click", doGuess);
guessInput.addEventListener("input", onGuessInput);

async function generateBoard() {
  try {
    const resp = await fetch(`${API_URL}/generate-board`);
    
    if (!resp.ok) {
      const error = await resp.json();
      alert(error.error || "Error generando tablero");
      return;
    }

    const data = await resp.json();
    const { clubs, nationalities } = data;

    // Limpiar tablero anterior
    tableroDiv.innerHTML = "";

    // Crear elementos de la tabla
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    // Cabeceras nacionalidades
    const headerRow = document.createElement("tr");
    headerRow.appendChild(createHeaderCell(""));
    nationalities.forEach(nat => headerRow.appendChild(createHeaderCell(nat)));
    tbody.appendChild(headerRow);

    // Filas de clubs
    clubs.forEach(club => {
      const row = document.createElement("tr");
      row.appendChild(createHeaderCell(club));

      nationalities.forEach(nat => {
        const cell = document.createElement("td");
        cell.dataset.club = club;
        cell.dataset.nationality = nat;
        
        // Celda vacía con placeholder mediante CSS
        cell.classList.add("empty-cell");
        
        cell.addEventListener("click", () => {
          if (!cell.classList.contains("filled")) {
            selectedCell = cell;
            buscadorDiv.style.display = "block";
            guessInput.value = "";
            guessInput.focus();
          }
        });
        
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableroDiv.appendChild(table);
    buscadorDiv.style.display = "none";
  } catch (err) {
    alert("Error de conexión con el servidor");
  }
}

async function onGuessInput() {
  const query = guessInput.value.trim();
  suggestionsDiv.innerHTML = "";

  if (query.length < 2) return;

  try {
    const resp = await fetch(`${API_URL}/search-players?query=${encodeURIComponent(query)}`);
    const data = await resp.json();

    data.forEach(player => {
      const item = document.createElement("div");
      item.textContent = player.name;
      item.addEventListener("click", () => {
        guessInput.value = player.name;
        suggestionsDiv.innerHTML = "";
      });
      suggestionsDiv.appendChild(item);
    });
  } catch (error) {
    console.error("Error buscando jugadores:", error);
  }
}

async function doGuess() {
  if (!selectedCell || !guessInput.value.trim()) return;

  try {
    const resp = await fetch(`${API_URL}/check-guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess: guessInput.value.trim() })
    });
    
    const data = await resp.json();

    if (data.validCombinations.length > 0) {
      // Actualizar todas las celdas válidas
      data.validCombinations.forEach(combination => {
        const [club, nationality] = combination.split('|');
        const cells = document.querySelectorAll(
          `td[data-club="${club}"][data-nationality="${nationality}"]`
        );

        cells.forEach(cell => {
          if (!cell.classList.contains("filled")) {
            cell.innerHTML = guessInput.value.trim();
            cell.classList.add("filled");
            cell.style.backgroundColor = "#c8e6c9";
          }
        });
      });
    } else {
      alert("Jugador no válido para ninguna combinación");
    }

    // Resetear interfaz
    buscadorDiv.style.display = "none";
    selectedCell = null;
    guessInput.value = "";
    suggestionsDiv.innerHTML = "";
  } catch (err) {
    console.error("Error en doGuess:", err);
  }
}

// Funciones auxiliares
function createHeaderCell(content) {
  const th = document.createElement("th");
  th.textContent = content;
  return th;
}