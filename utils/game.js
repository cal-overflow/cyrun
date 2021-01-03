// This file represents the gamedata that is stored for each game
const games = [];

// Construct game
function newGame(lobby) {
  var game = {board,
    timer,
    updateTimer,
    statusTimer,
    // Array represents available roles (0's are empty roles, 1's are user occupied roles, and 2's are cpu occupied roles)
    roles: [1, 0, 0, 0, 0],
    // Array represents the players controlled by CPU's (0's are non-cpu players, 1's are CPU players, and 2's are ignored)
    cpus: [2, 0, 0, 0, 0]
  }
}
