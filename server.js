
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
  getCpus,
  setCpuDifficulty,
  getCpuDifficulty,
  setEdibleCount,
  getEdibleCount,
  consumeEdible,
  getConsumedEdibles
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
  // Send user list of lobbies
  socket.on('retrieveLobbies', () =>  {
    socket.emit('lobbyList', (io.sockets.adapter.rooms));
  });

  // Handle user joining lobby
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

      console.log('[Lobby ' + lobby + ']: User ' + username + ' joined');
      socket.emit('message', 'Welcome to CyRun lobby ' + user.lobby + '.'); // Welcome current user to lobby.
      socket.broadcast.to(user.lobby).emit('message', user.name + ' joined the lobby.'); // Broadcast that a user connected

      joinGame(user, lobby);

      // Server is starting the game since 4 users have connected to lobby (doesn't start if timer has already begun. That means a match has started)
      if(getLobbyUsers(user.lobby).length == 4 && getGame(lobby).timer == null) {
        beginGame(getLobbyPlayers(user.lobby), user.lobby);
      }

      io.to(user.lobby).emit('toggleCpuDifficulty', (getLobbyUsers(user.lobby)));
      socket.emit('difficultyUpdate', getCpuDifficulty(lobby));

      // Update the active lobbies list (on index page)
      io.emit('lobbyList', (io.sockets.adapter.rooms));
    }
  });

  socket.on('reJoinGame', () => {
    let user = getCurrentUser(socket.id);
    joinGame(user, user.lobby, false);
  });

// Handle a user joining a game. Default value for firstGame is true. It is false when players are re-joining (pressing 'play again')
  function joinGame(user, lobby, firstGame = true) {
    // Create a game for this lobby (if there isn't already one).
    if (getGame(lobby) == undefined) newGame(lobby);

    // Copy player roles and cpus
    let roles = getRoles(lobby).slice();
    let cpus = getCpus(lobby).slice();

    // If this is the first user to join this lobby create all 4 players (3 to be filled or controlled by server unless filled)
    if (getLobbyUsers(lobby).length == 1 || (!firstGame && getLobbyPlayers(lobby).length ==  0)) {
      setPlayerAssignment(user.id, 4); // assign first player pacman
      roles[4] = 1;

      // Link player and user together (example: user.playerAssignment --> player.role)
      const player = playerJoin(user.name, lobby, getPlayerAssignment(user.id));

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
      let role = 0;
      while (roles[role] == 1)  { // find a new role if this one is already taken
        role = Math.floor(Math.random() * 4) + 1;
      }
      setPlayerAssignment(user.id, role);
      roles[role] = 1;

      setPlayerName(user.name, lobby, role);
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
        else { // Player is pacman. Spawn accordingly.
          var pacmanStart = 0;
          while (gameBoard[pacmanStart] != 0)
            pacmanStart = Math.floor(Math.random() * (292 - 288)) + 288;

          setIndex(lobby, player.role, pacmanStart);
          setPrevIndex(lobby, player.role, pacmanStart);
          gameBoard[getIndex(lobby, player.role)] = 7;
          setPrevPosType(lobby, player.role, 0);
        }
      });

      // Save the new gameBoard with players to the gameData
      setGameBoard(lobby, gameBoard);
    }

    // Emit the gameboard
    socket.emit('loadBoard', {
      players: getLobbyPlayers(lobby),
      gameBoard: getGameBoard(lobby)
    });
  }

  // A user has voted that the game should start
  socket.on('voteStartGame', () =>  {
    let user = getCurrentUser(socket.id);
    tallyVote(user.lobby); // Tally the user's vote to start the game

    // emit the updated results and display message saying who voted
    io.to(user.lobby).emit('voteCount', {count: getVotes(user.lobby), total: getLobbyUsers(user.lobby).length});
    if (getLobbyUsers(user.lobby).length != 1)
      io.to(user.lobby).emit('message', user.name + ' is ready to play.');

    // Start the game if there are n/n votes to start the game
    if (getVotes(user.lobby) == getLobbyUsers(user.lobby).length)
      beginGame(getLobbyPlayers(user.lobby), user.lobby);
  });

  // A user has requested the difficulty changes
  socket.on('difficultyChange', (difficulty) => {
    let user = getCurrentUser(socket.id);
    if (user != undefined)  {
      setCpuDifficulty(user.lobby, difficulty);
      io.to(user.lobby).emit('difficultyUpdate', getCpuDifficulty(user.lobby));
      let difficultyName = (difficulty == 1)? "easy": ((difficulty == 2)? "normal": "hard");
      if (getLobbyUsers(user.lobby).length > 1) io.to(user.lobby).emit('message', (user.name + ' changed the CPU difficulty to ' + difficultyName));
    }
  });

  // Choose a random level (1 or 2) and store a copy of that level as gameBoard
  function createGameBoard(lobby)  {
    let choice = Math.ceil(Math.random() * 3); // Map 1, 2, or 3

    switch (choice) {
      case 1:
        setGameBoard(lobby, Constants.LEVEL1.slice()); // copy LEVEL1 in Constants.js
        setEdibleCount(lobby, Constants.LEVEL1.filter(o => o == 2 || o == 6).length);
        break;
      case 2:
        setGameBoard(lobby, Constants.LEVEL2.slice()); // copy LEVEL2 in Constants.js
        setEdibleCount(lobby, Constants.LEVEL2.filter(o => o == 2 || o == 6).length);
        break;
      case 3:
        setGameBoard(lobby, Constants.LEVEL3.slice()); // copy LEVEL3 in Constants.js
        setEdibleCount(lobby, Constants.LEVEL3.filter(o => o == 2 || o == 6).length);
        break;
    }

    socket.emit('message', 'Map ' + choice + ' selected.');
    return getGameBoard(lobby);
  }

  // Set starting positions of each player and begin the game
  function beginGame(players, lobby)  {
    console.log('[Lobby ' + lobby + ']: Game starting');

    startGame(lobby);
    io.to(lobby).emit('difficultyUpdate', getCpuDifficulty(lobby)); // Update user's CPU difficulty buttons, in the event they haven't changed it yet.
    io.to(lobby).emit('startingGame'); // Tell the lobby to begin countdown
    game(lobby, players);
  }

  // Control CPU behavior
  function controlCPU(gameBoard, lobby, players, status, role) {
    let cpu = getPlayer(lobby, role);
    var target = getIndex(lobby, 4); // Set the target value to pacman for the most common scenario
    var potentialTargetIndices = null;

    // Determine the target (index) for this CPU
    if (status == 0)  { // CPU is pacman, set target to dot/pill. Find a dot and move towards it. Start searching at current position and check following indices.
      if (role == 4) potentialTargetIndices = findEdibleIndices(gameBoard);
    }
    else { // Game status is not 0, meaning PacMan kills ghosts on collision
      if (role == 4)  { // CPU is pacman. Get a list of the ghosts indices to later determine the closest.
        potentialTargetIndices = [getIndex(lobby, 1), getIndex(lobby, 2), getIndex(lobby, 3)];
      }
      else { // CPU is ghost. Set target to ghost lair.
        if (getPrevPosType(lobby, role) == 8) return; // if the ghost is already in a ghost lair spot, leave them be
        potentialTargetIndices = findGhostLairIndices(gameBoard);
      }
    }

    // If potential target indices has a value set, reduce it and find the target index closest to the cpu
    if (potentialTargetIndices != null) {
      // Iterate through the potential target indices and determine the manhattan distance for each of them.
      // Comparing each calculated manhattan distances, determine the closest target
      target = potentialTargetIndices.reduce(function(prev, curr) {
        return (Constants.manhattanDistance(curr, cpu.index) < Constants.manhattanDistance(prev, cpu.index))? curr: prev;
      });
    }

    // Take the prederminted target, and determine a path using the pathFinding function. Then set the target to the first step within said path.
    let path = Constants.pathFinding(gameBoard, cpu.index, target);
    if (path[1] != undefined) target = path[1];

    // Signum represents positivity or negativity of direction.
    var signum = (cpu.index > target)? 1: -1;

    // Choose a random direction (-1: left, -20: up, 1: right, 20: down) for worst-case scenario (no path found).
    let randomDirection = ((Math.floor(Math.random() * 2) == 1)? 1: -1) * ((Math.floor(Math.random() * 2) == 1)? 1: 20);

    // Set the queue (direction) based on the new target (location):
    if (target + (signum*20) == cpu.index) setQueue(lobby, role, ((-1)*signum*20));
    else if (target + (signum*1) == cpu.index) setQueue(lobby, role, (((-1)*signum*1)));
    // Worst-case scenario: A path was not found by the path-finding function.
    // In this case either move randomly or do nothing. There is a ~66% chance of randomly moving.
    else if (Math.floor(Math.random() * 3) != 0)  setQueue(lobby, role, randomDirection)
  }

  // Constant updates between clients and server (real-time game)
  function game(lobby, players) {
    let gameBoard = getGameBoard(lobby);
    let cpus = getCpus(lobby);
    let difficulty = 4 - getCpuDifficulty(lobby); // Use CPU difficulty (1 easy, 2 normal, or 3 hard) to determine how often CPU's update their target

    // Control CPU behavior if there are any CPUs.
    for (var i = 1; i < cpus.length && (getStatus(lobby) != -1); i++)
      if (cpus[i] == 1 && Math.ceil(Math.random() * 4) > difficulty) controlCPU(gameBoard, lobby, players, getStatus(lobby), i);

    // Iterate through players and determine their new position based on their direction
    players.forEach(player => {
      var update = false;
      let role = player.role;

      // Check queue direction and act accordingly
      if (player.queue != 0 && player.queue != player.direction) {
        let signum = (player.queue > 0)? 1: -1; // Indication of direction (positive = forward, negative = backward).

        if (player.queue % 20 == 0)  {
          // Player is moving up or down
          if (gameBoard[player.index + (signum*20)] != 1) update = true; // Update if player isn't colliding with wall.
        }
        else {
          // Since player is moving, but it is not up or down, they must be moving left or right.
          if (gameBoard[player.index + (signum*1)] != 1) update = true; // Update if player isn't colliding with wall.
        }

        if (update) {
          // Update player direction and clear the player's queue.
          setDirection(lobby, role, player.queue);
          setQueue(lobby, role, 0);
          update = false;
        }
      }

      let signum = (getDirection(lobby, role) > 0)? 1: -1;

      if (getDirection(lobby, role) == 0) update = false;
      else if (getDirection(lobby, role) == (signum*20)) {
        // Player is moving in a vertical direction.
        if (checkCollisions(gameBoard, (player.index + (signum*20)), player, lobby)) {
          if (gameBoard[player.index + (signum*20)] != 1)  {
            setIndex(lobby, role, (player.index + (signum*20)));
            update = true;
          }
        }
      }
      else {
        // Player is moving in a horizontal direction.
        // First, check whether the player is traveling through portals
        if (player.index == 239 && getDirection(lobby, role) == 1) {
          // Player is traveling through portal on right side.
          if (checkCollisions(gameBoard, 220, player, lobby))  {
            setIndex(lobby, role, 220);
            setDirection(lobby, role, 1);
            update = true;
          }
        }
        else if (player.index == 220 && getDirection(lobby, role) == -1) {
          // Player is traveling through portal on left side
          if (checkCollisions(gameBoard, 239, player, lobby)) {
            setIndex(lobby, role, 239);
            setDirection(lobby, role, -1);
            update = true;
          }
        }
        else {
          // Player is traveling horizontally, and not a through portal.
          if (checkCollisions(gameBoard, (player.index + signum), player, lobby))  {
            if (gameBoard[player.index + signum] != 1)  {
              setIndex(lobby, role, (player.index + signum));
              update = true;
            }
          }
        }
      }

      if (update) {
        gameBoard[getPrevIndex(lobby, role)] = getPrevPosType(lobby, role);
        setPrevPosType(lobby, role, gameBoard[getIndex(lobby, role)]);
        setPrevIndex(lobby, role, getIndex(lobby, role));
        gameBoard[getIndex(lobby, role)] = (role == 4)? 7: role + 2;

        io.to(lobby).emit('gameUpdate', {
          users: getLobbyUsers(lobby),
          players: getLobbyPlayers(lobby),
          gameBoard: gameBoard.filter(removeWalls), // Sends array without walls (sending stationary data is pointless and causes lag)
          status: getStatus(lobby)
        });
      }
    }); // End forEach

    // Save gameboard to this lobby's game
    setGameBoard(lobby, gameBoard);

    let gameUpdateTimer = getGameUpdateTimer(lobby);

    // Check if game is over and respond accordingly
    if (checkGameStatus(lobby))  {
      console.log('[Lobby ' + lobby + ']: Game ending');
      io.to(lobby).emit('gameOver', {
        lobby: lobby,
        players: getLobbyPlayers(lobby),
        gameTime: endGame(lobby)
      });

      clearInterval(gameUpdateTimer);

      clearGame(lobby); // Clear and erase game data. Scores have already been sent to users

      // Clear all player data
      players.forEach((player) => {
        playerLeave(lobby, player.role);
      });
    }
    // The game is not yet over, so continue the constant feedback (game function).
    else {
      clearInterval(gameUpdateTimer);
      gameUpdateTimer = setInterval(function() {game(lobby, players);}, tickSpeed);
      setGameUpdateTimer(lobby, gameUpdateTimer); // Loop function
    }
  }

  // Filter gameBoard and remove all stationary (wall) elements. Reduces lag since we are not sending stationary data in every packet
  function removeWalls(gameBoard) {
    return gameBoard != 1;
  }

  // Filter gameBoard and return a list (array) of the indices of only dots/pills
  function findEdibleIndices(gameBoard)  {
    let indices = [];
    for (let i = 0; i < gameBoard.length; i++)  {

      if (gameBoard[i] == 2 || gameBoard[i] == 6) {
        indices.push(i);
      }
    }
    return indices;
  }

  // Filter gameBoard and return a list (array) of the indices of only ghost lair squares
  function findGhostLairIndices(gameBoard)  {
    let indices = [];
    indices.push(gameBoard.findIndex(square => square == 8));
    return indices;
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
            statusTimer = setTimeout(function() {
              if (getGame(lobby) != undefined) switchStatus(lobby); // Only switch status if the game is not over (game could end by the time this is run).
            }, 10000);
            setStatusTimer(lobby, statusTimer);
          }
          else { // Pacman recently consumed pill. Reset the 10 second countdown
            clearTimeout(statusTimer);
            statusTimer = setTimeout(function() {
              if (getGame(lobby) != undefined) switchStatus(lobby); // Only switch status if the game is not over (game could end by the time this is run).
            }, 10000);
            setStatusTimer(lobby, statusTimer);
          }
        }
        incrementScore(lobby, player.role, 1);
        consumeEdible(lobby); // Update the game's counter of consumed edibles
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
                consumeEdible(lobby); // Update the game's counter of consumed edibles
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
            }
          });
          gameBoard[getIndex(lobby, player.role)] = 0; // Pacman ran into ghost. Their character disappears
          respawn(gameBoard, player, lobby); // Pacman respawns
        }
        return true; // Pacman collided with another player. One of them respawns.
      }
      else { // A ghost collided with another player
        if (gameBoard[index] == 7)  { // A ghost collided with pacman
          let playerPrevType = player.prevPosType; // Set the prevPosType of current player so it can be accessed within forEach
          if (getStatus(lobby) == 1)  { // Pacman recently consumed a pill and can eat ghosts
            players.forEach(player =>  {
              if (index == getIndex(lobby, player.role))
                incrementScore(lobby, player.role, 2); // Pacman ate this ghost and increases score
            });
            // Set their old position to the correct type (typically done in game() function, but this is a specific case)
            console.log('player: ' + player.role + ' -  setting ' + player.index + ' to ' + player.prevPosType);
            gameBoard[player.index] = player.prevPosType;
            // Respawn ghost
            respawn(gameBoard, player, lobby); // This ghost respawns
          }
          else { // Pacman can't eat ghosts and is killed
            incrementScore(lobby, player.role, 15); // Ghost killed pacman
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
    if (gameStart) gameBoard[getIndex(lobby, player.role)] = getPrevPosType(lobby, player.role); // Replace old position with blank spot (only if game has started)
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
    setIndex(lobby, player.role, spawn);
    setPrevIndex(lobby, player.role, getIndex(lobby, player.role));
    gameBoard[getIndex(lobby, player.role)] = (player.role == 4)? 7: player.role + 2;
    // Player is not moving when they first respawn
    setDirection(lobby, player.role, 0);
    setQueue(lobby, player.role, 0);
  }

  // Check the status of the game (pacman collected all dots/pills or not)
  function checkGameStatus(lobby) {
    return getEdibleCount(lobby) == getConsumedEdibles(lobby);
  }

  // Handle player direction changes (keypresses)
  socket.on('changeDirection', (direction) => {
    if (getCurrentUser(socket.id) != undefined) {
      const lobby = getCurrentUser(socket.id).lobby;

      // Directions can only be changed if a game is in progress.
      if (getGame(lobby) != null || getGame(lobby) != undefined)  {
        const role = getCurrentUser(socket.id).player;

        if (direction === 'up') setQueue(lobby, role, -20);
        else if (direction === 'right') setQueue(lobby, role, 1);
        else if (direction === 'down') setQueue(lobby, role, 20);
        else if (direction === 'left') setQueue(lobby, role, -1);
      }
    }
  });

  // Lobby chat
  // lobby chat -- normal message
  socket.on('lobbyMessage', ({username, message}) => {
    const user = getCurrentUser(socket.id);
    io.to(user.lobby).emit('lobbyMessage', {user: user, username: username, message: message});
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    if (getCurrentUser(socket.id) != undefined) {
      const user = getCurrentUser(socket.id);

      // Let lobby know that user has left
      console.log('[Lobby ' + user.lobby + ']: User ' + user.name + ' left');
      io.to(user.lobby).emit('message', user.name + ' left the lobby.');

      // Handle Lobby if there is a game in progress (assign cpus, etc.)
      if (getGame(user.lobby) != undefined) {
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
          console.log('[Lobby ' + user.lobby + ']: Game ending');
        }
        else if (userLeft) {
          // Send lobby updated information regarding users, players, and the game
          io.to(user.lobby).emit('toggleCpuDifficulty', (getLobbyUsers(user.lobby)));

          io.to(user.lobby).emit('lobbyPlayers', {
            lobby: user.lobby,
            players: getLobbyPlayers(user.lobby)
          });

          // Send remaining players updated vote count
          io.to(user.lobby).emit('voteCount', {count: getVotes(user.lobby), total: getLobbyUsers(user.lobby).length});

          // Start the game if the remaining players have all voted to start the game.
          if (getVotes(user.lobby) == getLobbyUsers(user.lobby).length) beginGame(getLobbyPlayers(user.lobby), user.lobby);
        }
      }
      // User leaves room. No game updates necessary
      else {
        userLeave(socket.id);
        io.to(user.lobby).emit('voteCount', {count: 0, total: getLobbyUsers(user.lobby).length});
      }
    }
    // Update the active lobbies list (on index page)
    io.emit('lobbyList', (io.sockets.adapter.rooms));
  });// Do not put anything below socket.on(disconnect)
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
