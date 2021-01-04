
const http = require('http');
const express = require('express');
const socket = require('socket.io');
const Constants = require('./Constants.js');
// Game (stores game data)
const {
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
  setRoles,
  getRoles,
  setCpus,
  getCpus
} = require('./utils/games');
// User (stores user)
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getLobbyUsers,
  setPlayerRole,
  getPlayerRole
} = require('./utils/users');
// Player (stores data specific to game characters)
const {
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
  getStatus,
  setStatus,
  getScore,
  incrementScore
} = require('./utils/players');

const { create } = require('hbs');


const app = express();
const server = http.createServer(app);
const io = socket(server);
const PORT = process.env.PORT || 3000;

app.use(express.static('views')); // Set static folder to /views

// Run when client connects
io.on('connection', socket => {
  socket.on('retrieveLobbies', () =>  {
    socket.emit('lobbyList', (io.sockets.adapter.rooms));
  });

  socket.on('joinLobby', ({username, lobby}) => {
    // Check the lobby to ensure there will not be two users with the same name or there are already 4 users in the lobby
    let usersInLobby = getLobbyUsers(lobby);
    let failedEntrance = false;
    for (var i = 0; i < usersInLobby.length; i++) {
      if (usersInLobby[i].username === username) {
        socket.emit('failedEntrance', 'duplicateName');
        socket.disconnect();
        failedEntrance = true;
        break;
      }
    }
    if (usersInLobby.length >= 4)	{
      socket.emit('failedEntrance', 'fullLobby');
      failedEntrance = true;
      socket.disconnect();
    }
    else if (!failedEntrance) {
      // Have user join lobby
      const user = userJoin(socket.id, username, lobby);
      socket.join(user.lobby);
      const users = getLobbyUsers(user.lobby);

      // Welcome current user to lobby.
      socket.emit('message', 'Welcome to CyRun lobby ' + user.lobby);
      console.log('Lobby: ' + user.lobby + ' | ' + user.username + ' has joined'); // Development purposes only. DELETE THIS

      // If this is the first user in the lobby create a game for the lobby.
      if (getGame(lobby) == undefined) newGame(lobby);

      // Copy player roles and cpus
      let roles = getRoles(lobby).slice();
      let cpus = getCpus(lobby).slice();

      // Set random player roles
      let role = 0;
      while (roles[role] == 1)  { // find a new role if this one is already taken
        role = Math.floor(Math.random() * 4) + 1;
      }
      setPlayerRole(user.id, role);
      roles[role] = 1;

      // If this is the first user to join this lobby, give them the 'begin game' button and create all 4 players (3 to be filled or controlled by server)
      if (getLobbyUsers(lobby).length == 1) {
        socket.emit('startGameButton');
        // Link player and user together
        const player = playerJoin(username, lobby, getPlayerRole(user.id));

        // Fill remaining players with CPU
        for (let i = 2; i <= 4; i++)  {
          // Set random player roles (roles[i] = 0 if role is not taken, 1 if it is assigned to a user, and 2 if it is only assigned to a player, but not yet a user)
          let role = 0;
          while (roles[role] == 1 || roles[role] == 2)  { // find a new role if this one is already taken
            role = Math.floor(Math.random() * 4) + 1;
          }
          roles[role] = 2;

          if (getLobbyPlayers(lobby).length < i)  {
            let cpu = playerJoin(('CPU ' + role), lobby, role);
            cpus[role] = 1;
          }
        }
      } // This is not the first player to join the lobby, so we need to assign them a player (replacing/removing CPU of their assigned role)
      else {
        setPlayerName(username, lobby, role);
        cpus[role] = 0;
      }

      // update game-saved roles and cpus
      setRoles(lobby, roles);
      setCpus(lobby, cpus);

      // Send users and lobby info
      io.to(user.lobby).emit('initDisplayLobbyInfo', {
        lobby: user.lobby,
        players: getLobbyPlayers(user.lobby)
      });

      // Broadcast when a user connects
      socket.broadcast.to(user.lobby).emit('message', user.username + ' joined the lobby');

      // Server is starting the game since 4 users have connected to lobby
      if(getLobbyUsers(user.lobby).length == 4) {
        beginGame(getLobbyPlayers(user.lobby), user.lobby);
      }

      // Update the active lobbies list (on index page)
      io.emit('lobbyList', (io.sockets.adapter.rooms));
    }
  });

  // The first user to join the lobby has requested that the game starts.
  socket.on('beginGame', () =>  {
    let user = getCurrentUser(socket.id);
    console.log('Lobby: ' + user.lobby + ' | A game has started');
    beginGame(getLobbyPlayers(user.lobby), user.lobby);
    // todo
  });

  // Choose a random level (1 or 2) and store a copy of that level as gameBoard
  function createGameBoard(lobby)  {
    let choice = Math.floor(Math.random() * (3 - 1)) + 1; // max 2 (exclusive) min 1 (inclusive)
    switch (choice) {
      case 1:
        setGameBoard(lobby, Constants.LEVEL1.slice()); // copy LEVEL1 in Constants.js
        break;
      case 2:
        setGameBoard(lobby, Constants.LEVEL2.slice()); // copy LEVEL2 in Constants.js
        break;
    }
    socket.emit('message', 'Map ' + choice + ' selected');
    return getGameBoard(lobby);
  }

  // Set starting positions of each player and begin the game
  function beginGame(players, lobby)  {
    console.log('Lobby: ' + lobby + ' | A game has started');
    let gameBoard = createGameBoard(lobby);

    // Set player spawn points
    players.forEach(player => {
      if (player.playerRole != 4) { // If player is a ghost spawn in ghostlair
        respawn(gameBoard, player, false);
        setPrevIndex(lobby, player.playerRole, getIndex(player.lobby, player.playerRole));
        gameBoard[getIndex(lobby, player.playerRole)] = player.playerRole + 2;
        setPrevPosType(lobby, player.playerRole, 8);
      }
      else { // IF player is pacman spawn accordingly
        var pacmanStart = Math.floor(Math.random() * (292 - 288)) + 288;
        setIndex(lobby, player.playerRole, pacmanStart);
        setPrevIndex(lobby, player.playerRole, pacmanStart);
        gameBoard[getIndex(lobby, player.playerRole)] = 7;
        setPrevPosType(lobby, player.playerRole, 0);
      }
    });

    // Begin game
    io.to(lobby).emit('loadBoard', ({players: players, gameBoard: gameBoard}));

    setGameBoard(lobby, gameBoard);
    startGame(lobby);

    game(lobby, players);
  }

  // User acknowledged the game ended and left the lobby
  socket.on('ackGameEnd', (id) => {
    userLeave(id);
    socket.disconnect();
  });

  // Constant updates between clients and server (real-time game)
  function game(lobby, players) {
    let gameBoard = getGameBoard(lobby);
    // Iterate through players and determine their new position based on their direction
    players.forEach(player => {
      var update = false;
      let role = player.playerRole;

      if (getQueue(lobby, role) != 0 && getQueue(lobby, role) != getDirection(lobby, role)) { // Check queue direction and act accordingly
        if (getQueue(lobby, role) == -20)  { // Player is moving up
          if (gameBoard[getIndex(lobby, role) - 20 ] != 1)  { // Player is not colliding with wall
            update = true;
          }
        }
        else if (getQueue(lobby, role) == 1)  { // Player is moving to the Right
          if (gameBoard[getIndex(lobby, role) + 1] != 1)  { // Player is not colliding with wall
            update = true;
          }
        }
        else if (getQueue(lobby, role) == 20)  { // Player is moving down
          if (gameBoard[getIndex(lobby, role) + 20 ] != 1)  { // Player is not colliding with wall
            update = true;
          }
        }
        else if (getQueue(lobby, role) == -1)  { // Player is moving to the left
          if (gameBoard[getIndex(lobby, role) - 1] != 1)  { // Player is not colliding with wall
              update = true;
            }
          }

        if (update) {// Update user direction and clear queue
          setDirection(lobby, role, getQueue(lobby, role));
          setQueue(lobby, role, 0);
          update = false;
        }
      }
        if (getDirection(lobby, role) == -20)  { // Player is moving up
          if (checkCollisions(gameBoard, (getIndex(lobby, role) - 20), player)) {
            if (gameBoard[getIndex(lobby, role) - 20 ] != 1)  { // Player is not colliding with wall
              setIndex(lobby, role, (getIndex(lobby, role) - 20));
              update = true;
            }
          }
        }
        else if (getDirection(lobby, role) == 1)  { // Player is moving to the Right
          if (getIndex(lobby, role) == 239) { // Player is passing through portal on right side
            if (checkCollisions(gameBoard, 220, player)) {
              setIndex(lobby, role, 220);
              setDirection(lobby, role, 1);
              update = true;
            }
          }
          else if (checkCollisions(gameBoard, (getIndex(lobby, role) + 1), player))  {
            if (gameBoard[getIndex(lobby, role) + 1] != 1)  { // Player is not colliding with wall
              setIndex(lobby, role, (getIndex(lobby, role) + 1));
              update = true;
            }
          }
        }
        else if (getDirection(lobby, role) == 20)  { // Player is moving down
          if (checkCollisions(gameBoard, (getIndex(lobby, role) + 20), player)) {
            if (gameBoard[getIndex(lobby, role) + 20 ] != 1)  { // Player is not colliding with wall
              setIndex(lobby, role, (getIndex(lobby, role) + 20));
              update = true;
            }
          }
        }
        else if (getDirection(lobby, role) == -1)  { // Player is moving to the left
          if (getIndex(lobby, role) == 220) { // Player is passing through portal on right side
            if (checkCollisions(gameBoard, 239, player)) {
              setIndex(lobby, role, 239);
              setDirection(lobby, role, -1);
              update = true;
            }
          }
          else if (checkCollisions(gameBoard, (getIndex(lobby, role) - 1), player))  {
            if (gameBoard[getIndex(lobby, role) - 1] != 1)  { // Player is not colliding with wall
              setIndex(lobby, role, (getIndex(lobby, role) - 1));
              update = true;
            }
          }
        }

      if (update) {
        gameBoard[getPrevIndex(lobby, role)] = getPrevPosType(lobby, role);
        setPrevPosType(lobby, role, gameBoard[getIndex(lobby, role)]);
        setPrevIndex(lobby, role, getIndex(lobby, role));
        gameBoard[getIndex(lobby, role)] = (role == 4)? 7: role + 2;

        io.to(lobby).emit('gameUpdate', {
          players: getLobbyUsers(lobby),
          gameBoard: gameBoard.filter(removeWalls) // Sends array without walls (sending stationary data is pointless and causes lag)
        });
      }
    }); // End forEach

    // Save gameboard to this lobby's game
    setGameBoard(lobby, gameBoard);

    let gameUpdateTimer = getGameUpdateTimer(lobby);

    if (checkGameStatus(lobby))  { // Check if game is over and respond accordingly
      io.to(lobby).emit('gameOver', {
        lobby: lobby,
        users: getLobbyUsers(lobby),
        gameTime: endGame(lobby)
      });

      clearInterval(gameUpdateTimer);
    }
    else {
      clearInterval(gameUpdateTimer);
      setGameUpdateTimer(lobby, players, 220); // Loop function
      //gameUpdateTimer = setInterval(function() {game(lobby, players);}, 220); //Loop function
    }
  }

  // Filter gameBoard and remove all stationary (wall) elements. Reduces lag since we are not sending stationary data in every packet
  function removeWalls(gameBoard) {
    return gameBoard != 1;
  }

  // Handle player movement over a pill or dot. Returns false if a unresponsive collision occured (i.e. two ghosts run into each other)
  function checkCollisions(gameBoard, index, player) {
    let players = getLobbyPlayers(player.lobby);
    // First check if player is colliding with nothing
    if (gameBoard[index] == 0 || (gameBoard[index] == 8 && player.playerRole != 4)) {
      return true;
    } // Player collides with dot or pill
    else if (gameBoard[index] == 6 || gameBoard[index] == 2) {
      if (player.playerRole == 4)  { // Check if player is pacman
        if (gameBoard[index] == 6) { // pacman consumed pill
          statusTimer = setTimeout(() => statusChange(user), 10000);
          if (player.status == 0) {
            statusChange(player); // change status (ghosts edible)
            statusChange(statusTimer); // change status with timer
          }
          else { // Pacman recently consumed pill. Reset timer
            clearTimeout(statusTimer);
            statusChange(statusTimer);
          }
        }
        incrementScore(player.lobby, player.playerRole, 1);
        gameBoard[index] = 0; // dot or pill will be replaced with empty space after pacman moves again (prevPosType set after this function in game())
        return true;
      }
      else { // Ghost moved over pill/dot
        return true;
      }
    } // Player collides with another player
    else if (gameBoard[index] == 3 || gameBoard[index] == 4 || gameBoard[index] == 5 || gameBoard[index] == 7) {
      if (player.playerRole == 4)  {
        if (getStatus(player.lobby, player.playerRole) == 1)  {
          // Check to see if the ghost that PacMan is colliding with is in a ghost Lair spot. If they are then PacMan will stop moving (return false)
          for (let i = 0; i < players.length; i++)  {
            if (index == getIndex(player.lobby, players[i].playerRole) && getPrevPosType(player.lobby, players[i].id) == 8)  {
              return false;
            }
          }

          // Pacman collides with (eats) ghost
          incrementScore(player.lobby, player.playerRole, 2);
          var pointUnderGhost = false;
          players.forEach(player =>  {
            if (index == getIndex(player.lobby, player.playerRole)) {
              // Check to see if ghost was passing over dot or pill. if so, pacman gains points
              if (getPrevPosType(player.lobby, player.playerRole) == 2 || getPrevPosType(player.lobby, player.playerRole) == 6) {
                pointUnderGhost = true;
              }
              respawn(gameBoard, player); // Ghost repawns
            }
          });
          if (pointUnderGhost) incrementScore(player.lobby, player.playerRole, 1);
        }
        else { // Pacman collided with ghost
          players.forEach(player => {
            if (index == getIndex(player.lobby, player.playerRole)) {
              incrementScore(player.lobby, player.playerRole, 15); // Ghost killed pacman and increases score
              //setPrevPosType(user.id, 0); // Replace pacman with empty space after ghost moves. todo delete
            }
          });
          gameBoard[getIndex(player.lobby, player.playerRole)] = 0; // Pacman ran into ghost. Their character disappears
          respawn(gameBoard, player); // Pacman respawns
        }
        return true; // Pacman collided with another player. One of them respawns.
      }
      else { // A ghost collided with another player
        if (gameBoard[index] == 7)  { // A ghost collided with pacman
          if (getStatus(player.lobby, player.playerRole) == 1)  { // Pacman ate a pill and can eat ghosts
            players.forEach(player =>  {
              if (index == getIndex(player.lobby, player.playerRole)) {
                incrementScore(player.lobby, player.playerRole, 2); // Pacman ate this ghost and increases score
                setPrevPosType(player.lobby, player.playerRole, 0); // Replace ghost with empty space after pacman moves
              }
            });
            respawn(gameBoard, player); // This ghost respawns
          }
          else { // Pacman can't eat ghosts and is killed
            incrementScore(player.lobby, player.playerRole, 15); // Ghost killed pacman
            //setPrevPosType(user.id, 0); // Ensures that ghost does not drop a dot or pill after moving again. todo delete
            players.forEach(player => {
              if (index == getIndex(player.lobby, player.playerRole)) {
                respawn(gameBoard, player); // Pacman respawns
              }
            });
          }
          return true; // Ghost collided with pacman. one of them respawns.
        }
        else { // Lastly, a ghost collides with another ghost
          players.forEach(player => {
            if (index == getIndex(player.lobby, player.playerRole)) {
                return false; // no update made between these two players
            }
          });
        }
      }
    }
    else if (gameBoard[index] == 1 || (gameBoard[index] == 8 && player.playerRole == 4)) {
      setDirection(player.lobby, player.playerRole, 0); // Player is no longer moving when they run into wall
      return false; // No update made since player ran into wall
    }
  }

  // Handle player respawn (default value for gameStart is true since it is only false for one call)
  function respawn(gameBoard, player, gameStart = true)  {
    var foundSpawn = false;
    var spawn = Math.floor(Math.random() * gameBoard.length);
    if (player.playerRole == 4) {
      // choose a random spawn point for Pacman in map
      // ensures that player is not spawning in a wall or play
      while (!foundSpawn)  {
        spawn = Math.floor(Math.random() * gameBoard.length);
        foundSpawn = (gameBoard[spawn] == 0 && spawn != getIndex(player.lobby, player.playerRole)); // Break out of while loop if empty cell (or dot cell) found and not in the same cell
      }
      setPrevPosType(player.lobby, player.playerRole, 0);
    }
    else {
      // Spawn within ghost lair
      while (!foundSpawn)  {
        spawn = Math.floor(Math.random() * gameBoard.length);
        foundSpawn = (gameBoard[spawn] == 8); // Break out of while loop if empty lair cell found
      }
      setPrevPosType(player.lobby, player.playerRole, 8);
    }
    if (gameStart) gameBoard[getIndex(player.lobby, player.playerRole)] = 0; // Replace old position with blank spot (only if game has started)
    setIndex(player.lobby, player.playerRole, spawn);
    setPrevIndex(player.lobby, player.playerRole, getIndex(player.lobby, player.playerRole));
    gameBoard[getIndex(player.lobby, player.playerRole)] = (player.playerRole == 4)? 7: player.playerRole + 2;
    // Player is not moving when they first respawn
    setDirection(player.lobby, player.playerRole, 0);
    setQueue(player.lobby, player.playerRole, 0);
  }

  // Handle Pacman eating a pill and becoming super
  function statusChange(user)  {
    getLobbyUsers(user.lobby).forEach((user) =>   {
      if (getStatus(user.id) == 0)  {
        setStatus(user.id, 1); // Ghosts are edible and Pacman has pill effect
      }
      else {
        setStatus(user.id, 0); // Ghosts are not edible and pacman doesn't have pill effect
      }
    });
  }

  // check the status of the game (pacman collected all dots/pills or not)
  function checkGameStatus(lobby) {
    let gameBoard = getGameBoard(lobby);
    for (var i = 0; i < gameBoard.length; i++) {
      if (gameBoard[i] == 2 || gameBoard[i] == 6)  {
        return false;
      }
    }
    // Game is over, record how long game was and return true
    /*gameTimer = (new Date()) - gameTimer - 5000; // Subtract 5 second delay at beginning of game
    gameTimer /= 1000; //Strip the ms
    gameTimer = Math.round(gameTimer);*/
    return true;
  }

  // Handle player direction changes (keypresses)
  socket.on('changeDirection', (direction) => {
    const user = getCurrentUser(socket.id);

    if (direction === 'up') setQueue(user.id, -20);
    else if (direction === 'right') setQueue(user.id, 1);
    else if (direction === 'down') setQueue(user.id, 20);
    else if (direction === 'left') setQueue(user.id, -1);
  });

  // Lobby chat
  // lobby chat -- normal message
  socket.on('lobbyMessage', ({username, message}) => {
    const user = getCurrentUser(socket.id);
    io.to(user.lobby).emit('lobbyMessage', {user: user, username: username, message: message});
  });

  // Development purposes only. DELETE THIS
  // todo
  // Simulate a game ending
  /*socket.on('simGameOver', () =>  {
    const user = getCurrentUser(socket.id);
    io.to(user.lobby).emit('gameOver', {
      lobby: user.lobby,
      users: getLobbyUsers(user.lobby),
      gameTime: 1000
    });
  });*/

  // Runs when client disconnects
  socket.on('disconnect', () => {
    if (getCurrentUser(socket.id) != undefined) {
      const user = getCurrentUser(socket.id);
      console.log('finding player assigned to user ' + user.username + ': ' + getPlayer(user.lobby, user.playerRole).name);
      // Set the CPU to this player and remember that the player for this playerRole is a CPU
      cpus[user.playerRole] = 1;
      roles[user.playerRole] = 2;
      setPlayerName(('CPU ' + user.playerRole), user.lobby, user.playerRole);


      const userLeft = userLeave(socket.id);
      console.log(getLobbyUsers(user.lobby).length);
      if (getLobbyUsers(user.lobby).length < 1)  {
        for (let i = 1; i <= 4; i++)  {
          playerLeave(user.lobby, i);
        }
        clearInterval(gameUpdateTimer); // Stop constant server-client communication
      }

      if (userLeft) {
        console.log(user.username + ' left the lobby\n');
        io.to(user.lobby).emit('message', user.username + ' left the lobby');

        // Send users and lobby info
        console.log('updating player list after user left');
        io.to(user.lobby).emit('lobbyPlayers', {
          lobby: user.lobby,
          players: getLobbyPlayers(user.lobby)
        });
      }
    }
    // Update the active lobbies list (on index page)
    io.emit('lobbyList', (io.sockets.adapter.rooms));
  });// Do not put anything below socket.on(disconnect)
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
