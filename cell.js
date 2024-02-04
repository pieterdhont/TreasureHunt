/*cell.js*/

// cell.js

export class Cell {
  constructor(type) {
      this.type = type;
  }
}

export class GrassCell extends Cell {
  constructor() {
      super('grass');
  }
}

export class WallCell extends Cell {
  constructor() {
      super('wall');
      // Add any wall-specific properties or methods
  }
}

export class TreasureCell extends Cell {
  constructor(value) {
      super('treasure');
      this.value = value; // Value of the treasure
      // Add any treasure-specific properties or methods
  }
}

