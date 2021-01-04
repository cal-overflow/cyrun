
const http = require('http');
const express = require('express');
const socket = require('socket.io');
const Constants = require('./Constants.js');
const tickSpeed = 220; // Interval speed at which game updates regularly
// Game (stores game data)
const {
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
  getCpus
} = require('./utils/games');
// User (stores user)
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getLobbyUsers,
  setPlayerAssignment,
  getPlayerAssignment
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
      if (usersInLobby[i].name === username) {
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
      console.log('Lobby: ' + user.lobby + ' | ' + user.name + ' has joined'); // Development purposes only. DELETE THIS

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
      setPlayerAssignment(user.id, role);
      roles[role] = 1;

      // If this is the first user to join this lobby, give them the 'begin game' button and create all 4 players (3 to be filled or controlled by server)
      if (getLobbyUsers(lobby).length == 1) {
        socket.emit('startGameButton');
        // Link player and user together (example: user.playerAssignment --> player.role)
        const player = playerJoin(username, lobby, getPlayerAssignment(user.id));

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

        // Emit votes
        if (getVotes(lobby) > 0 && getGame(lobby).timer == null)
        socket.emit('voteCount', {count: getVotes(lobby), total: getLobbyUsers(lobby).length});
      }

      // update game-saved roles and cpus
      setRoles(lobby, roles);
      setCpus(lobby, cpus);

      // Send users and lobby info
      io.to(user.lobby).emit('initDisplayLobbyInfo', {
        lobby: user.lobby,
        players: getLobbyPlayers(user.lobby)
      });

      // If the game is in progress, let the client know
      if (getGame(lobby).timer != null && !getGameOver(lobby)) {
        socket.emit('gameStarted');
      }

      // Broadcast when a user connects
      socket.broadcast.to(user.lobby).emit('message', user.name + ' joined the lobby');

      // Create a gameboard and set players spawn points if not already done.
      if (getGameBoard(lobby) == null) {
        let gameBoard = createGameBoard(lobby); // Create gameboard
        let players = getLobbyPlayers(lobby);

        // Set player spawn points
        players.forEach(player => {
          if (player.role != 4) { // If player is a ghost spawn in ghostlair
            respawn(gameBoard, player, lobby, false);
            setPrevIndex(lobby, player.role, getIndex(player.lobby, player.role));
            gameBoard[getIndex(lobby, player.role)] = player.role + 2;
            setPrevPosType(lobby, player.role, 8);
          }
          else { // IF player is pacman spawn accordingly
            var pacmanStart = Math.floor(Math.random() * (292 - 288)) + 288;
            setIndex(lobby, player.role, pacmanStart);
            setPrevIndex(lobby, player.role, pacmanStart);
            gameBoard[getIndex(lobby, player.role)] = 7;
            setPrevPosType(lobby, player.role, 0);
          }
        });

        // Save the new gameBoard with players to the gameData
        setGameBoard(lobby, gameBoard);
      }

      socket.emit('loadBoard', {
        players: getLobbyPlayers(lobby),
        gameBoard: getGameBoard(lobby)
      });

      // Server is starting the game since 4 users have connected to lobby (doesn't start if timer has already begun. That means a match has started)
      if(getLobbyUsers(user.lobby).length == 4 && getGame(lobby).timer == null) {
        beginGame(getLobbyPlayers(user.lobby), user.lobby);
      }

      // Update the active lobbies list (on index page)
      io.emit('lobbyList', (io.sockets.adapter.rooms));
    }
  });

  // A user has voted that the game should start
  socket.on('voteStartGame', () =>  {
    let user = getCurrentUser(socket.id);
    tallyVote(user.lobby); // Tally the user's vote to start the game

    // Start the game if there are n/n votes to start the game
    if (getVotes(user.lobby) == getLobbyUsers(user.lobby).length)  {
      beginGame(getLobbyPlayers(user.lobby), user.lobby);
    }
    io.to(user.lobby).emit('voteCount', {count: getVotes(user.lobby), total: getLobbyUsers(user.lobby).length});
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

    startGame(lobby);

    io.to(lobby).emit('startingGame'); // Tell the lobby to begin countdown
    game(lobby, players);
  }

  // // TODO: do something with this.
  // User acknowledged the game ended and left the lobby
  /*socket.on('ackGameEnd', (id) => {
    userLeave(id);
    socket.disconnect();
  });*/

  // Constant updates between clients and server (real-time game)
  function game(lobby, players) {
    let gameBoard = getGameBoard(lobby);
    // Iterate through players and determine their new position based on their direction
    players.forEach(player => {
      var update = false;
      let role = player.role;

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
          if (checkCollisions(gameBoard, (getIndex(lobby, role) - 20), player, lobby)) {
            if (gameBoard[getIndex(lobby, role) - 20 ] != 1)  { // Player is not colliding with wall
              setIndex(lobby, role, (getIndex(lobby, role) - 20));
              update = true;
            }
          }
        }
        else if (getDirection(lobby, role) == 1)  { // Player is moving to the Right
          if (getIndex(lobby, role) == 239) { // Player is passing through portal on right side
            if (checkCollisions(gameBoard, 220, player, lobby)) {
              setIndex(lobby, role, 220);
              setDirection(lobby, role, 1);
              update = true;
            }
          }
          else if (checkCollisions(gameBoard, (getIndex(lobby, role) + 1), player, lobby))  {
            if (gameBoard[getIndex(lobby, role) + 1] != 1)  { // Player is not colliding with wall
              setIndex(lobby, role, (getIndex(lobby, role) + 1));
              update = true;
            }
          }
        }
        else if (getDirection(lobby, role) == 20)  { // Player is moving down
          if (checkCollisions(gameBoard, (getIndex(lobby, role) + 20), player, lobby)) {
            if (gameBoard[getIndex(lobby, role) + 20 ] != 1)  { // Player is not colliding with wall
              setIndex(lobby, role, (getIndex(lobby, role) + 20));
              update = true;
            }
          }
        }
        else if (getDirection(lobby, role) == -1)  { // Player is moving to the left
          if (getIndex(lobby, role) == 220) { // Player is passing through portal on right side
            if (checkCollisions(gameBoard, 239, player, lobby)) {
              setIndex(lobby, role, 239);
              setDirection(lobby, role, -1);
              update = true;
            }
          }
          else if (checkCollisions(gameBoard, (getIndex(lobby, role) - 1), player, lobby))  {
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
          players: getLobbyPlayers(lobby),
          gameBoard: gameBoard.filter(removeWalls), // Sends array without walls (sending stationary data is pointless and causes lag)
          status: getStatus(lobby)
        });
      }
    }); // End forEach

    // Save gameboard to this lobby's game
    setGameBoard(lobby, gameBoard);

    let gameUpdateTimer = getGameUpdateTimer(lobby);

    if (checkGameStatus(lobby))  { // Check if game is over and respond accordingly
      io.to(lobby).emit('gameOver', {
        lobby: lobby,
        players: getLobbyPlayers(lobby),
        gameTime: endGame(lobby)
      });

      clearInterval(gameUpdateTimer);
      clearGame(); // Clear and erase game data. Scores have already been sent to users
    }
    else {
      clearInterval(gameUpdateTimer);
      gameUpdateTimer = setInterval(function() {game(lobby, players);}, tickSpeed);
      setGameUpdateTimer(lobby, gameUpdateTimer); // Loop function
      //gameUpdateTimer = setInterval(function() {game(lobby, players);}, 220); //Loop function
    }
  }

  // Filter gameBoard and remove all stationary (wall) elements. Reduces lag since we are not sending stationary data in every packet
  function removeWalls(gameBoard) {
    return gameBoard != 1;
  }

  // Handle player movement over a pill or dot. Returns false if a unresponsive collision occured (i.e. two ghosts run into each other)
  function checkCollisions(gameBoard, index, player, lobby) {
    let players = getLobbyPlayers(lobby);
    let statusTimer = getStatusTimer(lobby);

    // First check if player is colliding with nothing
    if (gameBoard[index] == 0 || (gameBoard[index] == 8 && player.role != 4)) {
      return true;
    } // Player collides with dot or pill
    else if (gameBoard[index] == 6 || gameBoard[index] == 2) {
      if (player.role == 4)  { // Check if player is pacman
        if (gameBoard[index] == 6) { // pacman consumed pill
          if (getStatus(lobby) == 0) {
            switchStatus(lobby);
            statusTimer = setTimeout(function() {switchStatus(lobby);}, 10000);
            setStatusTimer(lobby, statusTimer);
          }
          else { // Pacman recently consumed pill. Reset the 10 second countdown
            clearTimeout(statusTimer);
            statusTimer = setTimeout(function() {switchStatus(lobby);}, 10000);
            setStatusTimer(lobby, statusTimer);
          }
        }
        incrementScore(lobby, player.role, 1);
        gameBoard[index] = 0; // dot or pill will be replaced with empty space after pacman moves again (prevPosType set after this function in game())
        return true;
      }
      else { // Ghost moved over pill/dot
        return true;
      }
    } // Player collides with another player
    else if (gameBoard[index] == 3 || gameBoard[index] == 4 || gameBoard[index] == 5 || gameBoard[index] == 7) {
      if (player.role == 4)  {
        if (getStatus(lobby) == 1)  {
          // Check to see if the ghost that PacMan is colliding with is in a ghost Lair spot. If they are then PacMan will stop moving (return false)
          for (let i = 0; i < players.length; i++)  {
            if (index == getIndex(lobby, players[i].role) && getPrevPosType(lobby, players[i].role) == 8)  {
              return false;
            }
          }

          // Pacman collides with (eats) ghost
          incrementScore(lobby, player.role, 2);
          var pointUnderGhost = false;
          players.forEach(player =>  {
            if (index == getIndex(lobby, player.role)) {
              // Check to see if ghost was passing over dot or pill. if so, pacman gains points
              if (getPrevPosType(lobby, player.role) == 2 || getPrevPosType(lobby, player.role) == 6) {
                pointUnderGhost = true;
              }
              respawn(gameBoard, player, lobby); // Ghost repawns
            }
          });
          if (pointUnderGhost) incrementScore(lobby, player.role, 1);
        }
        else { // Pacman collided with ghost
          players.forEach(player => {
            if (index == getIndex(lobby, player.role)) {
              incrementScore(lobby, player.role, 15); // Ghost killed pacman and increases score
              //setPrevPosType(user.id, 0); // Replace pacman with empty space after ghost moves. todo delete
            }
          });
          gameBoard[getIndex(lobby, player.role)] = 0; // Pacman ran into ghost. Their character disappears
          respawn(gameBoard, player, lobby); // Pacman respawns
        }
        return true; // Pacman collided with another player. One of them respawns.
      }
      else { // A ghost collided with another player
        if (gameBoard[index] == 7)  { // A ghost collided with pacman
          if (getStatus(lobby) == 1)  { // Pacman ate a pill and can eat ghosts
            players.forEach(player =>  {
              if (index == getIndex(lobby, player.role)) {
                incrementScore(lobby, player.role, 2); // Pacman ate this ghost and increases score
                setPrevPosType(lobby, player.role, 0); // Replace ghost with empty space after pacman moves
              }
            });
            respawn(gameBoard, player, lobby); // This ghost respawns
          }
          else { // Pacman can't eat ghosts and is killed
            incrementScore(lobby, player.role, 15); // Ghost killed pacman
            //setPrevPosType(user.id, 0); // Ensures that ghost does not drop a dot or pill after moving again. todo delete
            players.forEach(player => {
              if (index == getIndex(lobby, player.role)) {
                respawn(gameBoard, player, lobby); // Pacman respawns
              }
            });
          }
          return true; // Ghost collided with pacman. one of them respawns.
        }
        else { // Lastly, a ghost collides with another ghost
          players.forEach(player => {
            if (index == getIndex(lobby, player.role)) {
                return false; // no update made between these two players
            }
          });
        }
      }
    }
    else if (gameBoard[index] == 1 || (gameBoard[index] == 8 && player.role == 4)) {
      setDirection(lobby, player.role, 0); // Player is no longer moving when they run into wall
      return false; // No update made since player ran into wall
    }
  }

  // Handle player respawn (default value for gameStart is true since it is only false for one call)
  function respawn(gameBoard, player, lobby, gameStart = true)  {
    var foundSpawn = false;
    var spawn = Math.floor(Math.random() * gameBoard.length);
    if (player.role == 4) {
      // choose a random spawn point for Pacman in map
      // ensures that player is not spawning in a wall or play
      while (!foundSpawn)  {
        spawn = Math.floor(Math.random() * gameBoard.length);
        foundSpawn = (gameBoard[spawn] == 0 && spawn != getIndex(lobby, player.role)); // Break out of while loop if empty cell (or dot cell) found and not in the same cell
      }
      setPrevPosType(lobby, player.role, 0);
    }
    else {
      // Spawn within ghost lair
      while (!foundSpawn)  {
        spawn = Math.floor(Math.random() * gameBoard.length);
        foundSpawn = (gameBoard[spawn] == 8); // Break out of while loop if empty lair cell found
      }
      setPrevPosType(lobby, player.role, 8);
    }
    if (gameStart) gameBoard[getIndex(lobby, player.role)] = 0; // Replace old position with blank spot (only if game has started)
    setIndex(lobby, player.role, spawn);
    setPrevIndex(lobby, player.role, getIndex(lobby, player.role));
    gameBoard[getIndex(lobby, player.role)] = (player.role == 4)? 7: player.role + 2;
    // Player is not moving when they first respawn
    setDirection(lobby, player.role, 0);
    setQueue(lobby, player.role, 0);
  }

  // check the status of the game (pacman collected all dots/pills or not)
  function checkGameStatus(lobby) {
    let gameBoard = getGameBoard(lobby);
    for (var i = 0; i < gameBoard.length; i++) {
      if (gameBoard[i] == 2 || gameBoard[i] == 6)  {
        return false;
      }
    }
    return true;
  }

  // Handle player direction changes (keypresses)
  socket.on('changeDirection', (direction) => {
    const lobby = getCurrentUser(socket.id).lobby;
    const role = getCurrentUser(socket.id).player;

    if (direction === 'up') setQueue(lobby, role, -20);
    else if (direction === 'right') setQueue(lobby, role, 1);
    else if (direction === 'down') setQueue(lobby, role, 20);
    else if (direction === 'left') setQueue(lobby, role, -1);
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
  socket.on('simGameOver', () =>  {
    const user = getCurrentUser(socket.id);

    let gameUpdateTimer = getGameUpdateTimer(user.lobby);
    clearInterval(gameUpdateTimer);

    io.to(user.lobby).emit('gameOver', {
      lobby: user.lobby,
      players: getLobbyPlayers(user.lobby),
      gameTime: endGame(user.lobby)
    });
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    if (getCurrentUser(socket.id) != undefined) {
      const user = getCurrentUser(socket.id);
      let roles = getRoles(user.lobby).slice();
      let cpus = getCpus(user.lobby).slice();

      // Set a CPU to this player and remember that this player is now a CPU. Then save all of this to the game data.
      roles[user.player] = 2;
      cpus[user.player] = 1;
      setPlayerName(('CPU ' + user.player), user.lobby, user.player);
      setRoles(user.lobby, roles);
      setCpus(user.lobby, cpus);

      const userLeft = userLeave(socket.id);
      if (getLobbyUsers(user.lobby).length < 1)  {
        for (let i = 1; i <= 4; i++)  {
          playerLeave(user.lobby, i);
        }
        clearInterval(getGameUpdateTimer(user.lobby)); // Stop constant server-client communication
        clearGame(user.lobby); // Clear the game data
      }
      else if (userLeft) {
        console.log(user.name + ' left the lobby\n');
        io.to(user.lobby).emit('message', user.name + ' left the lobby');

        // Send users and lobby info
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
