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
    status: 0,
    gameOver: false,
    // Array represents available roles (0's are empty roles, 1's are user occupied roles, and 2's are cpu occupied roles)
    roles: [1, 0, 0, 0, 0],
    // Array represents the players controlled by CPU's
    // Indices 1 - 4 represent player roles controlled by CPU's (0's are non-cpu players, 1's are CPU players, and 2's are ignored)
    // Index 1 represents the difficulty of CPU's (1 easy, 2 normal, 3 hard). This is used to determine how frequently the CPU updates their target.
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
  getGame(lobby).status = -1; // Set the status to -1 for the first five seconds so the CPU players don't move before the game starts
  // Set the status back to 0 after 5 second countdown. (Only do so if game is not undefined, as otherwise the server will crash in the rare case of all players leaving during pre-game countdown).
  setTimeout(function() {if (getGame(lobby) != undefined) getGame(lobby).status = 0;}, 5000);
}

// End a game. Stop and return the game timer
function endGame(lobby) {
  getGame(lobby).gameOver = true;
  getGame(lobby).timer = (new Date()) - getGame(lobby).timer - 5000; // Subtract 5 second delay at beginning of game
  getGame(lobby).timer /= 1000;
  return Math.round(getGame(lobby).timer);
}

// Get a game's gameOver status
function getGameOver(lobby) {
  return getGame(lobby).gameOver;
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

// Switch the status of the game (0 if normal, 1 if pacman has consumed pill)
function switchStatus(lobby)  {
  getGame(lobby).status = (getStatus(lobby) == 0)? 1: 0;
}

// Get the status of the game (0 if normal, 1 if pacman has consumed pill)
function getStatus(lobby)  {
  return getGame(lobby).status;
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

// Set the CPU difficulty: 1 - easy, 2 - medium, 3 - hard
function setCpuDifficulty(lobby, n) {
  getGame(lobby).cpus[0] = n;
}

// Get the Cpu difficulty: 1 - easy, 2 - medium, 3 - hard
function getCpuDifficulty(lobby)  {
  return getGame(lobby).cpus[0];
}

module.exports = {
  newGame,
  getGame,
  clearGame,
  startGame,
  endGame,
  getGameOver,
  setGameBoard,
  getGameBoard,
  setGameUpdateTimer,
  getGameUpdateTimer,
  setStatusTimer,
  getStatusTimer,
  tallyVote,
  getVotes,
  switchStatus,
  getStatus,
  setRoles,
  getRoles,
  setCpus,
  getCpus,
  setCpuDifficulty,
  getCpuDifficulty
};
