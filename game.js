// game.js
import { GrassCell, WallCell, TreasureCell } from "./cell.js";
import { Hunter } from "./hunter.js";
import { Enemy } from "./enemy.js";

export class Game {
  constructor(width, height, numWalls, numTreasures, numLives) {
    this.width = width;
    this.height = height;
    this.numWalls = numWalls;
    this.numTreasures = numTreasures;
    this.lives = numLives;
    this.collectedTreasures = 0;
    this.gameOver = false;
    this.board = this.createBoard(width, height);
    this.hunter = new Hunter();
    this.enemy = new Enemy(this); // Initialize the enemy
    this.hunterStartX = Math.floor(this.width / 2); // Save hunter's starting X position
    this.hunterStartY = Math.floor(this.height / 2); // Save hunter's starting Y position
    this.canMove = true; // Initialize the canMove flag

    this.placeWalls();
    this.placeTreasures();
    this.placeHunter();
    this.placeEnemy();
    this.updateTreasureCounter();
    this.updateLivesCounter();
    this.moveInterval = null; // Initialize the enemy movement interval
    this.paused = false; // Initialize the paused flag
  }


  pauseGame() {
    if (!this.gameOver) {
      this.paused = true;
      clearInterval(this.moveInterval);
      console.log("Game paused");
    }
  }


    resumeGame() {
        if (!this.gameOver) {
            this.paused = false;
            this.startEnemyMovement();
            console.log('Game resumed');
        }
    }

    togglePause() {
        if (this.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

  createBoard(width, height) {
    const gameboard = document.getElementById("gameboard");
    gameboard.innerHTML = ""; // Clear previous board
    gameboard.style.gridTemplateColumns = `repeat(${width}, 30px)`;
    gameboard.style.gridTemplateRows = `repeat(${height}, 30px)`;

    let board = [];
    for (let y = 0; y < height; y++) {
      let row = [];
      for (let x = 0; x < width; x++) {
        const cell = new GrassCell();
        const cellDiv = document.createElement("div");
        cellDiv.id = `cell-${y}-${x}`;
        cellDiv.classList.add("cell", cell.type);
        gameboard.appendChild(cellDiv);
        row.push(cell);
      }
      board.push(row);
    }
    return board;
  }

  placeWalls() {
    for (let i = 0; i < this.numWalls; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * this.height);
        col = Math.floor(Math.random() * this.width);
      } while (this.board[row][col] instanceof WallCell);
      this.board[row][col] = new WallCell();
    }
  }

  placeTreasures() {
    for (let i = 0; i < this.numTreasures; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * this.height);
        col = Math.floor(Math.random() * this.width);
      } while (!(this.board[row][col] instanceof GrassCell));
      this.board[row][col] = new TreasureCell(100);
    }
  }

  placeHunter() {
    // Calculate the middle position
    const midX = Math.floor(this.width / 2);
    const midY = Math.floor(this.height / 2);

    let x = midX;
    let y = midY;

    // Check if the middle position is available
    if (!(this.board[y][x] instanceof GrassCell)) {
      // Find the nearest available spot
      const maxDistance = Math.max(this.width, this.height);
      outerLoop: for (let distance = 1; distance < maxDistance; distance++) {
        for (let dy = -distance; dy <= distance; dy++) {
          for (let dx = -distance; dx <= distance; dx++) {
            let newX = x + dx;
            let newY = y + dy;
            if (
              newX >= 0 &&
              newX < this.width &&
              newY >= 0 &&
              newY < this.height
            ) {
              if (this.board[newY][newX] instanceof GrassCell) {
                x = newX;
                y = newY;
                break outerLoop;
              }
            }
          }
        }
      }
    }

    this.hunter.setPosition(x, y);
    this.board[y][x] = this.hunter;
  }

  placeEnemy() {
    const spawnRadius = Math.min(this.width, this.height) / 3; // The maximum spawn radius
    const minDistance = spawnRadius / 2; // Set the minimum distance to half of the spawn radius
    let row,
      col,
      attempts = 0;

    const midX = Math.floor(this.width / 2); // Calculate the middle position
    const midY = Math.floor(this.height / 2);

    do {
      const angle = Math.random() * 2 * Math.PI; // Random angle
      const distance =
        Math.random() * (spawnRadius - minDistance) + minDistance;
      row = midY + Math.round(Math.sin(angle) * distance);
      col = midX + Math.round(Math.cos(angle) * distance);

      // Ensure the row and column are within the board boundaries
      row = Math.max(0, Math.min(row, this.height - 1));
      col = Math.max(0, Math.min(col, this.width - 1));

      attempts++;
      if (attempts > 50) {
        // Prevent infinite loops
        console.log(
          "Unable to place the enemy within the defined radius, placing randomly."
        );
        row = Math.floor(Math.random() * this.height);
        col = Math.floor(Math.random() * this.width);
        break;
      }
    } while (
      !(this.board[row][col] instanceof GrassCell) ||
      (row === this.hunter.y && col === this.hunter.x)
    );

    this.enemy.setPosition(col, row);
    this.board[row][col] = this.enemy;
  }

  moveHunter(dx, dy) {
    if (this.paused) return;
    console.log(`moveHunter called with dx: ${dx}, dy: ${dy}`);
    if (this.gameOver) return;

    let newX = this.hunter.x + dx;
    let newY = this.hunter.y + dy;

    if (this.isValidPosition(newX, newY)) {
      let isTreasure = this.board[newY][newX] instanceof TreasureCell;
      this.board[this.hunter.y][this.hunter.x] = new GrassCell();
      this.hunter.setPosition(newX, newY);
      this.board[newY][newX] = this.hunter;

      this.checkForCollision();

      if (isTreasure) {
        this.collectedTreasures++;
        this.updateTreasureCounter();
        if (this.collectedTreasures === this.numTreasures) {
          this.gameOver = true;
          clearInterval(this.moveInterval);
          this.showVictoryModal();
        }
      }

     
    }

    this.renderBoard();
    this.scrollToHunter();
  }

  moveEnemy() {
    if (this.paused) return;    
    console.log(`moveEnemy called`); // Debugging log
    if (!this.gameOver) {
      // Previous position of the enemy
      let prevX = this.enemy.x;
      let prevY = this.enemy.y;

      // Move the enemy
      this.enemy.chase(this.hunter.x, this.hunter.y, this);

      // If the enemy has moved, update the board
      if (prevX !== this.enemy.x || prevY !== this.enemy.y) {
        // Check if the previous cell is not a treasure, only then clear it
        if (!(this.board[prevY][prevX] instanceof TreasureCell)) {
          this.board[prevY][prevX] = new GrassCell();
        }

        // Place the enemy at the new position, if that's not a treasure cell
        if (!(this.board[this.enemy.y][this.enemy.x] instanceof TreasureCell)) {
          this.board[this.enemy.y][this.enemy.x] = this.enemy;
        }
      }
      // console.log(`Enemy moved to x: ${this.enemy.x}, y: ${this.enemy.y}`); // Debugging log

      // If the enemy's new position is where the hunter is, handle collision
      this.checkForCollision();
    }

    // Always re-render the board to reflect the enemy's current position
    this.renderBoard();
  }

  checkForCollision() {
    // Check if the hunter and the enemy occupy the same position
    if (this.hunter.x === this.enemy.x && this.hunter.y === this.enemy.y) {
        this.handleCollision();
    }
}

  scrollToHunter() {
    const hunterElement = document.querySelector(".hunter");
    if (hunterElement) {
      hunterElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }

  disableKeyboardControls() {
    this.canMove = false;
  }

  enableKeyboardControls() {
    this.canMove = true;
  }

  handleCollision() {
    // Decrease lives
    this.lives--;
    this.updateLivesCounter();

    // Pause the enemy movement
    clearInterval(this.moveInterval);

    if (this.lives <= 0) {
      this.gameOver = true;
      this.showGameOverModal();
    } else {
      // Show collision modal
      this.disableKeyboardControls();
      const collisionModal = document.getElementById("collisionModal");
      collisionModal.style.display = "flex";

      // After a delay, hide the collision modal and reset the hunter's position
      setTimeout(() => {
        collisionModal.style.display = "none";

        // Clear the hunter's current position
        this.board[this.hunter.y][this.hunter.x] = new GrassCell();

        // Reset player and enemy's position
        this.placeHunter();
        this.placeEnemy();

        this.renderBoard(); // Re-render board to update UI
        this.scrollToHunter();

        // Check if the game is still not over before resuming
        if (!this.gameOver) {
          // Resume the enemy movement
          this.startEnemyMovement();
          this.enableKeyboardControls();
        }
      }, 2200);
    }

    console.log("Collision handled. Lives:", this.lives); // Debugging line
  }

  isValidPosition(x, y) {
    return (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      !(this.board[y][x] instanceof WallCell)
    );
  }

  updateTreasureCounter() {
    const counterElement = document.getElementById("treasure-counter");
    if (counterElement) {
      counterElement.textContent = `Collected Treasures: ${this.collectedTreasures}/${this.numTreasures}`;
    }
  }

  updateLivesCounter() {
    const livesCounterElement = document.getElementById("lives-counter");
    if (livesCounterElement) {
      livesCounterElement.textContent = `Lives: ${this.lives}`;
    }
  }

  showVictoryModal() {
    const modal = document.getElementById("victoryModal");
    modal.style.display = "block";

    const span = document.getElementsByClassName("close")[0];
    span.onclick = function () {
      modal.style.display = "none";
    };

    const restartButton = document.getElementById("restartButton");
    restartButton.onclick = () => {
      modal.style.display = "none";
      this.resetGameState(
        this.width,
        this.height,
        this.numWalls,
        this.numTreasures,
        this.lives
      );
    };
  }

  showGameOverModal() {
    // Implement the logic to show Game Over Modal
    const modal = document.getElementById("gameoverModal");
    modal.style.display = "block";

    const span = document.getElementsByClassName("close")[1];
    span.onclick = function () {
      modal.style.display = "none";
    };

    const restartButton2 = document.getElementById("restartButton2");
    restartButton2.onclick = () => {
      modal.style.display = "none";
      this.resetGameState(
        this.width,
        this.height,
        this.numWalls,
        this.numTreasures,
        this.lives
      );
    };
  }

  setEnemySpeed(speed) {
    const speedMapping = { slow: 1000, medium: 500, fast: 250, nightmare: 180 };
    this.enemySpeed = speedMapping[speed] || speedMapping.medium;
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.startEnemyMovement();
    }
  }

  startEnemyMovement() {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
    }
    this.moveInterval = setInterval(() => {
      if (!this.gameOver) {
        this.moveEnemy();
      }
    }, this.enemySpeed);
  }

  renderBoard() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.board[y][x];
        const cellDiv = document.getElementById(`cell-${y}-${x}`);
        const cellClasses = ["cell", cell.type];

        if (this.hunter.x === x && this.hunter.y === y) {
          cellClasses.push("hunter");
          if (this.gameOver) {
            cellDiv.style.animation = "victoryAnimation 1s linear both";
          } else {
            cellDiv.style.animation = ""; // Remove the animation if the game is not over
          }
        } else {
          cellDiv.style.animation = ""; // Ensure cells without the hunter don't have the victory animation
        }

        if (this.enemy.x === x && this.enemy.y === y) {
          cellClasses.push("enemy");
        }

        // Update cell classes only if there are changes
        const cellClassString = cellClasses.join(" ");
        if (cellDiv.className !== cellClassString) {
          cellDiv.className = cellClassString;
        }
      }
    }
  }

  resetGameState(
    newWidth,
    newHeight,
    newNumWalls,
    newNumTreasures,
    newNumLives
  ) {
    // Terminate the current worker to ensure a fresh start
    if (this.enemy.worker) {
      this.enemy.worker.terminate();
      // Create a new worker for the enemy
      this.enemy.worker = new Worker("pathworker.js");
      this.enemy.worker.onmessage = this.enemy.handlePathResult.bind(
        this.enemy
      );
    }

    // Reset enemy path
    this.enemy.path = [];

    // Update dimensions and other game parameters
    this.width = newWidth;
    this.height = newHeight;
    this.numWalls = newNumWalls;
    this.numTreasures = newNumTreasures;
    this.lives = document.getElementById("lives").valueAsNumber;
    this.collectedTreasures = 0;
    this.gameOver = false;
    this.paused = false; // Reset the paused flag

    // Create a new board based on new dimensions
    this.board = this.createBoard(this.width, this.height);
    this.placeWalls();
    this.placeTreasures();
    this.placeHunter();
    this.placeEnemy();

    this.updateTreasureCounter();
    this.updateLivesCounter();
    this.renderBoard();

    this.startEnemyMovement(); // Restart the enemy movement
    this.scrollToHunter(); // Scroll to the hunter after resetting the game
  }
}
