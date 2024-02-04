// pathworker.js

class BinaryHeap {
  constructor() {
    this.items = [];
  }

  enqueue(value) {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  bubbleUp(index) {
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      if (this.items[index].f >= this.items[parentIndex].f) {
        break;
      }
      [this.items[parentIndex], this.items[index]] = [
        this.items[index],
        this.items[parentIndex],
      ];
      index = parentIndex;
    }
  }

  dequeue() {
    const firstItem = this.items[0];
    const lastItem = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = lastItem;
      this.sinkDown(0);
    } 
    return firstItem;
  }

  sinkDown(index) {
    let leftChildIndex,
      rightChildIndex,
      smallestChildIndex,
      length = this.items.length;
    while (true) {
      leftChildIndex = 2 * index + 1;
      rightChildIndex = 2 * index + 2;
      smallestChildIndex = index;

      if (
        leftChildIndex < length &&
        this.items[leftChildIndex].f < this.items[smallestChildIndex].f
      ) {
        smallestChildIndex = leftChildIndex;
      }
      if (
        rightChildIndex < length &&
        this.items[rightChildIndex].f < this.items[smallestChildIndex].f
      ) {
        smallestChildIndex = rightChildIndex;
      }
      if (smallestChildIndex === index) {
        break;
      }
      [this.items[index], this.items[smallestChildIndex]] = [
        this.items[smallestChildIndex],
        this.items[index],
      ];
      index = smallestChildIndex;
    }
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.g = 0;
    this.h = 0;
    this.f = 0;
    this.parent = null;
  }
}

function heuristic(nodeA, nodeB) {
  return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}

function isValidPosition(gameData, x, y) {
  return (
    x >= 0 &&
    x < gameData.width &&
    y >= 0 &&
    y < gameData.height &&
    !gameData.board[y][x].isWall
  );
}

const directions = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]; // Moved outside getNeighbors to avoid creating a new array each time

function getNeighbors(gameData, node) {
  const neighbors = [];
  for (const [dx, dy] of directions) {
    const newX = node.x + dx;
    const newY = node.y + dy;
    if (isValidPosition(gameData, newX, newY)) {
      neighbors.push(new Node(newX, newY));
    }
  }
  return neighbors;
}

function reconstructPath(currentNode) {
  const path = [];
  while (currentNode.parent) {
    path.unshift({ x: currentNode.x, y: currentNode.y });
    currentNode = currentNode.parent;
  }
  return path;
}

function aStarPathFinding(gameData, start, end, startTime, maxTime) {
  const openSet = new BinaryHeap();
  const closedSet = new Set();
  const startNode = new Node(start.x, start.y);
  startNode.h = heuristic(startNode, new Node(end.x, end.y));
  startNode.f = startNode.h;
  openSet.enqueue(startNode);

  while (!openSet.isEmpty()) {
    if (Date.now() - startTime > maxTime) {
      throw new Error("Pathfinding timeout");
    }
    let current = openSet.dequeue();

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(current);
    }

    closedSet.add(current);
    const neighbors = getNeighbors(gameData, current);

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) continue;

      const tempG = current.g + 1;

      let isBetterPath = false;
      if (tempG < neighbor.g || neighbor.g === 0) {
        neighbor.g = tempG;
        isBetterPath = true;
      }

      if (isBetterPath) {
        neighbor.h = heuristic(neighbor, new Node(end.x, end.y));
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;

        openSet.enqueue(neighbor);
      }
    }
  }

  return [];
}

onmessage = function (e) {
  const startTime = Date.now(); // Record the start time when message is received
  const maxTime = 500; // Maximum time in milliseconds to find a path

  console.log("Message received in worker:");
  try {
    const path = aStarPathFinding(
      e.data.gameData,
      e.data.start,
      e.data.end,
      startTime,
      maxTime
    );
    console.log("Path found by worker:");
    postMessage({ path: path });
  } catch (error) {
    console.error(error.message); // Log the error message
    postMessage({ path: [], error: error.message });
  }
};
