// This file represents the gamedata that is stored for each game
const games = [];

// Construct game
function newGame(lobby) {
  var game = {lobby,
    board: null,
    timer: null,
    updateTimer: null,
    statusTimer: null,
    votes: 0,
    // Array represents available roles (0's are empty roles, 1's are user occupied roles, and 2's are cpu occupied roles)
    roles: [1, 0, 0, 0, 0],
    // Array represents the players controlled by CPU's (0's are non-cpu players, 1's are CPU players, and 2's are ignored)
    cpus: [2, 0, 0, 0, 0]
  };

  games.push(game);

  return game;
}

// Get game from lobby
function getGame(lobby) {
  return games.find(game => game.lobby === lobby);
}

// Clear game from list (array) of games
function clearGame(lobby) {
  const index = games.findIndex(game => game.lobby === lobby);

  if (index != -1)  {
    return games.splice(index, 1)[0];
  }
}

// Start a game (begin recording time)
function startGame(lobby) {
  getGame(lobby).timer = new Date();
}

// End a game. Stop and return the game timer
function endGame(lobby) {
  getGame(lobby).timer = (new Date()) - getGame(lobby).timer - 5000; // Subtract 5 second delay at beginning of game
  getGame(lobby).timer /= 1000;
  return Math.round(getGame(lobby).timer);
}

// Set a game's board
function setGameBoard(lobby, gameboard) {
  let index = games.findIndex(game => game.lobby === lobby);
  games[index].board = gameboard;
}

// Get a game's board
function getGameBoard(lobby)  {
  return getGame(lobby).board;
}

// Set the duration of a game update timer
function setGameUpdateTimer(lobby, gameUpdateTimer)  {
  getGame(lobby).updateTimer = gameUpdateTimer;
}

// Get the duration of a game update timer
function getGameUpdateTimer(lobby)  {
  return getGame(lobby).updateTimer;
}

// Set the duration of a status timer
function setStatusTimer(lobby, gameStatusTimer)  {
  getGame(lobby).statusTimer = gameStatusTimer;
}

// Get the duration of a status timer
function getStatusTimer(lobby)  {
  return getGame(lobby).statusTimer;
}

// Tally a vote to start the game
function tallyVote(lobby) {
  getGame(lobby).votes++;
}

// Get the number of votes to start a game
function getVotes(lobby)  {
  return getGame(lobby).votes;
}

// Set a value in the array representing player roles
function setRoles(lobby, roles) {
  getGame(lobby).roles = roles;
}

// Get the array representing player roles
function getRoles(lobby)  {
  return getGame(lobby).roles;
}

// Set a value in the array representing Cpus
function setCpus(lobby, cpus) {
  getGame(lobby).cpus = cpus;
}

// Get the array representing Cpus
function getCpus(lobby)  {
  return getGame(lobby).cpus;
}

module.exports = {
  newGame,
  getGame,
  clearGame,
  startGame,
  endGame,
  setGameBoard,
  getGameBoard,
  setGameUpdateTimer,
  getGameUpdateTimer,
  setStatusTimer,
  getStatusTimer,
  tallyVote,
  getVotes,
  setRoles,
  getRoles,
  setCpus,
  getCpus
};
