const users = [];

//Join user
function userJoin(id, username, lobby)  {
  var user = {id,
                username,
                lobby,
                playerRole : -1
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
function setPlayerRole(id, number){
  let index = users.findIndex(user => user.id === id);
  users[index].playerRole = number;
}

// Get player role
function getPlayerRole(id)  {
  return users.find(user => user.id === id).playerRole;
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getLobbyUsers,
  setPlayerRole,
  getPlayerRole
};
