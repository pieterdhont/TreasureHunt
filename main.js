//main.js

import { Game } from './game.js';

let currentGame = null;
let lastMoveTime = 0; // Keep track of the last move time
const moveCooldown = 20; // milliseconds, adjust as needed

function startGame() {
    console.log('Game starting...');

    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const totalCells = width * height;

    // Randomly choose wallPercentage between 10% and 20%
    const wallPercentage = 0.10 + (Math.random() * 0.10); // 10% + a random number between 0% and 10%
    
    // Randomly choose treasurePercentage between 5% and 10%
    const treasurePercentage = 0.05 + (Math.random() * 0.05); // 5% + a random number between 0% and 5%

    // Check the state of the checkboxes
    const autoWalls = document.getElementById('autoWalls').checked;
    const autoTreasures = document.getElementById('autoTreasures').checked;

    // Calculate default numbers based on percentages or use user input
    const numWalls = autoWalls ? Math.floor(totalCells * wallPercentage) : parseInt(document.getElementById('walls').value);
    const numTreasures = autoTreasures ? Math.floor(totalCells * treasurePercentage) : parseInt(document.getElementById('treasures').value);
    const numLives = parseInt(document.getElementById('lives').value);

    const totalEntities = numWalls + numTreasures + 2; // Walls, treasures, hunter, and enemy

    const enemySpeed = document.getElementById('enemySpeed').value;

    // Input validation
    if (width < 5 || width > 100 || height < 5 || height > 100) {
        alert("width and height must be between 5 and 100.");
        return;
    }
    if (numWalls < 0 || numTreasures < 0 || numLives <= 0) {
        alert("Please enter non-negative numbers for walls, treasures, and a positive number for lives.");
        return;
    }

    if (totalEntities >= totalCells) {
        alert(`Cannot start the game because the sum of walls, treasures, hunter, and enemy (${totalEntities}) ` +
              `is equal to or greater than the total size of the board (${totalCells}). ` +
              `Please reduce the number of walls or treasures. Or select the autocalculate options.`);
        return; // Prevent the game from starting
    }

    if (currentGame) {
        currentGame.resetGameState(width, height, numWalls, numTreasures, numLives);
        currentGame.setEnemySpeed(enemySpeed);
    } else {
        currentGame = new Game(width, height, numWalls, numTreasures, numLives);
        currentGame.setEnemySpeed(enemySpeed);
        setupKeyboardControls(currentGame);
    }
    currentGame.renderBoard();
    currentGame.startEnemyMovement();
    currentGame.scrollToHunter();
}



function setupKeyboardControls(game) {
    document.removeEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) {

        // If the 'P' key is pressed, toggle the pause state
        if (event.key === 'p' || event.key === 'P') {
            game.togglePause(); // Implement this method in your game class
            return; // Don't proceed further if the game is paused or unpaused
        }
        const currentTime = Date.now();
        if (currentTime - lastMoveTime < moveCooldown) {
            return; // Exit if the cooldown period hasn't passed
        }
        lastMoveTime = currentTime; // Update the last move time

        if (!game.canMove || game.gameOver || game.paused) {
            return;
        }
        let moveMade = false;
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault(); // Prevent the default action (scrolling up)
                game.moveHunter(0, -1);
                moveMade = true;
                break;
            case 'ArrowDown':
                event.preventDefault(); // Prevent the default action (scrolling down)
                game.moveHunter(0, 1);
                moveMade = true;
                break;
            case 'ArrowLeft':
                event.preventDefault(); // Prevent the default action (scrolling left)
                game.moveHunter(-1, 0);
                moveMade = true;
                break;
            case 'ArrowRight':
                event.preventDefault(); // Prevent the default action (scrolling right)
                game.moveHunter(1, 0);
                moveMade = true;
                break;
        }
        if (moveMade) {
            game.renderBoard();

        }
    }
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('pauseButton').addEventListener('click', function() {
    currentGame.togglePause(); 
});
