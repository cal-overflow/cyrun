const SQUARE_TYPE = {
  BLANK: 'blank',
  WALL: 'wall',
  DOT: 'dot',
  GHOST1: 'ghost1',
  GHOST2: 'ghost2',
  GHOST3: 'ghost3',
  PILL: 'pill',
  PACMAN: 'pacman',
  GHOST: 'ghost',
  SCARED: 'scared',
  GHOSTLAIR: 'lair',
  OUTOFBOUNDS: 'outside'
};

// Lookup array for classes
const SQUARE_LIST = [
  SQUARE_TYPE.BLANK,
  SQUARE_TYPE.WALL,
  SQUARE_TYPE.DOT,
  SQUARE_TYPE.GHOST1,
  SQUARE_TYPE.GHOST2,
  SQUARE_TYPE.GHOST3,
  SQUARE_TYPE.PILL,
  SQUARE_TYPE.PACMAN,
  SQUARE_TYPE.GHOSTLAIR,
  SQUARE_TYPE.OUTOFBOUNDS
];

const LEVEL1 = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
  1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1,
  1, 6, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 6, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1,
  1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1,
  1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1,
  9, 9, 9, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 9, 9, 9,
  9, 9, 9, 1, 2, 1, 2, 1, 8, 1, 1, 8, 1, 2, 1, 2, 1, 9, 9, 9,
  1, 1, 1, 1, 2, 1, 2, 1, 8, 8, 8, 8, 1, 2, 1, 2, 1, 1, 1, 1,
  0, 0, 0, 0, 2, 2, 2, 1, 8, 8, 8, 8, 1, 2, 2, 2, 0, 0, 0, 0,
  1, 1, 1, 1, 2, 1, 2, 1, 8, 8, 8, 8, 1, 2, 1, 2, 1, 1, 1, 1,
  9, 9, 9, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 9, 9, 9,
  9, 9, 9, 1, 2, 1, 2, 0, 0, 0, 0, 0, 0, 2, 1, 2, 1, 9, 9, 9,
  1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1,
  1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
  1, 6, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 6, 1,
  1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];

const LEVEL2 = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 2, 2, 2, 2, 0, 0, 8, 8, 8, 8, 8, 8, 0, 2, 2, 2, 2, 2, 1,
  1, 2, 6, 1, 2, 1, 1, 1, 8, 8, 8, 8, 1, 1, 1, 2, 1, 6, 2, 1,
  1, 2, 1, 1, 2, 1, 1, 1, 8, 8, 8, 8, 1, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 2, 2, 2, 2, 6, 1, 1, 1, 1, 1, 1, 6, 2, 2, 2, 2, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1,
  1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1,
  0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0,
  1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 2, 2, 2, 1, 2, 2, 1, 6, 6, 1, 2, 2, 1, 2, 2, 2, 2, 1,
  1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1,
  1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1,
  1, 2, 1, 1, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1,
  1, 2, 6, 2, 2, 2, 2, 2, 1, 9, 9, 1, 2, 2, 2, 2, 2, 6, 2, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 9, 9, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];

module.exports.LEVEL1 = LEVEL1;
module.exports.LEVEL2 = LEVEL2;

var testing = false; // todo: delete this! Develoment purposes only.

const nodes = [];

// Path finding algorithm (A*)
const pathFinding = function(gameBoard, start, goal)  {
  // Current attempt to create adjacency-matrix-representation of gameboard where (a, b) is the weight of the edge or 0 if there is no edge (wall to other cell)
  var adjMatrix = [];
  for (let i = 0, k = 0; i < 23; i++)  {
    adjMatrix[i] = []; // Row inside of array
    for (let j = 0; j < 20; j++, k++)  {
      adjMatrix[i][j] = (gameBoard[k] == 1 || gameBoard[k] == 9)? 0: 1;
    }
    //if (!testing) { console.log(adjMatrix[i]); } // todo: delete
  }

  var distances = []; // Distances from start cell to all other cells
  var priorities = []; // Priority list to check while searching paths
  var visited = []; // List of visited cell indices

  for (var i = 0; i < gameBoard.length; i++) {
    distances[i] = Number.MAX_VALUE; // Initialize distances with max possible value
    priorities[i] = Number.MAX_VALUE; // Initialize priorities with max possible value
  }

  distances[start] = 0; // Set starting has distance of 0 to itself
  priorities[start] = Math.abs(start - goal); // our ideal path length is the straight line to the goal (this is the i)

  // Search paths
  while (true)  {
    var lowestPriority = Number.MAX_VALUE;
    var lowestPriorityIndex = -1;
    for (var i = 0; i < priorities.length; i++) {
      if (priorities[i] < lowestPriority && !visited[i])  {
        lowestPriority = priorities[i];
        lowestPriorityIndex = i;
      }
    }

    if (lowestPriorityIndex == -1)  {
      // No more un-visited nodes (path not found).
      /*return -1;*/ // todo
      console.log('path not found :('); //todo delete
      return visited;
    }
    else if (lowestPriorityIndex == goal) {
      /*return distances[lowestPriorityIndex];*/ // todo
      return visited;
    }

    // Set neighbors based on possible location.
    let neighbors = [0, 0, 0, 0]; // [above, left, right, below]. 0 represents unaccessible path, 1 represents accessible.
    switch (true)  {
      case (lowestPriorityIndex < 20): // Can't have neigbor above.
        neighbors = [0, adjMatrix[lowestPriorityIndex - 1], adjMatrix[lowestPriorityIndex + 1], adjMatrix[lowestPriorityIndex + 20]];
        break;
      case (lowestPriorityIndex % 19 == 0): // Can't have neighbor to the right.
        neighbors = [adjMatrix[lowestPriorityIndex - 20], adjMatrix[lowestPriorityIndex - 1], 0, adjMatrix[lowestPriorityIndex + 20]];
        break;
      case (lowestPriorityIndex % 20 == 0): // Can't have neighbor to the left.
        neighbors = [adjMatrix[lowestPriorityIndex - 20], 0, adjMatrix[lowestPriorityIndex + 1], adjMatrix[lowestPriorityIndex + 20]];
        break;
      case (lowestPriorityIndex > 440): // Can't have neighbor below.
        neighbors = [adjMatrix[lowestPriorityIndex - 20], adjMatrix[lowestPriorityIndex - 1], adjMatrix[lowestPriorityIndex + 1], 0];
        break;
      case ((i > 20) && (i % 19 != 0) && (i % 20 != 0) && (i < 440)): // Node can have all surrounding neighbors
        neighbors = [adjMatrix[lowestPriorityIndex - 20], adjMatrix[lowestPriorityIndex - 1], adjMatrix[lowestPriorityIndex + 1], adjMatrix[lowestPriorityIndex + 20]];
        break;
    }
    console.log("Visiting node " + lowestPriorityIndex + " with currently lowest priority of " + lowestPriority);
      // Check all neighboring cells that haven't been visited yet. (4 possible neighbors)
      for (var i = 0; i < 4; i++) {
        var potentialIndex;
      if (neighbors[i] == 1 )  {
        switch (i)  {
          case (0): // above neighbor
            potentialIndex = lowestPriorityIndex - 20;
            break;
          case (1): // left neighbor
            potentialIndex = lowestPriorityIndex - 1;
            break;
          case (2): // right neigbor
            potentialIndex = lowestPriorityIndex + 1;
            break;
          case (3): // below neigbor
            potentialIndex = lowestPriorityIndex + 20;
            break;
        }
        // See if potentialIndex has shorter distance. Only check if it has not already been visited
        if (!visited[potentialIndex] && distances[lowestPriorityIndex] + adjMatrix[potentialIndex] < distances[i])  {
          distances[i] = distances[lowestPriorityIndex] + adjMatrix[potentialIndex]; // Save as new shortest path
          priorities[i] = distances[i] + Math.abs(i - goal);
        }
      }
    }

    // Remember that we visited the current cell
    visited[lowestPriorityIndex] = true;
  }
  console.log("Currently lowest distances: " + distances);
  testing = true; // todo: delete
  return true;
}

module.exports.pathFinding = pathFinding;
