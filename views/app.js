const socket = io();

const lobbyName = document.getElementById('gamelobby');
const userSection = document.getElementById('users_lobby');
const userList = document.getElementById('users');
const leaveLobby = document.getElementById('leave_game');
const chat = document.getElementById('chat');
const chatbox = document.getElementById('chatbox')
const sendChat = document.getElementById('send');
const beginGameBtn = document.getElementById('begin_game');
const footerMsg = document.getElementById('footerMsg');
const countdown = document.getElementById('countdown');
const gameGrid = document.querySelector('#game');
const winnerText = document.getElementById('winner');
const finalScoreboard = document.getElementById('finalScoreboard');
const matchTime = document.getElementById('matchTime');
const gameOver = document.getElementById('endgameboard');
const playAgain = document.getElementById('playagain');


var localBoard;
var playerEnabled = -1;

const GRID_SIZE = 20; // Grid size never changes (cells make up grid)
var CELL_SIZE = 20; // This is never changed. The gameBoard is scaled up to fit larger screens in the stylesheet (CSS)

const SQUARE_TYPE = {
  BLANK: 'blank',
  WALL: 'wall',
  DOT: 'dot',
  GHOST1: 'ghost1',
  GHOST2: 'ghost2',
  GHOST3: 'ghost3',
  PILL: 'pill',
  PACMAN: 'pacman',
  GHOST: 'ghost',
  SCARED: 'scared',
  GHOSTLAIR: 'lair',
  OUTOFBOUNDS: 'outside'
};

// Lookup array for classes
const SQUARE_LIST = [
  SQUARE_TYPE.BLANK,
  SQUARE_TYPE.WALL,
  SQUARE_TYPE.DOT,
  SQUARE_TYPE.GHOST1,
  SQUARE_TYPE.GHOST2,
  SQUARE_TYPE.GHOST3,
  SQUARE_TYPE.PILL,
  SQUARE_TYPE.PACMAN,
  SQUARE_TYPE.GHOSTLAIR,
  SQUARE_TYPE.OUTOFBOUNDS
];

// Get username and lobby from URL
const {username, lobby} = Qs.parse(location.search, {ignoreQueryPrefix: true});
const thisUsername = {username, lobby}.username;

// Join lobby
socket.emit('joinLobby', {username, lobby});

// Handle a failed Join Lobby attempt (Take the user back to the index page with a reason for failing entrance)
socket.on('failedEntrance', (reason) =>  {
  window.location.href="/index.html?reason=" + reason;
});

// This user is the first to join a lobby and will be given a 'begin game' button
socket.on('startGameButton', () =>  {
  beginGameBtn.style.display = "block";
});

//Reloads the page once play again button is closed which preserves the lobby and username
/*playAgain.onclick = function() {
  location.reload();
};*/

// Initial lobby and User/player info display
socket.on('initDisplayLobbyInfo', ({lobby, players}) => {
  countdown.innerHTML = "Waiting for more players...";
  footerMsg.innerHTML = "The game will begin when either the first player to have joined presses the start button or four players join the lobby.<br />";

  outputLobbyName(lobby);
  outputPlayers(players);
});

// Handle lobby player information
socket.on('lobbyPlayers', ({players}) => {
  outputPlayers(players);
});

// Add lobby name to page
function outputLobbyName(lobby) {
  lobbyName.innerText = "Lobby " + lobby;
}

// Display players
function outputPlayers(players){
  players.forEach(player => {
    let playerDisplay = document.getElementById('user' + player.playerRole);
    let p = document.createElement('p');
    let img = document.createElement('img');
    let name = document.createElement('span');
    let score = document.createElement('span');

    name.innerHTML = player.name;
    score.innerHTML = "Score: 0";

    if (thisUsername === player.name) {
      name.setAttribute('class', 'activePlayerName');
    }

    if(player.playerRole == 1)
      img.src = "red_ghost.png";
    else if(player.playerRole == 2)
      img.src = "blue_ghost.png";
    else if(player.playerRole == 3)
      img.src = "orange_ghost.png";
    else if(player.playerRole == 4)
      img.src = "pacman.png";

    playerDisplay.innerHTML = "";
    p.appendChild(img);
    p.appendChild(name);
    p.appendChild(score);
    playerDisplay.appendChild(p);
  });
}

function updateScores(players)  {
  players.forEach(player => {
      userList.children[player.playerRole - 1].children[0].children[2].innerHTML = "Score: " + player.score;
  });
}

// Initial drawing of gameBoard (Beginning of game)
socket.on('loadBoard',({players, gameBoard}) => {
  footerMsg.innerHTML = "Controls: Use the arrow keys to move your character.<br />";
  localBoard = gameBoard.slice(); // Save gameBoard to client side (walls are important here). This is going to be used to help reduce lag between
                                  // server and client because going forward we will only have the server send array updates
                                  // on non-stationary elements (everything except walls). This should reduce lag drastically - Christian
  drawGameBoard(players, localBoard);
  startCountDown();
});

// gameUpdates from server (i.e. player position change). This is constant
socket.on('gameUpdate', ({players, gameBoard}) => {
  for (var i = j = 0; i < localBoard.length && j < gameBoard.length; i++) {
    if (localBoard[i] != 1) { // if element in localBoard is not a wall update it
      localBoard[i] = gameBoard[j++];
    }
  }
  drawGameBoard(players, localBoard);
  updateScores(players);
});

function drawGameBoard(players, gameBoard){
  const board = document.querySelector('#game');
  const grid = [];

    board.innerHTML = '';
    // First set correct amount of columns based on Grid Size and Cell Size
    board.style.cssText = `grid-template-columns: repeat(${GRID_SIZE}, ${CELL_SIZE}px);`;
    var cells = 0;
    gameBoard.forEach((square) => {
      const div = document.createElement('div');
      div.style.cssText = `width: ${CELL_SIZE}px; height: ${CELL_SIZE}px;`;

      // First determine if we are creating a ghost cell. If we are, we want to see if it needs to be flashing or not.
      // We then create a div inside of our cell so that we can have a ghost seperate from the background element (the background could be light grey or black)
      if (SQUARE_LIST[square] == SQUARE_TYPE.GHOST1 || SQUARE_LIST[square] == SQUARE_TYPE.GHOST2 || SQUARE_LIST[square] == SQUARE_TYPE.GHOST3)  {
        var ghost = document.createElement('div');
        ghost.classList.add('square', SQUARE_LIST[square], 'ghost');
        players.forEach(player => {
          if (player.prevPosType == 8 && player.index == cells) div.classList.add('square', 'lair'); // Correctly set background color (this took forever to implement, but I got it done!)
          if (player.status == 1) ghost.classList.add('edible_ghost');
        });


        div.appendChild(ghost); // This allows for us to have the ghost seperate from the background (this is important for a clean appearance)
      }
      else {
        // Add class to current square (this is here because it is not the same for ghost cells)
        div.classList.add('square', SQUARE_LIST[square]);
        // Customize PacMan if that is the current square
        if (SQUARE_LIST[square] == SQUARE_TYPE.PACMAN)  { // customize pacman
          players.forEach(player => {
            if (player.playerRole == 4 && player.direction != 0) { // Pacman rotates depending on direction
              var rotation = 0;
              if (player.direction == -1) rotation = 180; // facing left
              else if (player.direction == 20) rotation = 90; // facing up
              else if (player.direction == -20) rotation = 270; // facing down
              div.style.transform = "rotate(" + rotation + "deg)";
            }
          });
        }
      }

      board.appendChild(div);
      grid.push(div);
      cells++;
    });
    // console.log(gameBoard); // Develoment purposes only. Delete this
}

function rotateDiv(position, degree){
  this.grid[position].style.transform = `rotate({deg}deg)`;
}

// Lobby Messages from Server
socket.on('lobbyMessage', ({user, username, message}) => {
  const p = document.createElement('p');
  const usernameSpan = document.createElement('span');
  const messageSpan = document.createElement('span');
  usernameSpan.innerText = username;
  if (socket.id == user.id)
    usernameSpan.setAttribute('class', 'activePlayerName');
  messageSpan.innerText = ': ' + message;
  p.appendChild(usernameSpan);
  p.appendChild(messageSpan);
  printChatMessage(p);
});

// Messages from Server
socket.on('message', message => {
  const p = document.createElement('p');
  p.innerText = message;
  printChatMessage(p);
});

function printChatMessage(p)  {
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight; // automatically scroll to bottom of chat messages
}

// gameOver from server
socket.on('gameOver', ({lobby, users, gameTime}) => {
  socket.emit('ackGameEnd', {id : socket.id});
  playerEnabled = -1; // Player movement disabled
  let ghostTotal = 0;
  let pacmanScore = 0;
  users.forEach((user) => {
    if (user.playerRole != 4)
      ghostTotal += user.score;
    else
      pacmanScore = user.score;
  });

    let img = document.createElement('img');
    img.setAttribute('class', 'characterGameOver')
  if(pacmanScore > ghostTotal) {
    img.src = "pacman.png";
    winnerText.innerHTML = "PacMan " + img.outerHTML;
  }
  else if (pacmanScore === ghostTotal)  {
    winnerText.innerHTML = "Draw";
  }
  else {
    img.src = "red_ghost.png";
    winnerText.innerHTML = "Ghosts " + img.outerHTML;
    img.src = "blue_ghost.png";
    winnerText.innerHTML += img.outerHTML;
    img.src = "orange_ghost.png";
    winnerText.innerHTML += img.outerHTML;
  }

  let playerInfo = document.createElement('div');
  playerInfo.setAttribute('id', 'playerInfo');
  let playerScore = document.createElement('div');
  playerScore.setAttribute('id', 'playerScore');
  users.forEach((user) => {
    let player = document.createElement('p');
    let score = document.createElement('p');

    switch (user.playerRole)  {
      case 1:
        img.src = "red_ghost.png";
        break;
      case 2:
        img.src = "blue_ghost.png";
        break;
      case 3:
        img.src = "orange_ghost.png";
        break;
      case 4:
        img.src = "pacman.png";
        break;
    }
    img.setAttribute('title', user.username);
    if (user.playerRole != 4) {
      player.style.backgroundColor = "#cfcfcf";
      score.style.backgroundColor = "#cfcfcf";
    }

    player.innerHTML += img.outerHTML + user.username + ": ";
    score.innerHTML = "<span class='score'>" + user.score + "</span>";
    playerInfo.appendChild(player);
    playerScore.appendChild(score);
  });
  // Create a Ghost Total score section at the bottom of the scoreboard
  let ghostTotalPlayer = document.createElement('p');
  ghostTotalPlayer.innerHTML = "Ghost Total";
  playerInfo.appendChild(ghostTotalPlayer);
  let ghostTotalScore = document.createElement('p');
  ghostTotalScore.innerHTML = "<span class='score'>" + ghostTotal + "</span>";
  playerScore.appendChild(ghostTotalScore);

  finalScoreboard.appendChild(playerInfo);
  finalScoreboard.appendChild(playerScore);

  // Hide user section and replace it with endgameboard
  userSection.style.display = "none";
  gameOver.style.display = "block";
  matchTime.innerText = gameTime + ' seconds';
});

// Send message
sendChat.addEventListener('click', (e) => {
  e.preventDefault();
  if (chatbox.value !== '') {
    socket.emit('lobbyMessage', {username: {username, lobby}.username, message: chatbox.value});
    chatbox.value = '';
    chatbox.focus();
  }
});

// Begin the game
beginGameBtn.addEventListener('click', (e) => {
  e.preventDefault();
  socket.emit('beginGame');
});

// Leave lobby
leaveLobby.addEventListener('click', (e) =>  {
  e.preventDefault();
  // TODO
});

// Send message if user hits 'enter' key
document.addEventListener('keydown', function(event)	{
	if(event.key == "Enter")	{
		sendChat.click();
	}
}, true);



function startCountDown(){
  // Start 5 second countdown to start game
  let countdown = document.getElementById('countdown');
  let second = 5;
  var interval = setInterval(function() {
    if(second > 0)
      countdown.innerHTML = "Match starting in: " + second;
    else if(second == 0)  {
      countdown.innerHTML = "GO!";
      playerEnabled = 1; // Enable player so that they can send direction update to server
    }
    else if (second == -10)  {
      countdown.style.visibility = "hidden";
      clearInterval(interval);
    }
    second--;
  }, 1000);
}

this.document.addEventListener('keydown', function(event) {
  if (!event.repeat)  { // event.repeat is true if user is holding down key (this causes issues with server)
    if(playerEnabled != -1){ // check to make sure that the game has started
      if (event.key == "ArrowLeft") {
        socket.emit('changeDirection', ('left'));
      }
      else if (event.key == "ArrowUp") {
        socket.emit('changeDirection', ('up'));
      }
      else if (event.key == "ArrowRight") {
        socket.emit('changeDirection', ('right'));
      }
      else if (event.key == "ArrowDown") {
        socket.emit('changeDirection', ('down'));
      }
    }
  }
}, true);

// Mobile input detection (swiping) taken from: // Swipe Detect function taken from: http://www.javascriptkit.com/javatutors/touchevents2.shtml
window.addEventListener('load', function(){
    var game = document.getElementById('game');
    swipedetect(game, function(swipedir){
        if (swipedir != 'none' && playerEnabled != -1) {
            socket.emit('changeDirection', (swipedir));
        }
    })
}, false);

function swipedetect(el, callback){

    var touchsurface = el,
    swipedir,
    startX,
    startY,
    distX,
    distY,
    threshold = 150, //required min distance traveled to be considered swipe
    restraint = 100, // maximum distance allowed at the same time in perpendicular direction
    allowedTime = 300, // maximum time allowed to travel that distance
    elapsedTime,
    startTime,
    handleswipe = callback || function(swipedir){}

    touchsurface.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0]
        swipedir = 'none'
        dist = 0
        startX = touchobj.pageX
        startY = touchobj.pageY
        startTime = new Date().getTime() // record time when finger first makes contact with surface
        e.preventDefault()
    }, false)

    touchsurface.addEventListener('touchmove', function(e){
        e.preventDefault() // prevent scrolling when inside DIV
    }, false)

    touchsurface.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0]
        distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
        distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
        elapsedTime = new Date().getTime() - startTime // get time elapsed
        if (elapsedTime <= allowedTime){ // first condition for awipe met
            if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
                swipedir = (distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
            }
            else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
                swipedir = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
            }
        }
        handleswipe(swipedir)
        e.preventDefault()
    }, false)
}
