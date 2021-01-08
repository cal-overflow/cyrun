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
  OUTOFBOUNDS: 'outside',
  PATH: 'path'// todo: delete this. for Develoment purposes only
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
  SQUARE_TYPE.OUTOFBOUNDS,
  SQUARE_TYPE.PATH // todo: delete this. for Develoment purposes only
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

const pathFinding = function(gameBoard, start, goal) {
  // First, create an adjacency matrix representing the paths of the gameBoard
  let matrix = [];

  for (let i = 0; i < gameBoard.length; i++)  {
    matrix[i] = [];
    for (let j = 0; j < gameBoard.length; j++)  {
      if (gameBoard[i] == 1 || gameBoard[j] == 1 || (gameBoard[start] == 7 && (gameBoard[i] == 8 || gameBoard[j] == 8))) {
        matrix[i][j] = 0; // Wall is not traversal
      }
      else if (Math.abs(i - j) == 20)  {
        matrix[i][j] = 1; // Indices are direclty vertical of each other
      }
      else if (Math.abs(i - j) == 1)  {
        matrix[i][j] = 1; // Indices are directly horizontal of each other
      }
      else if (i == j)  {
        matrix[i][j] = 1; // Indices are the same
      }
      else matrix[i][j] = 0; // In any other scenario, there is not a path between the two indices
    }
  }

  // The following portion of this function is a modified version of the A* algorithm found here: https://www.algorithms-and-technologies.com/a_star/javascript

  //This contains the distances from the start node to all other nodes
    var distances = [];
    //Initializing with a distance of "Infinity"
    for (var i = 0; i < matrix.length; i++) distances[i] = Number.MAX_VALUE;
    //The distance from the start node to itself is of course 0
    distances[start] = 0;

    //This contains the priorities with which to visit the nodes, calculated using the heuristic.
    var priorities = [];
    //Initializing with a priority of "Infinity"
    for (var i = 0; i < matrix.length; i++) priorities[i] = Number.MAX_VALUE;
    //start node has a priority equal to straight line distance to goal. It will be the first to be expanded.
    priorities[start] = manhattanDistance(start, goal);

    //This contains whether a node was already visited
    var visited = [];

    //While there are nodes left to visit...
    while (true) {

        // ... find the node with the currently lowest priority...
        var lowestPriority = Number.MAX_VALUE;
        var lowestPriorityIndex = -1;
        for (var i = 0; i < priorities.length; i++) {
            //... by going through all nodes that haven't been visited yet
            if (priorities[i] < lowestPriority && !visited[i]) {
                lowestPriority = priorities[i];
                lowestPriorityIndex = i;
            }
        }

        if (lowestPriorityIndex === -1) {
            // There was no node not yet visited --> Node not found
            return -1;
        }
        else if (lowestPriorityIndex === goal) { // Goal found
            // console.log("Goal node found!");
            //return distances[lowestPriorityIndex];

            // Create a path using the distances determined
            let path = [];
            for (let i = 0; i < distances.length; i++) {
              for (let j = 0; j < distances.length; j++) {
                if (distances[j] == i)  {
                  path[i] = j;
                  break; // Break out of this loop and start search for incremented i
                }
              }
            }

            return path;
        }

        // console.log("Visiting node " + lowestPriorityIndex + " with currently lowest priority of " + lowestPriority);

        //...then, for all neighboring nodes that haven't been visited yet....
        for (var i = 0; i < matrix[lowestPriorityIndex].length; i++) {
            if (matrix[lowestPriorityIndex][i] !== 0 && !visited[i]) {
                //...if the path over this edge is shorter...
                if (distances[lowestPriorityIndex] + matrix[lowestPriorityIndex][i] < distances[i]) {
                    //...save this path as new shortest path
                    distances[i] = distances[lowestPriorityIndex] + matrix[lowestPriorityIndex][i];
                    //...and set the priority with which we should continue with this node
                    priorities[i] = distances[i] + manhattanDistance(i, goal);
                    // console.log("Updating distance of node " + i + " to " + distances[i] + " and priority to " + priorities[i]);
                }
            }
        }

        // Lastly, note that we are finished with this node.
        visited[lowestPriorityIndex] = true;
        //console.log("Visited nodes: " + visited);
        //console.log("Currently lowest distances: " + distances);

    }
};

// Determine the manhattan distance given two points (indices)
const manhattanDistance = function(a, b)  {
  let x = Math.abs((a % 20) - (b % 20));
  let y = Math.abs(Math.floor((a - b)/20) + 1);
  return x + y;
};

module.exports.pathFinding = pathFinding;
module.exports.manhattanDistance = manhattanDistance;
