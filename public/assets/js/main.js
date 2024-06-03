function getIRIParameterValue(requestedKey) {
    let pageIRI = window.location.search.substring(1);
    let pageIRIVariables = pageIRI.split('&');
    for (let i = 0; i < pageIRIVariables.length; i++) {
        let data = pageIRIVariables[i].split('=');
        let key = data[0];
        let value = data[1];
        if (key === requestedKey) {
            return value;
        }
    }
    return null;
}

let username = decodeURI(getIRIParameterValue('username'));
if ((typeof username == 'undefined') || (username === null) || (username === "") || (username == "null")) {
    username = "Anonymous_" + Math.floor(Math.random() * 1000);
}

// $('#messages').prepend('<b>' + username + ':</b>'); 

let chatRoom = decodeURI(getIRIParameterValue('game_id'));
if ((typeof chatRoom == 'undefined') || (chatRoom === null) || (chatRoom === "") || (chatRoom == "null")) {
    chatRoom = "Lobby";
}

// Set up the socket.io connect to the server
let socket = io();
socket.on('connect', function () {
    console.log('Connected to server');
});
socket.on('log', function (array) {
    console.log.apply(console, array);
});

function makeInviteButton(socket_id) {
    let newHTML = "<button type='button' class='btn btn-outline-primary'>Invite</button>";
    let newNode = $(newHTML);
    newNode.click(() => {
        let payload = {
            requested_user: socket_id
        }
        console.log('**** Client Log Message, sending \'invite\'command: ' + JSON.stringify(payload));
        socket.emit('invite', payload);
    }
    );
    return newNode;
}

function makeInvitedButton(socket_id) {
    let newHTML = "<button type='button' class='btn btn-primary'>Invited</button>";
    let newNode = $(newHTML);
    newNode.click(() => {
        let payload = {
            requested_user: socket_id
        }
        console.log('**** Client Log Message, sending \'uninvite\'command: ' + JSON.stringify(payload));
        socket.emit('uninvite', payload);
    }
    );
    return newNode;
}

function makePlayButton(socket_id) {
    let newHTML = "<button type='button' class='btn btn-success'>Play</button>";
    let newNode = $(newHTML);
    newNode.click(() => {
        let payload = {
            requested_user: socket_id
        }
        console.log('**** Client Log Message, sending \'game_start\'command: ' + JSON.stringify(payload));
        socket.emit('game_start', payload);
    }
    );
    return newNode;
}

function makeStartGameButton() {
    let newHTML = "<button type='button' class='btn btn-danger'>Starting Game</button>";
    let newNode = $(newHTML);
    return newNode;
}

socket.on('invite_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let newNode = makeInvitedButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

socket.on('invited', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let newNode = makePlayButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

socket.on('uninvited', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let newNode = makeInviteButton(payload.socket_id);
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
});

socket.on('game_start_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let newNode = makeStartGameButton();
    $('.socket_' + payload.socket_id + ' button').replaceWith(newNode);
    // Jump to the game page
    window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});

socket.on('join_room_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    // If we are being notified of ourselves then ignore the message and return 
    if (payload.socket_id == socket.id) {
        return;
    }

    let domElements = $('.socket_' + payload.socket_id);
    //If we are being repeat notified then return
    if (domElements.length !== 0) {
        return;
    }

    /*
        <div class="row align-items-center">
            <div class="col text-end">
                Don
            </div>
            <div class="col text-end">
                <button type="button" class="btn btn-primary">Invite</button>
            </div>
        </div>
    */

    let nodeA = $("<div></div>");
    nodeA.addClass("row");
    nodeA.addClass("align-items-center");
    nodeA.addClass("socket_" + payload.socket_id);
    nodeA.hide();

    let nodeB = $("<div></div>");
    nodeB.addClass("col");
    nodeB.addClass("text-end");
    nodeB.addClass("socket_" + payload.socket_id);
    nodeB.append("<h4>" + payload.username + "</h4>");

    let nodeC = $("<div></div>");
    nodeC.addClass("col");
    nodeC.addClass("text-start");
    nodeC.addClass("socket_" + payload.socket_id);
    let buttonC = makeInviteButton(payload.socket_id);
    nodeC.append(buttonC);

    nodeA.append(nodeB);
    nodeA.append(nodeC);

    $("#players").append(nodeA);
    nodeA.show("fade", 1000);

    // announcing in the chat that someone has arrived 
    let newHTML = '<p class=\'join_room_response\'>' + payload.username + ' joined the chatroom. (There are ' + payload.count + ' users in the room)</p>';

    let newNode = $(newHTML);
    newNode.hide();

    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
});

socket.on('player_disconnected', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.socket_id === socket.id) {
        return;
    }

    let domElements = $('.socket_' + payload.socket_id);
    //If we are being repeat notified then return
    if (domElements.length !== 0) {
        domElements.hide("fade", 500);
    }

    let newHTML = '<p class=\'left_room_response\'>' + payload.username + ' left the ' + payload.room + '. (There are ' + payload.count + ' users in the room)</p>';

    let newNode = $(newHTML);
    newNode.hide();

    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
});

function sendChatMessage() {
    let request = {};
    request.room = chatRoom;
    request.username = username;
    request.message = $('#chatMessage').val();
    console.log('**** Client Log Message, sending \'send_chat_message\'command: ' + JSON.stringify(request));
    socket.emit('send_chat_message', request);
    $("#chatMessage").val("");
}

socket.on('send_chat_message_response', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let newHTML = '<p class=\'chat_message\'><b>' + payload.username + '</b>: ' + payload.message + '</p>';
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
});

let old_board = [
    ['?', '?', '?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?', '?', '?']
];

let my_color = "";

socket.on('game_update', (payload) => {
    if ((typeof payload == 'undefined') || (payload === null)) {
        console.log('Server did not send a payload.');
        return;
    }

    if (payload.result === 'fail') {
        console.log(payload.message);
        return;
    }

    let board = payload.game.board;
    if((typeof board === 'undefined') || (board === null)){
        console.log("Server did not send valid board to display.");
        return;
    }

    // Update my color
    if(socket.id === payload.game.player_white.socket){
        my_color = 'white';
    } else if (socket.id === payload.game.player_black.socket) {
        my_color = 'black';
    } else {
        window.location.href = 'lobby.html?username=' + username;
        return;
    }

    $("#my_color").html('<h3 id="my_color">I am ' + my_color + '</h3>');

    // Animate all the changes to the board
    for(let row = 0; row < 8; row++){
        for (let column = 0; column < 8; column++){
            // check to see if server changed any spaces on the board
            if(old_board[row][column] !== board[row][column]){
                let graphic = "";
                let alt = "";
                if ((old_board[row][column] === '?') && (board[row][column] === ' ')){
                    graphic = "empty.gif";
                    alt = "empty space";
                } else if ((old_board[row][column] === '?') && (board[row][column] === 'w')) {
                    graphic = "empty_to_gold.gif";
                    alt = "gold token";
                } else if ((old_board[row][column] === '?') && (board[row][column] === 'b')) {
                    graphic = "empty_to_green.gif";
                    alt = "green token";
                } else if ((old_board[row][column] === ' ') && (board[row][column] === 'w')) {
                    graphic = "empty_to_gold.gif";
                    alt = "gold token";
                } else if ((old_board[row][column] === ' ') && (board[row][column] === 'b')) {
                    graphic = "empty_to_green.gif";
                    alt = "green token";
                } else if ((old_board[row][column] === 'w') && (board[row][column] === ' ')) {
                    graphic = "gold_to_empty.gif";
                    alt = "empty space";
                } else if ((old_board[row][column] === 'b') && (board[row][column] === ' ')) {
                    graphic = "green_to_empty.gif";
                    alt = "empty space";
                } else if ((old_board[row][column] === 'w') && (board[row][column] === 'b')) {
                    graphic = "gold_to_green.gif";
                    alt = "green token";
                } else if ((old_board[row][column] === 'b') && (board[row][column] === 'w')) {
                    graphic = "green_to_gold.gif";
                    alt = "gold token";
                } else {
                    graphic = "error.gif";
                    alt = "error";
                    console.log("Encountered error loading graphics.")
                }

                const t = Date.now();
                $('#' + row + '_' + column).html('<img class="img-fluid" src="assets/images/' + graphic + '?time=' + t + '" alt="' + alt + '" />');

                $('#' + row + '_' + column).off('click');
                if(board[row][column] === ' '){
                    $('#' + row + '_' + column).addClass('hovered_over');
                } else {
                    console.log("**Error with hover!!!**")
                }
            }
        }
    }

    old_board = board;

});

// request to join the chat room
$(() => {
    let request = {};
    request.room = chatRoom;
    request.username = username;
    console.log('**** Client Log Message, sending \'join_room\'command: ' + JSON.stringify(request));
    socket.emit('join_room', request);

    $("#lobbyTitle").html(username + "'s Lobby");

    $("#chatMessage").keypress(function (e) {
        let key = e.which;
        if (key == 13) { //enter key
            $("button[id = chatButton]").click();
            return false;
        }
    });

});

