/*Connect to the server (via websocket) and retrieve a list of all the available lobbies (WS rooms)*/
const socket = io();
const lobbyList = document.getElementById('lobbyList');
const entranceForm = document.getElementById('entranceForm');
const entranceFormLobbyField = document.getElementById('gamelobby_entrance');

socket.emit('retrieveLobbies');

socket.on('lobbyList', (lobbies) => {
  lobbyList.innerHTML = "";
  // Source for original room filtration: https://stackoverflow.com/a/62430453/10475867
  var realLobbies = Object.keys(lobbies).reduce((filtered, key) => {
    if(!lobbies[key].sockets.hasOwnProperty(key)) {
      let p = document.createElement('p');
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
