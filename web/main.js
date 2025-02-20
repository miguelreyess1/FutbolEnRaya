// main.js
const API_URL = "http://localhost:3000";

// Variables de turno
let currentPlayer = 1;  // Empieza el jugador 1
const playerNames = ["Jugador 1", "Jugador 2"];

// Para saber en qué celda se hizo clic
let selectedCell = null;

// Referencias al DOM
const turnoDiv = document.getElementById("turno");
const btnGenerate = document.getElementById("btnGenerate");
const btnGuess = document.getElementById("btnGuess");
const guessInput = document.getElementById("guessInput");
const suggestionsDiv = document.getElementById("suggestions");
const buscadorDiv = document.getElementById("buscador");
const tableroDiv = document.getElementById("tablero");

// Función para mostrar en pantalla de quién es el turno
function updateTurnDisplay() {
  turnoDiv.textContent = `Turno de: ${playerNames[currentPlayer - 1]}`;
}

// Al cargar la página, actualizamos el turno
updateTurnDisplay();

// Listeners
btnGenerate.addEventListener("click", generateBoard);
btnGuess.addEventListener("click", doGuess);
guessInput.addEventListener("input", onGuessInput);

/**
 * Llama a /generate-board para obtener 3 clubs y 3 nacionalidades,
 * y construye el tablero 3x3.
 */
async function generateBoard() {
  try {
    const resp = await fetch(`${API_URL}/generate-board`);
    if (!resp.ok) {
      // Error devuelto por el servidor
      const error = await resp.json();
      alert(error.error || "Error generando tablero");
      return;
    }

    const data = await resp.json();
    const { clubs, nationalities } = data;

    // Limpiar tablero anterior
    tableroDiv.innerHTML = "";

    // Crear la tabla
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    // Fila de encabezados (nacionalidades)
    const headerRow = document.createElement("tr");
    // Celda vacía (esquina superior izquierda)
    headerRow.appendChild(createHeaderCell(""));
    // Encabezados de columna con las nacionalidades
    nationalities.forEach(n => {
      headerRow.appendChild(createHeaderCell(n));
    });
    tbody.appendChild(headerRow);

    // Filas (clubs)
    clubs.forEach(club => {
      const row = document.createElement("tr");
      // Primera celda de la fila: el nombre del club
      row.appendChild(createHeaderCell(club));

      // Celdas del 3x3
      nationalities.forEach(nat => {
        const cell = document.createElement("td");
        cell.dataset.club = club;
        cell.dataset.nationality = nat;
        // Clase para el placeholder "CHOOSE PLAYER"
        cell.classList.add("empty-cell");

        // Al hacer clic en la celda, abrimos el buscador
        cell.addEventListener("click", () => {
          // Solo si la celda no está ya rellenada
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

    // Ocultamos el buscador
    buscadorDiv.style.display = "none";
  } catch (err) {
    alert("Error de conexión con el servidor");
  }
}

/**
 * Se llama al teclear en guessInput: hace autocompletado llamando a /search-players
 */
async function onGuessInput() {
  const query = guessInput.value.trim();
  suggestionsDiv.innerHTML = "";

  // Si el usuario no ha escrito suficiente, no buscamos
  if (query.length < 2) return;

  try {
    const resp = await fetch(`${API_URL}/search-players?query=${encodeURIComponent(query)}`);
    const data = await resp.json();

    // Mostrar sugerencias
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

/**
 * Al pulsar "OK" en el buscador: validar la jugada con /check-guess
 */
async function doGuess() {
  if (!selectedCell || !guessInput.value.trim()) return;

  const guess = guessInput.value.trim();
  const club = selectedCell.dataset.club;
  const nationality = selectedCell.dataset.nationality;
  const selectedCombination = `${club}|${nationality}`;

  try {
    const resp = await fetch(`${API_URL}/check-guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess })
    });
    const data = await resp.json();

    // data.validCombinations es un array como ["Real Madrid|Spain", ...]
    if (data.validCombinations.includes(selectedCombination)) {
      // Acierto
      selectedCell.textContent = guess;
      selectedCell.classList.add("filled");
      selectedCell.style.backgroundColor = "#c8e6c9";
      alert(`¡Acierto de ${playerNames[currentPlayer - 1]}!`);
    } else {
      // Fallo
      alert(`Fallo de ${playerNames[currentPlayer - 1]}.`);
    }

    // Cambiar turno siempre (acierte o falle)
    currentPlayer = (currentPlayer === 1) ? 2 : 1;
    updateTurnDisplay();

    // Reset
    buscadorDiv.style.display = "none";
    selectedCell = null;
    guessInput.value = "";
    suggestionsDiv.innerHTML = "";
  } catch (err) {
    console.error("Error en doGuess:", err);
  }
}

/**
 * Crear celdas de encabezado (th) con texto
 */
function createHeaderCell(content) {
  const th = document.createElement("th");
  th.textContent = content;
  return th;
}
