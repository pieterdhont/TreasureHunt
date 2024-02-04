// hunter.js
import { Cell } from './cell.js';
import { GrassCell } from './cell.js';

export class Hunter extends Cell {
    constructor() {
        super('hunter');
        this.x = 0;
        this.y = 0;
        this.lastMoveTime = 0; // Keep track of the last move time
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    move(dx, dy, game) {
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < game.moveCooldown) {
            return; // Exit if the cooldown period hasn't passed
        }
        this.lastMoveTime = currentTime; // Update the last move time

        const newX = this.x + dx;
        const newY = this.y + dy;
        if (newX >= 0 && newX < game.width && newY >= 0 && newY < game.height) {
            if (!(game.board[newY][newX] instanceof WallCell)) {
                game.board[this.y][this.x] = new GrassCell();
                this.x = newX;
                this.y = newY;
                game.board[this.y][this.x] = this;
            }
        }
    }
}
