//enemy.js


import { Cell } from './cell.js';
import { WallCell } from './cell.js';
import { GrassCell } from './cell.js'; // Ensure GrassCell is imported
import { TreasureCell } from './cell.js'; // Ensure TreasureCell is imported

export class Enemy extends Cell {
    constructor(gameInstance) {
        super('enemy');
        this.x = 0;
        this.y = 0;
        this.path = [];
        this.worker = new Worker('pathworker.js');
        this.worker.onmessage = this.handlePathResult.bind(this);
        this.game = gameInstance; // Store a reference to the game instance
        this.lastPathUpdateTime = 0; // Initialize the last path update time
        this.pathUpdateThreshold = 100; // Update path every 500ms
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    chase(hunterX, hunterY, game) {
        const currentTime = Date.now(); // Get the current time
        // Only update the path if the threshold time has passed
        if (currentTime - this.lastPathUpdateTime > this.pathUpdateThreshold) {
            console.log('Chase method called');
            this.worker.postMessage({
                gameData: {
                    width: game.width,
                    height: game.height,
                    board: game.board.map(row => row.map(cell => {
                        return { isWall: cell instanceof WallCell };
                    }))
                },
                start: { x: this.x, y: this.y },
                end: { x: hunterX, y: hunterY }
            });
            console.log('Message posted to worker');
            this.lastPathUpdateTime = currentTime; // Update the last path update time
        }
    }

    handlePathResult(event) {
        const { path } = event.data;
        this.path = path;
        if (this.path.length > 0) {
            const nextStep = this.path.shift(); // Remove the next step from the path
            this.move(nextStep.x - this.x, nextStep.y - this.y, this.game);
        }
    }

    move(dx, dy, game) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (game.isValidPosition(newX, newY)) {
            // Clear the enemy's previous position if it's not a treasure
            if (!(game.board[this.y][this.x] instanceof TreasureCell)) {
                game.board[this.y][this.x] = new GrassCell();
            }
            
            // Move enemy to the new position
            this.x = newX;
            this.y = newY;
    
            // If the enemy moves onto a treasure, we keep the treasure cell there
            // We only update the enemy's position in the game logic, not the cell itself
            // If it's not a treasure, then we set the cell to the enemy
            if (!(game.board[newY][newX] instanceof TreasureCell)) {
                game.board[newY][newX] = this;
            }
            game.renderBoard(); // Update the UI
        }
    }
    
    
}
