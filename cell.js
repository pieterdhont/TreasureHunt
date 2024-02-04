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
     
  }
}

export class TreasureCell extends Cell {
  constructor(value) {
      super('treasure');
      
  }
}

