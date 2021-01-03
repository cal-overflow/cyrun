const players = [];

//There are always 4 players. If there are not even 4 players, the remaining players will be controlled by bots (CPU)
function playerJoin(name, lobby, playerRole)  {
  console.log('player ' + name + ' joined lobby' + lobby + ' as playerRole: ' + playerRole);
  var player = {
    name,
    lobby,
    playerRole,
    index: -1,
    direction: 0,
    queue: 0,
    prevPosType: 0,
    prevIndex: -1,
    status: 0,
    score : 0
  }

  players.push(player);

  return player;
}

// Get a player given the lobby and player role
function getPlayer(lobby, playerRole) {
  return players.find(player.lobby === lobby && player.playerRole === playerRole);
}

// Player (player) leaves a game. A bot will be assigned to the player/character
function playerLeave(lobby, playerRole) {
  const index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);

  if (index !== -1) {
    return players.splice(index, 1)[0];
  }
}

// Get the players in a game (lobby)
function getLobbyPlayers(lobby)  {
  return players.filter(player => player.lobby === lobby);
}

// Set Direction of player (don't think this is used right now) // todo check this usage
function setDirection(lobby, playerRole, xDir, yDir){
  let index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);
  players[index].xDirection = xDir;
  players[index].yDirection = yDir;
}

// Get index of player (from player)
function getIndex(lobby, playerRole) {
  return getPlayer(lobby, playerRole).index;
}

// Set index of player (player)
function setIndex(lobby, playerRole, i)  {
  let index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);
  players[index].index = i;
}

// Get the direction of a player (0 none, -20 up, 1 right, 20 down, -1 left)
function getDirection(lobby, playerRole) {
  if(getPlayer(lobby, playerRole) != undefined)
    return getPlayer(lobby, playerRole).direction;
}

// Set the direction of a player (0 none, -20 up, 1 right, 20 down, -1 left)
function setDirection(lobby, playerRole, direction)  {
  let index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);
  players[index].direction = direction;
}

// Get the queue of a player (next direction) (0 none, -20 up, 1 right, 20 down, -1 left)
function getQueue(lobby, playerRole) {
  if(getPlayer(lobby, playerRole) != undefined)
    return getPlayer(lobby, playerRole).queue;
}

// Set the direction of a player (0 none, -20 up, 1 right, 20 down, -1 left)
function setQueue(lobby, playerRole, direction)  {
  let index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);
  players[index].queue = direction;
}

// Get prevIndex of player (from lobby, playerRole)
function getPrevIndex(lobby, playerRole) {
  return getPlayer(lobby, playerRole).prevIndex;
}

// Set prevIndex of player (lobby, playerRole)
function setPrevIndex(lobby, playerRole, i)  {
  let index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);
  players[index].prevIndex = i;
}

// Get player status
function getStatus(lobby, playerRole)  {
  return getPlayer(lobby, playerRole).status;
}

// Set player status
function setStatus(player, status)  {
  let index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);
  players[index].status = status;
}

// Get prev position type (empty, dot, pill)
function getPrevPosType(player)  {
  return getPlayer(player).prevPosType;
}

// Get prev position type (empty, dot, pill)
function setPrevPosType(player, type)  {
  let index = players.findIndex(player => player.lobby === lobby && player.playerRole === playerRole);
  players[index].prevPosType = type;
}

// Get score of a player
function getScore(lobby, playerRole) {
  return getPlayer(lobby, playerRole).score;
}

// Increment score of a player
function incrementScore(lobby, playerRole, amount) {
  let index = players.findIndex(playerRole => player.lobby === lobby && player.playerRole === playerRole);
  players[index].score += amount;
}

module.exports = {
  playerJoin,
  getPlayer,
  playerLeave,
  getLobbyPlayers,
  getIndex,
  setIndex,
  getDirection,
  setDirection,
  getQueue,
  setQueue,
  getPrevIndex,
  setPrevIndex,
  getPrevPosType,
  setPrevPosType,
  getStatus,
  setStatus,
  getScore,
  incrementScore
}
