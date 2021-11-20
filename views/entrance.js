
const socket = io();
const lobbyList = document.getElementById('lobbyList');
const lobbyListFooter = document.getElementById('lobbyListFooter');
const entranceForm = document.getElementById('entranceForm');
const entranceFormUsernameField = document.getElementById('username_entrance');
const entranceFormLobbyField = document.getElementById('gamelobby_entrance');
const feedback = document.getElementById('entranceFailureFeedback');

const {reason} = Qs.parse(location.search, {ignoreQueryPrefix: true});


socket.emit('retrieveLobbies');

/*Retrieve a list of all the available lobbies (WS rooms)*/
socket.on('lobbyList', (lobbies) => {
  lobbyList.innerHTML = "";
  // Source for original room filtration: https://stackoverflow.com/a/62430453/10475867
    var realLobbies = Object.keys(lobbies).reduce((filtered, key) => {
    if(!lobbies[key].sockets.hasOwnProperty(key)) {
      let p = document.createElement('p');
      p.setAttribute('id', 'lobby-name-' + key);

      if (lobbies[key].length == 4) {
        p.innerHTML = `<span class="grey not-allowed-cursor">${key}</span><span class="grey float-right">4/4 players</span>`;
      }
      else {
        p.innerHTML = `<span class="enabled pointer-cursor" onclick="joinLobbyFromList('${key}');">${key}</span><span class="grey float-right">${lobbies[key].length}/4 players</span>`;
      }

      lobbyList.appendChild(p);
      filtered.push(key);
    }
    return filtered;
  }, []);

  if (realLobbies.length == 0)  {
    lobbyList.innerHTML += '<p class="grey">No active lobbies</p>';
    lobbyListFooter.innerText = '';
  }
  else lobbyListFooter.innerText = "Click a lobby's name to join";
});

// This function is called when a user clicks on a Lobby from the lobby list. The lobby field is automatically filled out and the form is submitted
function joinLobbyFromList(lobbyName) {
  entranceFormLobbyField.value = lobbyName;
  document.getElementById('submitBtn').click(); // Click the "join lobby" button to check the fields and attempt joining the lobby
}

function failureFeedback()  {
  if (reason != undefined)  {
    if (reason == 'duplicateName') {
      feedback.innerHTML = '<h5>Error</h5><p>Another user already has your username.<br />Try joining with another username.</p>';
    }
    else if (reason == 'fullLobby') {
      feedback.innerHTML = '<h5>Error</h5><p>Game lobby is full.<br />Join another game lobby or wait until a player leaves.</p>';
    }
    else feedback.innerHTML = '<h5>Error</h5><p>There was an issue joining the game lobby.<br />Please try again</p>';
  }
}
