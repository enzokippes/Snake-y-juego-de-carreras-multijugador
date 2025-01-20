"use strict"

var music = document.getElementById("music")
var canvas = document.getElementById("tela")
canvas.addEventListener("click", onClick)
var ctx = canvas.getContext("2d")

// Variables para multijugador
let isFirstPlayer = false;

//Auto 1
const car = {
    width: 30,
    height: 15,
    xPosition: 500,
    yPosition: 100,
    velocity: 0,
    displayVelocity: 0,
    forceFoward: 0,
    forceBackward: 0,
    facingAngle: 0,
    isOnRoad: true,
    isReversing: false,
    color: "rgb(204, 204, 204)", // Gris
    lapCount: 0
}
//Auto 2
const car2 = {
    width: 30,
    height: 15,
    xPosition: 550,
    yPosition: 100,
    velocity: 0,
    displayVelocity: 0,
    forceFoward: 0,
    forceBackward: 0,
    facingAngle: 0,
    isOnRoad: true,
    isReversing: false,
    color: "rgb(255, 0, 0)", // Rojo
    lapCount: 0
}

// Funcion para determinar qué jugador es
async function determinePlayer() {
    try {
        const response = await fetch('/checkPlayer');
        const data = await response.json();
        isFirstPlayer = data.isFirstPlayer;
        console.log(isFirstPlayer ? "Controlando coche gris" : "Controlando coche rojo");
    } catch (error) {
        console.error('Error al determinar jugador:', error);
    }
}

// Funcion para enviar la posición del coche
async function sendCarPosition() {
    const activeCar = isFirstPlayer ? car : car2;
    try {
        const response = await fetch('/updatePosition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                isFirstPlayer: isFirstPlayer,
                position: {
                    x: activeCar.xPosition,
                    y: activeCar.yPosition,
                    angle: activeCar.facingAngle,
                    velocity: activeCar.velocity,
                    lapCount: activeCar.lapCount
                }
            })
        });
    } catch (error) {
        console.error('Error al enviar posición:', error);
    }
}

// Función para obtener las posiciones del otro jugador
async function getOtherPlayerPosition() {
    try {
        const response = await fetch('/getPositions');
        const data = await response.json();
        
        // Actualizar la posición del otro coche
        if (isFirstPlayer && data.car2Position) {
            car2.xPosition = data.car2Position.x;
            car2.yPosition = data.car2Position.y;
            car2.facingAngle = data.car2Position.angle;
            car2.velocity = data.car2Position.velocity;
            car2.lapCount = data.car2Position.lapCount;
        } else if (!isFirstPlayer && data.car1Position) {
            car.xPosition = data.car1Position.x;
            car.yPosition = data.car1Position.y;
            car.facingAngle = data.car1Position.angle;
            car.velocity = data.car1Position.velocity;
            car.lapCount = data.car1Position.lapCount;
        }
    } catch (error) {
        console.error('Error al obtener posiciones:', error);
    }
}

//Fisica del game
const baseForce = 0.06
const baseTurningSpeed = 4
const baseRoadAttrition = 0.99
const baseDirtAttrition = 0.94

//Limites de velocidad
const maxSpeedFront = 7.5
const maxSpeedBack = -3
const maxTurnSpeed = 3


//Variables y estados del juego
var keyArray = []
var roadArray = []
var barrierArray = []
var musicOn = true;
var gameOver = false;

// Inicializar el juego determinando el jugador
determinePlayer().then(() => {
    requestAnimationFrame(draw);
});

// Una 
function draw() {
    if (!gameOver) {
        musicControl();
        processKeys();
        
        // Solo procesar colisiones y movimiento para el coche que controlamos
        const activeCar = isFirstPlayer ? car : car2;
        checkCollision(activeCar);
        moveCar(activeCar);

        // Enviar y recibir datos
        sendCarPosition();
        getOtherPlayerPosition();

        ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);
        ctx.clientWidth = 2;

        drawRoads();
        drawBarriers();

        // Dibujar ambos coches
        drawEachCar(car);
        drawEachCar(car2);

        ctx.font = "30px Arial";
        ctx.fillText(activeCar.displayVelocity + " km/h", 30, 650);
        ctx.fillText("Vueltas: " + activeCar.lapCount, 30, 700);

        if (activeCar.lapCount >= 2) {
            endGame();
        }

        requestAnimationFrame(draw);
    } else {
        drawGameOver();
    }
}

// Funcion que maneja DONDE va el auto (maneja posicion y rotacion)
function drawEachCar(carObj) {
    var xView = carObj.xPosition + carObj.width / 2
    var yView = carObj.yPosition + carObj.height / 2
    ctx.save()
    ctx.translate(xView, yView)
    ctx.rotate(carObj.facingAngle * Math.PI / 180)
    drawCar(carObj)
    ctx.restore()
}

// Funcion que maneja COMO va el auto (maneja la forma y color)
function drawCar(carObj) {
    //Cuerpo principal
    ctx.fillStyle = carObj.color
    ctx.fillRect(-carObj.width / 2, -carObj.height / 2, carObj.width, carObj.height)

    // Techo
    ctx.fillStyle = "rgb(140, 140, 140)"
    ctx.fillRect(carObj.width / 4.5, -carObj.height / 2.6, carObj.height / 1.8, carObj.height / 1.3)

    // Vidrios
    ctx.fillStyle = "rgb(0, 0, 0)"
    ctx.fillRect(-carObj.width / 18, -carObj.height / 3.5, carObj.height / 1.8, carObj.height / 1.7)
}

function checkCollision(carObj) {
    carObj.isOnRoad = false;

    // Verificar si el auto está en la carretera
    for (let road of roadArray) {
        if (RectsColliding(carObj, road.x, road.y, road.w, road.h)) {
            carObj.isOnRoad = true;
            break;
        }
    }

    // Verificar colisiones con las barreras
    for (let barrier of barrierArray) {
        if (RectsColliding(carObj, barrier.x, barrier.y, barrier.w, barrier.h)) {

            carObj.velocity *= -0.2; // Rebote y velocidad
            
            // Desplazamiento más pronunciado al chocar
            let backwardDistance = 20; // Distancia de retroceso
            carObj.xPosition -= Math.cos(carObj.facingAngle * Math.PI / 180) * backwardDistance;
            carObj.yPosition -= Math.sin(carObj.facingAngle * Math.PI / 180) * backwardDistance;
            
            carObj.forceFoward *= 0.1;
            carObj.forceBackward *= 0.1;
            
            // "Aturdimiento" al chocar
            setTimeout(() => {
                carObj.forceFoward = 0;
                carObj.forceBackward = 0;
            }, 500); // tiempo de "aturdimiento"

            return; // Salir para evitar múltiples detecciones
        }
    }
}

// Funcion que verifica si el auto choca o sigue en carretera
function RectsColliding(carObj, x, y, w, h) {
    return !(carObj.xPosition > x + w || carObj.xPosition + carObj.width < x || carObj.yPosition > y + h || carObj.yPosition + carObj.height < y);
}

//Funcion que maneja la fisica del auto(velocidad, posicion, etc)
function moveCar(carObj) {
    if (carObj.velocity != 0) {
        carObj.forceFoward *= carObj.isOnRoad ? baseRoadAttrition : baseDirtAttrition
        carObj.forceBackward *= carObj.isOnRoad ? baseRoadAttrition : baseDirtAttrition
    }
    carObj.velocity = (carObj.forceFoward - carObj.forceBackward).toFixed(3)
    carObj.xPosition += carObj.velocity * Math.cos(carObj.facingAngle * Math.PI / 180)
    carObj.yPosition += carObj.velocity * Math.sin(carObj.facingAngle * Math.PI / 180)
    carObj.displayVelocity = Math.abs(Math.round(carObj.velocity * 15))
}

//Funcion que maneja los inputs del jugador
function processKeys() {
    const activeCar = isFirstPlayer ? car : car2;
    
    if (keyArray["ArrowRight"]) {
        activeCar.facingAngle += baseTurningSpeed;
    }
    if (keyArray["ArrowLeft"]) {
        activeCar.facingAngle -= baseTurningSpeed;
    }
    if (keyArray["ArrowUp"]) {
        activeCar.forceFoward += baseForce;
    }
    if (keyArray["ArrowDown"]) {
        activeCar.forceBackward += baseForce;
    }
}

// Funcion que dibuja las carreteras
function drawRoads() {
    if (roadArray.length < 11) {
        roadArray.push({ x: 200, y: 80, w: 600, h: 100 });
        roadArray.push({ x: 200, y: 380, w: 600, h: 100 });
        roadArray.push({ x: 130, y: 150, w: 100, h: 250 });
        roadArray.push({ x: 770, y: 150, w: 100, h: 250 });
        roadArray.push({ x: 130, y: 80, w: 100, h: 100 });
        roadArray.push({ x: 770, y: 80, w: 100, h: 100 });
        roadArray.push({ x: 130, y: 380, w: 100, h: 100 });
        roadArray.push({ x: 770, y: 380, w: 100, h: 100 });
        roadArray.push({ x: 400, y: 90, w: 20, h: 50, isMeta: true });

        // Barreras alrededor de las esquinas superiores
        barrierArray.push({ x: 120, y: 70, w: 120, h: 10 });
        barrierArray.push({ x: 120, y: 70, w: 10, h: 120 }); 
        barrierArray.push({ x: 760, y: 70, w: 120, h: 10 }); 
        barrierArray.push({ x: 870, y: 70, w: 10, h: 120 }); 

        // Barreras alrededor de las esquinas inferiores
        barrierArray.push({ x: 120, y: 470, w: 120, h: 10 }); 
        barrierArray.push({ x: 120, y: 360, w: 10, h: 120 }); 
        barrierArray.push({ x: 760, y: 470, w: 120, h: 10 }); 
        barrierArray.push({ x: 870, y: 360, w: 10, h: 120 }); 
    }
    // Dibuja las secciones de carretera en gris oscuro
    ctx.fillStyle = "rgb(50, 50, 50)";
    roadArray.forEach(road => {
        ctx.fillRect(road.x, road.y, road.w, road.h);
    });

    // Dibuja las secciones de meta en blanco
    roadArray.forEach(road => {
        if (road.isMeta) {
            ctx.fillStyle = "white";
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(road.x, road.y + i * 25, road.w, 12);
            }
        }
    });
    // Colores blancos para las lineas de carretera 
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.lineWidth = 2;
    roadArray.forEach(road => {
        if (!road.isMeta) {
            ctx.strokeRect(road.x + 5, road.y + 5, road.w - 10, road.h - 10);
        }
    });
}

// Funcion que dibuja las barreras
function drawBarriers() {
    ctx.fillStyle = "rgb(255, 0, 0)"; // Rojo para las barreras
    barrierArray.forEach(barrier => {
        ctx.fillRect(barrier.x, barrier.y, barrier.w, barrier.h);
    });
}

// Funcion que verifica si el auto cruza la meta
function checkMetaCrossing(carObj) {
    for (let road of roadArray) {
        if (road.isMeta) {
            if (
                carObj.xPosition > road.x &&
                carObj.xPosition < road.x + road.w &&
                carObj.yPosition > road.y &&
                carObj.yPosition < road.y + road.h
            ) {
                carObj.lapCount++;
                console.log("¡Coche cruzó la meta! Vueltas: " + carObj.lapCount);
            }
        }
    }
}

// Funcion que termina el juego
function endGame() {
    gameOver = true;
}

// Funcion que dibuja el fin del juego
function drawGameOver() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "50px Arial";
    ctx.fillStyle = "white";

    let winner = car.lapCount >= 2 ? "Coche Gris" : "Coche Rojo";
    ctx.fillText("Carrera Terminada", 250, 300);
    ctx.fillText("Ganador: " + winner, 250, 400);
}

function musicControl() {
    if (!music.muted && musicOn) music.play()
}

function onClick() {
    music.muted = false
}

//Lineas que manejan los inputs del jugador
document.onkeydown = evt => keyArray[evt.key] = true
document.onkeyup = evt => keyArray[evt.key] = false;