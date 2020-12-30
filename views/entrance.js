
const socket = io();
const lobbyList = document.getElementById('lobbyList');
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
      // If the text below is changed it may mess up the checkEntrance function below. If you alter this, be sure to change the character position that is checked in checkEntrance()
      p.innerHTML = "<span class='pointer-cursor' onclick=\"joinLobbyFromList(" + key + ");\">" + key + "</span> <span class=\"float-right\">(" + lobbies[key].length + "/" + 4 + " players)</span>";
      lobbyList.appendChild(p);
      filtered.push(key);
    }
    return filtered;
  }, []);

  if (realLobbies.length == 0)
    lobbyList.innerHTML += "<p>No active lobbies</p>";
});

// This function is called when a user clicks on a Lobby from the lobby list. The lobby field is automatically filled out and the form is submitted
function joinLobbyFromList(lobbyName) {
  entranceFormLobbyField.value = lobbyName;
  document.getElementById('submitBtn').click(); // Click the "join lobby" button to check the fields and attempt joining the lobby
}

// Check the validity (length) of the username and lobby name.
// Returns true if valid, false otherwise.
function checkEntrance()  {
  const username = entranceFormUsernameField.value;
  const lobby = entranceFormLobbyField.value;
  const lobbyExisting = document.getElementById('lobby-name-' + lobby);

  if (username.length > 20 || lobby.length > 20)  {
    feedback.innerHTML = "<p><span class='bold'>Note</span>: Usernames and lobby names can not be longer than 20 characters.</p>";
    return false;
  }
  else if (lobbyExisting != null && lobbyExisting.innerText.charAt(lobbyExisting.length - 12) == 4) {
    feedback.innerHTML = "<p><span class='bold'>Note</span>: Game lobby " + lobby + " is full.</p>";
    return true; // TO DO: CHANGE THIS TO FALSE
  }
  else return true;
}

function failureFeedback()  {
  if ({reason}.reason != undefined)  {
    if ({reason}.reason == "duplicateName") {
      feedback.innerHTML = "<p><span class='bold'>Note</span>: Another user already has your username.<br />Try joining with another username.</p>";
    }
    else if ({reason}.reason == "fullLobby") {
      feedback.innerHTML = "<p><span class='bold'>Note</span>: Game lobby is full.<br />Join another game lobby or wait until a player leaves.</p>";
    }
    else feedback.innerHTML = "<p><span class='bold'>Note</span>: Error joining game lobby.<br />Please try again</p>";
  }
}
