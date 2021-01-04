const users = [];

//Join user
function userJoin(id, name, lobby)  {
  var user = {id,
                name,
                lobby,
                player: -1
              };

  users.push(user);

  return user;
}

// Get current user (from id)
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

// User leaves lobby
function userLeave(id)  {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get lobby Users
function getLobbyUsers(lobby) {
  return users.filter(user => user.lobby === lobby);
}

// Set player role (1-4)
function setPlayerAssignment(id, number){
  let index = users.findIndex(user => user.id === id);
  users[index].player = number;
}

// Get player role
function getPlayerAssignment(id)  {
  return users.find(user => user.id === id).player;
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getLobbyUsers,
  setPlayerAssignment,
  getPlayerAssignment
};
