const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Cargar imágenes para la cabeza de la serpiente en diferentes direcciones
const snakeHeadUp = new Image();
snakeHeadUp.src = "snake-head-up.webp"; 

const snakeHeadDown = new Image();
snakeHeadDown.src = "snake-head-down.webp"; 

const snakeHeadLeft = new Image();
snakeHeadLeft.src = "snake-head-left.webp"; 

const snakeHeadRight = new Image();
snakeHeadRight.src = "snake-head-right.webp";

let snake, direction, food, score, gameLoop, speed;
let gameActive = false;
const SERVER_URL = "https://tu-servidor.com/api/high-scores";
const highScores = JSON.parse(localStorage.getItem("highScores")) || [];

// Función para redirigir al inicio (index.html)
function goToHomePage() {
  window.location.href = "/index.html";
}


// Cargar puntuaciones desde el servidor
function loadScoresFromServer() {
  return fetch(SERVER_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Error al obtener puntuaciones del servidor");
      return response.json();
    })
    .then((serverScores) => {
      const combinedScores = [
        ...highScores,
        ...serverScores.filter(
          (serverScore) =>
            !highScores.some(
              (localScore) =>
                localScore.initials === serverScore.initials &&
                localScore.score === serverScore.score
            )
        ),
      ];
      const uniqueScores = combinedScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      localStorage.setItem("highScores", JSON.stringify(uniqueScores));
      return uniqueScores;
    })
    .catch((error) => {
      console.error("Error al cargar puntuaciones:", error);
      return highScores; 
    });
}

// Actualizar tabla de puntuaciones
function updateHighScores() {
  const highScoresTableBody = document.querySelector("#highScoresTable tbody");
  highScoresTableBody.innerHTML = "";
  highScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .forEach((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.initials}</td>
        <td>${entry.score}</td>
      `;
      highScoresTableBody.appendChild(row);
    });
}

// Enviar puntuaciones al servidor
function sendScoresToServer() {
  const top10Scores = highScores.sort((a, b) => b.score - a.score).slice(0, 10);
  fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scores: top10Scores }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Error al enviar puntuaciones");
      return response.json();
    })
    .then((data) => console.log("Puntuaciones enviadas:", data))
    .catch((error) => console.error("Error al enviar puntuaciones:", error));
}

// Guardar puntuación e inicializar el menú
function saveScoreAndReturn() {
  const initialsInput = document.getElementById("initials");
  const initials = initialsInput.value.toUpperCase().slice(0, 3) || "AAA";
  highScores.push({ initials, score });
  localStorage.setItem("highScores", JSON.stringify(highScores));
  initialsInput.value = "";
  updateHighScores();
  sendScoresToServer();
  showMenu();
}

// Mostrar el menú principal
function showMenu() {
  document.getElementById("menu").classList.add("active");
  document.getElementById("gameOverOverlay").classList.remove("active");
  canvas.style.display = "none";

  loadScoresFromServer().then((updatedScores) => {
    highScores.splice(0, highScores.length, ...updatedScores);
    updateHighScores();
  });
}

// Iniciar el juego con la dificultad seleccionada
function startGame(difficulty) {
  resetGame();
  speed = difficulty === "easy" ? 200 : difficulty === "medium" ? 150 : 100;
  gameActive = true;
  document.getElementById("menu").classList.remove("active");
  canvas.style.display = "block";
  gameLoop = setInterval(updateGame, speed);
}

function resetGame() {
  // Reiniciar posiciones y estados de los coches
  car.xPosition = 500;
  car.yPosition = 100;
  car.velocity = 0;
  car.forceFoward = 0;
  car.forceBackward = 0;
  car.facingAngle = 0;
  car.lapCount = 0;

  car2.xPosition = 550;
  car2.yPosition = 100;
  car2.velocity = 0;
  car2.forceFoward = 0;
  car2.forceBackward = 0;
  car2.facingAngle = 0;
  car2.lapCount = 0;

  gameOver = false;
  requestAnimationFrame(draw);
}

// Actualizar el estado del juego
function updateGame() {
  if (!gameActive) return;

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (
    head.x < 0 ||
    head.x >= canvas.width ||
    head.y < 0 ||
    head.y >= canvas.height ||
    snake.some((segment) => segment.x === head.x && segment.y === head.y)
  ) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    food = spawnFood();
  } else {
    snake.pop();
  }

  drawGame();
}

let foodPulse = 0;

function drawGame() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "red"; 
ctx.beginPath();
ctx.arc(food.x + 10, food.y + 10, 10, 0, Math.PI * 2);
ctx.fill();


  snake.forEach((segment, index) => {
    if (index === 0) {
      if (direction.y === -20) {
        ctx.drawImage(snakeHeadUp, segment.x, segment.y, 20, 20);
      } else if (direction.y === 20) {
        ctx.drawImage(snakeHeadDown, segment.x, segment.y, 20, 20);
      } else if (direction.x === -20) {
        ctx.drawImage(snakeHeadLeft, segment.x, segment.y, 20, 20);
      } else if (direction.x === 20) {
        ctx.drawImage(snakeHeadRight, segment.x, segment.y, 20, 20);
      }
    } else {
      // Cuerpo de la serpiente
      ctx.fillStyle = "limegreen";
      ctx.fillRect(segment.x, segment.y, 20, 20);
      ctx.strokeStyle = "darkgreen";
      ctx.strokeRect(segment.x, segment.y, 20, 20);
    }
  });

  // Actualizar puntuación
  const scoreElement = document.getElementById('score');
  scoreElement.textContent = `Puntuación: ${score}`;
}

// Generar comida
function spawnFood() {
  const x = Math.floor(Math.random() * (canvas.width / 20)) * 20;
  const y = Math.floor(Math.random() * (canvas.height / 20)) * 20;
  return { x, y };
}

// Fin del juego
function gameOver() {
  clearInterval(gameLoop);
  gameActive = false;
  document.getElementById("finalScore").innerText = score;
  document.getElementById("gameOverOverlay").classList.add("active");
}

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowUp":
    case "w": 
      if (direction.y === 0) direction = { x: 0, y: -20 };
      break;
    case "ArrowDown":
    case "s": 
      if (direction.y === 0) direction = { x: 0, y: 20 };
      break;
    case "ArrowLeft":
    case "a": 
      if (direction.x === 0) direction = { x: -20, y: 0 };
      break;
    case "ArrowRight":
    case "d": 
      if (direction.x === 0) direction = { x: 20, y: 0 };
      break;
  }
});
