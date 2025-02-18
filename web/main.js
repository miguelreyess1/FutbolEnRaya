const API_URL = "http://localhost:3000"; // Ajusta si usas otro puerto

// Variable para saber qué celda está "activa" en este momento
let selectedCell = null;

document.getElementById("btnGenerate").addEventListener("click", generateBoard);

// Botón "OK" del buscador
document.getElementById("btnGuess").addEventListener("click", doGuess);

async function generateBoard() {
  // 1) Pedir datos al backend
  const resp = await fetch(`${API_URL}/generate-board`);
  const data = await resp.json();
  const { clubs, nationalities } = data;

  // 2) Crear tabla
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  // Fila de encabezados (nacionalidades)
  const headerRow = document.createElement("tr");
  // Celda vacía
  const emptyTh = document.createElement("th");
  emptyTh.textContent = "";
  headerRow.appendChild(emptyTh);

  // Cabeceras de columna
  nationalities.forEach(n => {
    const th = document.createElement("th");
    th.textContent = n;
    headerRow.appendChild(th);
  });
  tbody.appendChild(headerRow);

  // Filas de clubs
  clubs.forEach(club => {
    const row = document.createElement("tr");

    // Celda de encabezado (club)
    const clubTh = document.createElement("th");
    clubTh.textContent = club;
    row.appendChild(clubTh);

    // Celdas jugables
    nationalities.forEach(nat => {
      const cell = document.createElement("td");
      cell.textContent = "Click here";
      // Guardamos la info en data-attributes
      cell.dataset.club = club;
      cell.dataset.nationality = nat;

      // Al hacer clic en la celda => seleccionamos esa celda
      cell.addEventListener("click", () => {
        selectedCell = cell; // guardamos la referencia
        // Mostramos el buscador
        document.getElementById("buscador").style.display = "block";
        // Limpiamos el input
        document.getElementById("guessInput").value = "";
        // Enfocamos el input para que el usuario empiece a escribir
        document.getElementById("guessInput").focus();
      });

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  // Insertar la tabla en #tablero
  const tableroDiv = document.getElementById("tablero");
  tableroDiv.innerHTML = ""; // Limpia anterior
  tableroDiv.appendChild(table);

  // Ocultamos el buscador hasta que se clique en una celda
  document.getElementById("buscador").style.display = "none";
}

// Función que se llama al pulsar "OK" en el buscador
async function doGuess() {
  if (!selectedCell) {
    // No hay ninguna celda seleccionada
    return;
  }

  const guessInput = document.getElementById("guessInput");
  const guess = guessInput.value.trim();
  if (!guess) return; // si está vacío, no hacemos nada

  // Tomamos los data-attributes de la celda
  const club = selectedCell.dataset.club;
  const nationality = selectedCell.dataset.nationality;

  // Petición POST /check-guess
  const resp = await fetch(`${API_URL}/check-guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guess, club, nationality })
  });
  const data = await resp.json();

  // Si acierta => ponemos el nombre en la celda
  if (data.success) {
    selectedCell.textContent = guess;
    // (Opcional) Deshabilitar la celda para que no se vuelva a pulsar
    selectedCell.style.cursor = "default";
    selectedCell.removeEventListener("click", () => {});
  } else {
    // Si no acierta, no hacemos nada, o podrías poner un pequeño mensaje
    console.log("No cumple requisitos");
  }

  // Ocultamos el buscador y reseteamos la variable
  document.getElementById("buscador").style.display = "none";
  selectedCell = null;
}
