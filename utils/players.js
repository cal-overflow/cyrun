const players = [];

//There are always 4 players. If there are not even 4 players, the remaining players will be controlled by bots (CPU)
function playerJoin(name, lobby, role)  {
  var player = {
    name,
    lobby,
    role,
    index: -1,
    direction: 0,
    queue: 0,
    prevPosType: 0,
    prevIndex: -1,
    score : 0
  };

  players.push(player);

  return player;
}

// Get a player given the lobby and player role
function getPlayer(lobby, role) {
  return players.find(player => player.lobby === lobby && player.role === role);
}

// Player (player) leaves a game. This is more than likely not going to be used, since when a user leaves, it is re-assigned to a CPU
function playerLeave(lobby, role) {
  const index = players.findIndex(player => player.lobby === lobby && player.role === role);
  if (index !== -1) {
    return players.splice(index, 1)[0];
  }
}

// Get the players in a game (lobby)
function getLobbyPlayers(lobby)  {
  return players.filter(player => player.lobby === lobby);
}

// Set the name of a player
function setPlayerName(setName, lobby, role) {
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].name = setName;
}

// Get a player's name
function getPlayerName(lobby, role) {
  return getPlayer(lobby, role).name;
}

// Set Direction of player (don't think this is used right now) // todo check this usage
function setDirection(lobby, role, xDir, yDir){
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].xDirection = xDir;
  players[index].yDirection = yDir;
}

// Get index of player (from player)
function getIndex(lobby, role) {
  return getPlayer(lobby, role).index;
}

// Set index of player (player)
function setIndex(lobby, role, i)  {
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].index = i;
}

// Get the direction of a player (0 none, -20 up, 1 right, 20 down, -1 left)
function getDirection(lobby, role) {
  if(getPlayer(lobby, role) != undefined)
    return getPlayer(lobby, role).direction;
}

// Set the direction of a player (0 none, -20 up, 1 right, 20 down, -1 left)
function setDirection(lobby, role, direction)  {
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].direction = direction;
}

// Get the queue of a player (next direction) (0 none, -20 up, 1 right, 20 down, -1 left)
function getQueue(lobby, role) {
  if(getPlayer(lobby, role) != undefined)
    return getPlayer(lobby, role).queue;
}

// Set the direction of a player (0 none, -20 up, 1 right, 20 down, -1 left)
function setQueue(lobby, role, direction)  {
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].queue = direction;
}

// Get prevIndex of player (from lobby, role)
function getPrevIndex(lobby, role) {
  return getPlayer(lobby, role).prevIndex;
}

// Set prevIndex of player (lobby, role)
function setPrevIndex(lobby, role, i)  {
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].prevIndex = i;
}


// Get prev position type (empty, dot, pill)
function getPrevPosType(lobby, role)  {
  return getPlayer(lobby, role).prevPosType;
}

// Get prev position type (empty, dot, pill)
function setPrevPosType(lobby, role, type)  {
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].prevPosType = type;
}

// Get score of a player
function getScore(lobby, role) {
  return getPlayer(lobby, role).score;
}

// Increment score of a player
function incrementScore(lobby, role, amount) {
  let index = players.findIndex(player => player.lobby === lobby && player.role === role);
  players[index].score += amount;
}

module.exports = {
  playerJoin,
  getPlayer,
  playerLeave,
  setPlayerName,
  getPlayerName,
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
  getScore,
  incrementScore
}
