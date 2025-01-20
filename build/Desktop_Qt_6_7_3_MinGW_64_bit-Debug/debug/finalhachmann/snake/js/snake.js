

/**
* @module Snake
* @class SNAKE
*/
if (!window.SNAKE) {
    window.SNAKE = {};
} 

/**
* @method addEventListener
* @param {Object} obj The object to add an event listener to.
* @param {String} event The event to listen for.
* @param {Function} funct The function to execute when the event is triggered.
* @param {Boolean} evtCapturing True to do event capturing, false to do event bubbling.
*/
SNAKE.addEventListener = (function() {
    if (window.addEventListener) {
        return function(obj, event, funct, evtCapturing) {
            obj.addEventListener(event, funct, evtCapturing);
        };
    } else if (window.attachEvent) {
        return function(obj, event, funct) {
            obj.attachEvent("on" + event, funct);
        };
    }
})();

/**
* @method removeEventListener
* @param {Object} obj The object to remove an event listener from.
* @param {String} event The event that was listened for.
* @param {Function} funct The function that was executed when the event is triggered.
* @param {Boolean} evtCapturing True if event capturing was done, false otherwise.
*/

SNAKE.removeEventListener = (function() {
    if (window.removeEventListener) {
        return function(obj, event, funct, evtCapturing) {
            obj.removeEventListener(event, funct, evtCapturing);
        };
    } else if (window.detachEvent) {
        return function(obj, event, funct) {
            obj.detachEvent("on" + event, funct);
        };
    }
})();

/**
* This class manages the snake which will reside inside of a SNAKE.Board object.
* @class Snake
* @constructor
* @namespace SNAKE
* @param {Object} config The configuration object for the class. Contains playingBoard (the SNAKE.Board that this snake resides in), startRow and startCol.
*/
SNAKE.Snake = SNAKE.Snake || (function() {

    // -------------------------------------------------------------------------
    // Private static variables and methods
    // -------------------------------------------------------------------------

    let instanceNumber = 0;
    const blockPool = [];

    const SnakeBlock = function() {
        this.elm = null;
        this.elmStyle = null;
        this.row = -1;
        this.col = -1;
        this.xPos = -1000;
        this.yPos = -1000;
        this.next = null;
        this.prev = null;
    };

    // this function is adapted from the example at http://greengeckodesign.com/blog/2007/07/get-highest-z-index-in-javascript.html
    function getNextHighestZIndex(myObj) {
        let highestIndex = 0,
            currentIndex = 0,
            ii;
        for (ii in myObj) {
            if (myObj[ii].elm.currentStyle){
                currentIndex = parseFloat(myObj[ii].elm.style["z-index"],10);
            }else if(window.getComputedStyle) {
                currentIndex = parseFloat(document.defaultView.getComputedStyle(myObj[ii].elm,null).getPropertyValue("z-index"),10);
            }
            if(!isNaN(currentIndex) && currentIndex > highestIndex){
                highestIndex = currentIndex;
            }
        }
        return(highestIndex+1);
    }

    // -------------------------------------------------------------------------
    // Contructor + public and private definitions
    // -------------------------------------------------------------------------

    /*
        config options:
            playingBoard - the SnakeBoard that this snake belongs too.
            startRow - The row the snake should start on.
            startCol - The column the snake should start on.
    */
    return function(config) {

        if (!config||!config.playingBoard) {return;}
        if (localStorage.jsSnakeHighScore === undefined) localStorage.setItem('jsSnakeHighScore', 0);

        // ----- private variables -----

        const me = this;
        const playingBoard = config.playingBoard;
        const myId = instanceNumber++;
        const growthIncr = 5;
        const columnShift = [0, 1, 0, -1];
        const rowShift = [-1, 0, 1, 0];
        const xPosShift = [];
        const yPosShift = [];

        let lastMove = 1,
            preMove = -1,
            isFirstMove = true,
            isFirstGameMove = true,
            currentDirection = -1, // 0: up, 1: left, 2: down, 3: right
            snakeSpeed = 80,
            isDead = false,
            isPaused = false;

            function setModeListener (mode, speed) {
                document.getElementById(mode).addEventListener('click', function () { snakeSpeed = speed; });
            }

            const modeDropdown = document.getElementById('selectMode');
            if ( modeDropdown ) {
                modeDropdown.addEventListener('change', function(evt) {
                    evt = evt || {};
                    const val = evt.target ? parseInt(evt.target.value) : 75;
                    
                    if (isNaN(val)) {
                        val = 75;
                    } else if (val < 25) {
                        val = 75
                    }

                    snakeSpeed = val;

                    setTimeout(function() {
                        document.getElementById('game-area').focus();
                    }, 10);
                });
            }

        me.snakeBody = {};
        me.snakeBody["b0"] = new SnakeBlock(); // create snake head
        me.snakeBody["b0"].row = config.startRow || 1;
        me.snakeBody["b0"].col = config.startCol || 1;
        me.snakeBody["b0"].xPos = me.snakeBody["b0"].row * playingBoard.getBlockWidth();
        me.snakeBody["b0"].yPos = me.snakeBody["b0"].col * playingBoard.getBlockHeight();
        me.snakeBody["b0"].elm = createSnakeElement();
        me.snakeBody["b0"].elmStyle = me.snakeBody["b0"].elm.style;
        playingBoard.getBoardContainer().appendChild( me.snakeBody["b0"].elm );
        me.snakeBody["b0"].elm.style.left = me.snakeBody["b0"].xPos + "px";
        me.snakeBody["b0"].elm.style.top = me.snakeBody["b0"].yPos + "px";
        me.snakeBody["b0"].next = me.snakeBody["b0"];
        me.snakeBody["b0"].prev = me.snakeBody["b0"];

        me.snakeLength = 1;
        me.snakeHead = me.snakeBody["b0"];
        me.snakeTail = me.snakeBody["b0"];
        me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'');
        me.snakeHead.elm.id = "snake-snakehead-alive";
        me.snakeHead.elm.className += " snake-snakebody-alive";
        function createSnakeElement() {
            const tempNode = document.createElement("div");
            tempNode.className = "snake-snakebody-block";
            tempNode.style.left = "-1000px";
            tempNode.style.top = "-1000px";
            tempNode.style.width = playingBoard.getBlockWidth() + "px";
            tempNode.style.height = playingBoard.getBlockHeight() + "px";
            return tempNode;
        }

        function createBlocks(num) {
            let tempBlock;
            const tempNode = createSnakeElement();

            for (let ii = 1; ii < num; ii++){
                tempBlock = new SnakeBlock();
                tempBlock.elm = tempNode.cloneNode(true);
                tempBlock.elmStyle = tempBlock.elm.style;
                playingBoard.getBoardContainer().appendChild( tempBlock.elm );
                blockPool[blockPool.length] = tempBlock;
            }

            tempBlock = new SnakeBlock();
            tempBlock.elm = tempNode;
            playingBoard.getBoardContainer().appendChild( tempBlock.elm );
            blockPool[blockPool.length] = tempBlock;
        }

        function recordScore() {
            const highScore = localStorage.jsSnakeHighScore;
            if (me.snakeLength > highScore) {
                alert('Felicidades, rompiste tu record anterior! ' + highScore + '.');
                localStorage.setItem('jsSnakeHighScore', me.snakeLength);
            }
        }

        function handleEndCondition(handleFunc) {
            recordScore();
            me.snakeHead.elm.style.zIndex = getNextHighestZIndex(me.snakeBody);
            me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-alive\b/, '')
            me.snakeHead.elm.className += " snake-snakebody-dead";

            isDead = true;
            handleFunc();
        }
        me.setPaused = function(val) {
            isPaused = val;
        };
        me.getPaused = function() {
            return isPaused;
        };

        // Este método se llama cuando un usuario presiona una tecla. Registra las pulsaciones de las teclas de flecha en "currentDirection", que se utiliza cuando la serpiente necesita hacer su siguiente movimiento.
        me.handleArrowKeys = function(keyNum) {
             if (isDead || (isPaused && !config.premoveOnPause)) {return;}

            const snakeLength = me.snakeLength;
            let directionFound = -1;

            switch (keyNum) {
                case 37:
                case 65:
                    directionFound = 3;
                    break;
                case 38:
                case 87:
                    directionFound = 0;
                    break;
                case 39:
                case 68:
                    directionFound = 1;
                    break;
                case 40:
                case 83:
                    directionFound = 2;
                    break;
            }
            if (currentDirection !== lastMove)  // Permita una cola de 1 movimiento previo para que pueda girar nuevamente antes de que se registre el primer turno.
            {
                preMove = directionFound;
            }
            if (Math.abs(directionFound - lastMove) !== 2 && (isFirstMove || isPaused) || isFirstGameMove )  // Evita que la serpiente gire 180 grados.
            {
                currentDirection = directionFound;
                isFirstMove = false;
                isFirstGameMove = false;
            }
        };

        // Este método se ejecuta para cada movimiento de la serpiente. Determina adónde irá la serpiente y qué le sucederá. Este método debe ejecutarse rápidamente.

        me.go = function() {

            const oldHead = me.snakeHead,
                newHead = me.snakeTail,
                grid = playingBoard.grid;

            if (isPaused === true) {
                setTimeout(function(){me.go();}, snakeSpeed);
                return;
            }

            me.snakeTail = newHead.prev;
            me.snakeHead = newHead;

            // borrar la antigua posición del tablero
            if ( grid[newHead.row] && grid[newHead.row][newHead.col] ) {
                grid[newHead.row][newHead.col] = 0;
            }

            if (currentDirection !== -1){
                lastMove = currentDirection;
                if (preMove !== -1)  // Si el usuario puso en cola otro movimiento después del actual
                {
                    currentDirection = preMove;  // Ejecute ese movimiento la próxima vez (a menos que se sobrescriba)
                    preMove = -1;
                }
            }
            isFirstMove = true;

            newHead.col = oldHead.col + columnShift[lastMove];
            newHead.row = oldHead.row + rowShift[lastMove];
            newHead.xPos = oldHead.xPos + xPosShift[lastMove];
            newHead.yPos = oldHead.yPos + yPosShift[lastMove];

            if ( !newHead.elmStyle ) {
                newHead.elmStyle = newHead.elm.style;
            }

            newHead.elmStyle.left = newHead.xPos + "px";
            newHead.elmStyle.top = newHead.yPos + "px";
            if(me.snakeLength>1){
                newHead.elm.id="snake-snakehead-alive";
                oldHead.elm.id = "";
            }
            
            // revisa el nuevo lugar al que se mudó la serpiente
            if (grid[newHead.row][newHead.col] === 0) {
                grid[newHead.row][newHead.col] = 1;
                setTimeout(function(){me.go();}, snakeSpeed);
            } else if (grid[newHead.row][newHead.col] > 0) {
                me.handleDeath();
            } else if (grid[newHead.row][newHead.col] === playingBoard.getGridFoodValue()) {
                grid[newHead.row][newHead.col] = 1;
                if (!me.eatFood()) {
                    me.handleWin();
                    return;
                }
                setTimeout(function(){me.go();}, snakeSpeed);
            }
        };

        //Este método se llama cuando se determina que la serpiente ha comido algún alimento.

        me.eatFood = function() {
            if (blockPool.length <= growthIncr) {
                createBlocks(growthIncr*2);
            }
            const blocks = blockPool.splice(0, growthIncr);

            let ii = blocks.length,
                index;
                prevNode = me.snakeTail;
            while (ii--) {
                index = "b" + me.snakeLength++;
                me.snakeBody[index] = blocks[ii];
                me.snakeBody[index].prev = prevNode;
                me.snakeBody[index].elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'')
                me.snakeBody[index].elm.className += " snake-snakebody-alive";
                prevNode.next = me.snakeBody[index];
                prevNode = me.snakeBody[index];
            }
            me.snakeTail = me.snakeBody[index];
            me.snakeTail.next = me.snakeHead;
            me.snakeHead.prev = me.snakeTail;

            if (!playingBoard.foodEaten()) {
                return false;
            }

            const selectDropDown = document.getElementById("selectMode");
            const selectedOption = selectDropDown.options[selectDropDown.selectedIndex];

            if(selectedOption.text.localeCompare("Rush") == 0)
            {
                snakeSpeed > 30 ? snakeSpeed -=5 : snakeSpeed = 30;
            }

            return true;
        };

        //Este método maneja lo que sucede cuando muere la serpiente.
        me.handleDeath = function() {
            //Reset speed
            const selectedSpeed = document.getElementById("selectMode").value;
            snakeSpeed = parseInt(selectedSpeed);
            
            handleEndCondition(playingBoard.handleDeath);
        };

        //Este método maneja lo que sucede cuando gana la serpiente.

        me.handleWin = function() {
            handleEndCondition(playingBoard.handleWin);
        };
        // Este método establece una bandera que permite que la serpiente vuelva a estar viva.
 
        me.rebirth = function() {
            isDead = false;
            isFirstMove = true;
            isFirstGameMove = true;
            preMove = -1;
        };
        //Indica q la serpiente esta lista para otra partida
        me.reset = function() {
            if (isDead === false) {return;}

            const blocks = [];
            let curNode = me.snakeHead.next;
            let nextNode;

            while (curNode !== me.snakeHead) {
                nextNode = curNode.next;
                curNode.prev = null;
                curNode.next = null;
                blocks.push(curNode);
                curNode = nextNode;
            }
            me.snakeHead.next = me.snakeHead;
            me.snakeHead.prev = me.snakeHead;
            me.snakeTail = me.snakeHead;
            me.snakeLength = 1;

            for (let ii = 0; ii < blocks.length; ii++) {
                blocks[ii].elm.style.left = "-1000px";
                blocks[ii].elm.style.top = "-1000px";
                blocks[ii].elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'')
                blocks[ii].elm.className += " snake-snakebody-alive";
            }

            blockPool.concat(blocks);
            me.snakeHead.elm.className = me.snakeHead.elm.className.replace(/\bsnake-snakebody-dead\b/,'')
            me.snakeHead.elm.className += " snake-snakebody-alive";
            me.snakeHead.elm.id = "snake-snakehead-alive";
            me.snakeHead.row = config.startRow || 1;
            me.snakeHead.col = config.startCol || 1;
            me.snakeHead.xPos = me.snakeHead.row * playingBoard.getBlockWidth();
            me.snakeHead.yPos = me.snakeHead.col * playingBoard.getBlockHeight();
            me.snakeHead.elm.style.left = me.snakeHead.xPos + "px";
            me.snakeHead.elm.style.top = me.snakeHead.yPos + "px";
        };
        createBlocks(growthIncr*2);
        xPosShift[0] = 0;
        xPosShift[1] = playingBoard.getBlockWidth();
        xPosShift[2] = 0;
        xPosShift[3] = -1 * playingBoard.getBlockWidth();

        yPosShift[0] = -1 * playingBoard.getBlockHeight();
        yPosShift[1] = 0;
        yPosShift[2] = playingBoard.getBlockHeight();
        yPosShift[3] = 0;
    };
})();


//Esta clase gestiona la comida que comerá la serpiente.

SNAKE.Food = SNAKE.Food || (function() {
    let instanceNumber = 0;

    function getRandomPosition(x, y){
        return Math.floor(Math.random()*(y+1-x)) + x;
    }
    return function(config) {

        if (!config||!config.playingBoard) {return;}
        const me = this;
        const playingBoard = config.playingBoard;
        let fRow, fColumn;
        const myId = instanceNumber++;

        const elmFood = document.createElement("div");
        elmFood.setAttribute("id", "snake-food-"+myId);
        elmFood.className = "snake-food-block";
        elmFood.style.width = playingBoard.getBlockWidth() + "px";
        elmFood.style.height = playingBoard.getBlockHeight() + "px";
        elmFood.style.left = "-1000px";
        elmFood.style.top = "-1000px";
        playingBoard.getBoardContainer().appendChild(elmFood);
        me.getFoodElement = function() {
            return elmFood;
        };

        //Coloca la comida al azar en un lugar disponible en el tablero de juego.
        me.randomlyPlaceFood = function() {
            // si existe algo de comida, borre su presencia del tablero
            if (playingBoard.grid[fRow] && playingBoard.grid[fRow][fColumn] === playingBoard.getGridFoodValue()){
                playingBoard.grid[fRow][fColumn] = 0;
            }

            let row = 0, col = 0, numTries = 0;

            const maxRows = playingBoard.grid.length-1;
            const maxCols = playingBoard.grid[0].length-1;

            while (playingBoard.grid[row][col] !== 0){
                row = getRandomPosition(1, maxRows);
                col = getRandomPosition(1, maxCols);

                // en algunos casos puede que no haya espacio para poner la comida en ningún lado
                // en lugar de congelarse, salga (y devuelva false para indicar
                // que el jugador venció el juego)
                numTries++;
                if (numTries > 20000){
                    return false;
                }
            }

            playingBoard.grid[row][col] = playingBoard.getGridFoodValue();
            fRow = row;
            fColumn = col;
            elmFood.style.top = row * playingBoard.getBlockHeight() + "px";
            elmFood.style.left = col * playingBoard.getBlockWidth() + "px";
            return true;
        };
    };
})();
SNAKE.Board = SNAKE.Board || (function() {
    let instanceNumber = 0;
    function getNextHighestZIndex(myObj) {
        let highestIndex = 0,
            currentIndex = 0,
            ii;
        for (ii in myObj) {
            if (myObj[ii].elm.currentStyle){
                currentIndex = parseFloat(myObj[ii].elm.style["z-index"],10);
            }else if(window.getComputedStyle) {
                currentIndex = parseFloat(document.defaultView.getComputedStyle(myObj[ii].elm,null).getPropertyValue("z-index"),10);
            }
            if(!isNaN(currentIndex) && currentIndex > highestIndex){
                highestIndex = currentIndex;
            }
        }
        return(highestIndex+1);
    }
    //Esta función devuelve el ancho del espacio de pantalla disponible que tenemos

    function getClientWidth(){
        let myWidth = 0;
        if( typeof window.innerWidth === "number" ) {
            myWidth = window.innerWidth;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            myWidth = document.documentElement.clientWidth;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            myWidth = document.body.clientWidth;
        }
        return myWidth;
    }
    //Esta función devuelve la altura del espacio disponible en la pantalla que tenemos
    function getClientHeight(){
        let myHeight = 0;
        if( typeof window.innerHeight === "number" ) {
            myHeight = window.innerHeight;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            myHeight = document.documentElement.clientHeight;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            myHeight = document.body.clientHeight;
        }
        return myHeight;
    }

    return function(inputConfig) {
        const me = this;
        const myId = instanceNumber++;
        const config = inputConfig || {};
        const MAX_BOARD_COLS = 250;
        const MAX_BOARD_ROWS = 250;
        const blockWidth = 20;
        const blockHeight = 20;
        const GRID_FOOD_VALUE = -1; // el valor de un lugar en el tablero que representa comida para serpientes; DEBE SER NEGATIVO

        let myFood,
            mySnake,
            boardState = 1, // 0: activo, 1: esperando el inicio del juego, 2: jugando
            myKeyListener,
            isPaused = false;//nota: tanto el tablero como la serpiente se pueden pausar

        // Componentes de la placa
        let elmContainer,
            elmPlayingField, 
            elmAboutPanel, 
            elmLengthPanel, 
            elmHighscorePanel, 
            elmWelcome, 
            elmTryAgain, 
            elmWin, 
            elmPauseScreen;
        me.grid = [];

        function createBoardElements() {
            elmPlayingField = document.createElement("div");
            elmPlayingField.setAttribute("id", "playingField");
            elmPlayingField.className = "snake-playing-field";

            SNAKE.addEventListener(elmPlayingField, "click", function() {
                elmContainer.focus();
            }, false);

            elmPauseScreen = document.createElement("div");
            elmPauseScreen.className = "snake-pause-screen";
            elmPauseScreen.innerHTML = "<div style='padding:10px;'>[Paused]<p/>Presiona [espacio] para continuar.</div>";

            elmAboutPanel = document.createElement("div");
            elmAboutPanel.className = "snake-panel-component";

            elmLengthPanel = document.createElement("div");
            elmLengthPanel.className = "snake-panel-component";
            elmLengthPanel.innerHTML = "Tamaño: 1";

            elmHighscorePanel = document.createElement("div");
            elmHighscorePanel.className = "snake-panel-component";
            elmHighscorePanel.innerHTML = "Puntuacion mas alta: " + (localStorage.jsSnakeHighScore || 0);

            elmWelcome = createWelcomeElement();
            elmTryAgain = createTryAgainElement();
            elmWin = createWinElement();

            SNAKE.addEventListener( elmContainer, "keyup", function(evt) {
                if (!evt) evt = window.event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) {evt.stopPropagation();}
                if (evt.preventDefault) {evt.preventDefault();}
                return false;
            }, false);

            elmContainer.className = "snake-game-container";

            elmPauseScreen.style.zIndex = 10000;
            elmContainer.appendChild(elmPauseScreen);
            elmContainer.appendChild(elmPlayingField);
            elmContainer.appendChild(elmAboutPanel);
            elmContainer.appendChild(elmLengthPanel);
            elmContainer.appendChild(elmHighscorePanel);
            elmContainer.appendChild(elmWelcome);
            elmContainer.appendChild(elmTryAgain);
            elmContainer.appendChild(elmWin);

            mySnake = new SNAKE.Snake({playingBoard:me,startRow:2,startCol:2,premoveOnPause: config.premoveOnPause});
            myFood = new SNAKE.Food({playingBoard: me});
            
            elmWelcome.style.zIndex = 1000;
        }
        function maxBoardWidth() {
            return MAX_BOARD_COLS * me.getBlockWidth();
        }
        function maxBoardHeight() {
            return MAX_BOARD_ROWS * me.getBlockHeight();
        }

        function createWelcomeElement() {
            const tmpElm = document.createElement("div");
            tmpElm.id = "sbWelcome" + myId;
            tmpElm.className = "snake-welcome-dialog";

            const welcomeTxt = document.createElement("div");
            let fullScreenText = "";
            if (config.fullScreen) {
                fullScreenText = "En Windows, apreta F11 para jugar en pantalla completa. ";
            }
            welcomeTxt.innerHTML = "JavaScript Snake<p></p>Usa las <strong>flechitas</strong> de tu teclado para jugar al snake. " + fullScreenText + "<p></p>";
            const welcomeStart = document.createElement("button");
            welcomeStart.appendChild(document.createTextNode("Jugar"));
            const loadGame = function() {
                SNAKE.removeEventListener(window, "keyup", kbShortcut, false);
                tmpElm.style.display = "none";
                me.setBoardState(1);
                me.getBoardContainer().focus();
            };

            const kbShortcut = function(evt) {
                if (!evt) evt = window.event;
                const keyNum = (evt.which) ? evt.which : evt.keyCode;
                if (keyNum === 32 || keyNum === 13) {
                    loadGame();
                }
            };
            SNAKE.addEventListener(window, "keyup", kbShortcut, false);
            SNAKE.addEventListener(welcomeStart, "click", loadGame, false);

            tmpElm.appendChild(welcomeTxt);
            tmpElm.appendChild(welcomeStart);
            return tmpElm;
        }

        function createGameEndElement(message, elmId, elmClassName) {
            const tmpElm = document.createElement("div");
            tmpElm.id = elmId + myId;
            tmpElm.className = elmClassName;

            const gameEndTxt = document.createElement("div");
            gameEndTxt.innerHTML = "JavaScript Snake<p></p>" + message + "<p></p>";
            const gameEndStart = document.createElement("button");
            gameEndStart.appendChild(document.createTextNode("Jugar de nuevo"));

            const reloadGame = function () {
                tmpElm.style.display = "none";
                me.resetBoard();
                me.setBoardState(1);
                me.getBoardContainer().focus();
            };

            const kbGameEndShortcut = function (evt) {
                if (boardState !== 0 || tmpElm.style.display !== "block") { return; }
                if (!evt) evt = window.event;
                const keyNum = (evt.which) ? evt.which : evt.keyCode;
                if (keyNum === 32 || keyNum === 13) {
                    reloadGame();
                }
            };
            SNAKE.addEventListener(window, "keyup", kbGameEndShortcut, true);

            SNAKE.addEventListener(gameEndStart, "click", reloadGame, false);
            tmpElm.appendChild(gameEndTxt);
            tmpElm.appendChild(gameEndStart);
            return tmpElm;
        }

        function createTryAgainElement() {
            return createGameEndElement("Has muerto! :(", "sbTryAgain", "snake-try-again-dialog");
        }

        function createWinElement() {
            return createGameEndElement("Ganaste! :D", "sbWin", "snake-win-dialog");
        }

        function handleEndCondition(elmDialog) {
            const index = Math.max(getNextHighestZIndex(mySnake.snakeBody), getNextHighestZIndex({ tmp: { elm: myFood.getFoodElement() } }));
            elmContainer.removeChild(elmDialog);
            elmContainer.appendChild(elmDialog);
            elmDialog.style.zIndex = index;
            elmDialog.style.display = "block";
            me.setBoardState(0);
        }

        me.setPaused = function(val) {
            isPaused = val;
            mySnake.setPaused(val);
            if (isPaused) {
                elmPauseScreen.style.display = "block";
            } else {
                elmPauseScreen.style.display = "none";
            }
        };
        me.getPaused = function() {
            return isPaused;
        };
        //Restablece el tablero de juego para un nuevo juego.

        me.resetBoard = function() {
            SNAKE.removeEventListener(elmContainer, "keydown", myKeyListener, false);
            mySnake.reset();
            elmLengthPanel.innerHTML = "Tamaño: 1";
            me.setupPlayingField();
        };
        //Obtiene el estado actual del tablero de juego. Hay 3 estados: 0: el cuadro de diálogo Bienvenido o Inténtelo de nuevo está presente. 1 - El usuario presionó "Iniciar juego" en el cuadro de diálogo Bienvenido o Inténtalo nuevamente, pero no presionó una tecla de flecha para mover la serpiente. 2 - El juego está en marcha y la serpiente se mueve.
        //El estado del tablero.

        me.getBoardState = function() {
            return boardState;
        };
        
        // Establece el estado actual del tablero de juego. Hay 3 estados: 0: el cuadro de diálogo Bienvenido o Inténtelo de nuevo está presente. 1 - El usuario presionó "Iniciar juego" en el cuadro de diálogo Bienvenido o Inténtalo nuevamente, pero no presionó una tecla de flecha para mover la serpiente. 2 - El juego está en marcha y la serpiente se mueve.
        //El estado del tablero.
        me.setBoardState = function(state) {
            boardState = state;
        };
        // Un número que representa la comida en una representación numérica del tablero de juego.
        me.getGridFoodValue = function() {
            return GRID_FOOD_VALUE;
        };
        //El div que representa el campo de juego (aquí es donde la serpiente puede moverse).
        me.getPlayingFieldElement = function() {
            return elmPlayingField;
        };
        
        // Establece el elemento contenedor para el juego.

        me.setBoardContainer = function(myContainer) {
            if (typeof myContainer === "string") {
                myContainer = document.getElementById(myContainer);
            }
            if (myContainer === elmContainer) {return;}
            elmContainer = myContainer;
            elmPlayingField = null;

            me.setupPlayingField();
        };
        me.getBoardContainer = function() {
            return elmContainer;
        };
        me.getBlockWidth = function() {
            return blockWidth;
        };
        me.getBlockHeight = function() {
            return blockHeight;
        };
        me.setupPlayingField = function () {

            if (!elmPlayingField) {createBoardElements();} // crear campo de juego

            // calcular el ancho de nuestro contenedor de juego
            let cWidth, cHeight;
            let cTop, cLeft;
            if (config.fullScreen === true) {
                cTop = 0;
                cLeft = 0;
                cWidth = getClientWidth()-20;
                cHeight = getClientHeight()-20;
                
            } else {
                cTop = config.top;
                cLeft = config.left;
                cWidth = config.width;
                cHeight = config.height;
            }

            // definir las dimensiones del tablero y del campo de juego
            const wEdgeSpace = me.getBlockWidth()*2 + (cWidth % me.getBlockWidth());
            const fWidth = Math.min(maxBoardWidth()-wEdgeSpace,cWidth-wEdgeSpace);
            const hEdgeSpace = me.getBlockHeight()*3 + (cHeight % me.getBlockHeight());
            const fHeight = Math.min(maxBoardHeight()-hEdgeSpace,cHeight-hEdgeSpace);

            elmContainer.style.left = cLeft + "px";
            elmContainer.style.top = cTop + "px";
            elmContainer.style.width = cWidth + "px";
            elmContainer.style.height = cHeight + "px";
            elmPlayingField.style.left = me.getBlockWidth() + "px";
            elmPlayingField.style.top  = me.getBlockHeight() + "px";
            elmPlayingField.style.width = fWidth + "px";
            elmPlayingField.style.height = fHeight + "px";

            // las matemáticas para esto deberán cambiar según el font size, padding,etc
            // suponiendo una altura de 14 (font) + 8 (padding)
            const bottomPanelHeight = hEdgeSpace - me.getBlockHeight();
            const pLabelTop = me.getBlockHeight() + fHeight + Math.round((bottomPanelHeight - 30)/2) + "px";

            elmAboutPanel.style.top = pLabelTop;
            elmAboutPanel.style.width = "450px";
            elmAboutPanel.style.left = Math.round(cWidth/2) - Math.round(450/2) + "px";

            elmLengthPanel.style.top = pLabelTop;
            elmLengthPanel.style.left = 30 + "px";

            elmHighscorePanel.style.top = pLabelTop;
            elmHighscorePanel.style.left = cWidth - 140 + "px";

            me.grid = [];
            const numBoardCols = fWidth / me.getBlockWidth() + 2;
            const numBoardRows = fHeight / me.getBlockHeight() + 2;

            for (let row = 0; row < numBoardRows; row++) {
                me.grid[row] = [];
                for (let col = 0; col < numBoardCols; col++) {
                    if (col === 0 || row === 0 || col === (numBoardCols-1) || row === (numBoardRows-1)) {
                        me.grid[row][col] = 1; // un borde
                    } else {
                        me.grid[row][col] = 0; // espacio vacio
                    }
                }
            }

            myFood.randomlyPlaceFood();

            myKeyListener = function(evt) {
                if (!evt) evt = window.event;
                const keyNum = (evt.which) ? evt.which : evt.keyCode;

                if (me.getBoardState() === 1) {
                    if ( !(keyNum >= 37 && keyNum <= 40) && !(keyNum === 87 || keyNum === 65 || keyNum === 83 || keyNum === 68)) {return;} // if not an arrow key, leave

                    //Esto elimina el oyente agregado en la línea #listenerX
                    SNAKE.removeEventListener(elmContainer, "keydown", myKeyListener, false);

                    myKeyListener = function(evt) {
                        if (!evt) evt = window.event;
                        const keyNum = (evt.which) ? evt.which : evt.keyCode;
                        //console.log(keyNum);
                        if (keyNum === 32) {
							if(me.getBoardState()!=0)
                                me.setPaused(!me.getPaused());
                        }

                        mySnake.handleArrowKeys(keyNum);

                        evt.cancelBubble = true;
                        if (evt.stopPropagation) {evt.stopPropagation();}
                        if (evt.preventDefault) {evt.preventDefault();}
                        return false;
                    };
                    SNAKE.addEventListener( elmContainer, "keydown", myKeyListener, false);

                    mySnake.rebirth();
                    mySnake.handleArrowKeys(keyNum);
                    me.setBoardState(2); // start the game!
                    mySnake.go();
                }

                evt.cancelBubble = true;
                if (evt.stopPropagation) {evt.stopPropagation();}
                if (evt.preventDefault) {evt.preventDefault();}
                return false;
            };

            // Busque #listenerX para ver dónde se elimina.
            SNAKE.addEventListener( elmContainer, "keydown", myKeyListener, false);
        };

        /**
        * Este método se llama cuando la serpiente come.
        * @method foodEaten
        * @return {bool} Si un nuevo alimento pudo generarse (verdadero)
        */
        me.foodEaten = function() {
            elmLengthPanel.innerHTML = "Tamaño: " + mySnake.snakeLength;
            if (mySnake.snakeLength > localStorage.jsSnakeHighScore)
            {
                localStorage.setItem("jsSnakeHighScore", mySnake.snakeLength);
                elmHighscorePanel.innerHTML = "Puntuacion mas alta: " + localStorage.jsSnakeHighScore;
            }
            if (!myFood.randomlyPlaceFood()) {
                return false;
            }
            return true;
        };

        /**
        * Este método se llama cuando muere la serpiente.
        * @method handleDeath
        */
        me.handleDeath = function() {
            handleEndCondition(elmTryAgain);
        };

        /**
        * Este método se llama cuando gana la serpiente.
        * @method handleWin
        */
        me.handleWin = function () {
            handleEndCondition(elmWin);
        };
        // Inicializar
        config.fullScreen = (typeof config.fullScreen === "undefined") ? false : config.fullScreen;
        config.top = (typeof config.top === "undefined") ? 0 : config.top;
        config.left = (typeof config.left === "undefined") ? 0 : config.left;
        config.width = (typeof config.width === "undefined") ? 400 : config.width;
        config.height = (typeof config.height === "undefined") ? 400 : config.height;
        config.premoveOnPause = (typeof config.premoveOnPause === "undefined") ? false : config.premoveOnPause;

        if (config.fullScreen) {
            SNAKE.addEventListener(window,"resize", function() {
                me.setupPlayingField();
            }, false);
        }

        me.setBoardState(0);

        if (config.boardContainer) {
            me.setBoardContainer(config.boardContainer);
        }

    }; // end return function
})();  