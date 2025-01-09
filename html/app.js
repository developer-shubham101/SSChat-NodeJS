const socket = new WebSocket('ws://localhost:1337/V1');

const users = [
  { userId: "1", userName: "alice@example.com", password: "password1" },
  { userId: "2", userName: "bob@example.com", password: "password2" },
  { userId: "3", userName: "charlie@example.com", password: "password3" },
  { userId: "4", userName: "david@example.com", password: "password4" },
  { userId: "5", userName: "eve@example.com", password: "password5" },
  { userId: "6", userName: "frank@example.com", password: "password6" },
  { userId: "7", userName: "grace@example.com", password: "password7" },
  { userId: "8", userName: "heidi@example.com", password: "password8" },
  { userId: "9", userName: "ivan@example.com", password: "password9" },
  { userId: "10", userName: "judy@example.com", password: "password10" }
];

// Sending login request
let loginRequest = {
  request: "login",
  type: "loginOrCreate",
  userId: "5",
  fcm_token: "zxcvbnm",
  password: "abcdef",
  userName: "john.doe@example.com"
};

document.getElementById('user-select').addEventListener('change', (event) => {
  const selectedUserId = event.target.value;
  const selectedUser = users.find(user => user.userId === selectedUserId);
  if (selectedUser) {
    loginRequest.userName = selectedUser.userName;
    loginRequest.password = selectedUser.password;
    loginRequest.userId = selectedUser.userId;
    socket.send(JSON.stringify(loginRequest));
  }
});


let currentRoom = null;

socket.onopen = () => {
  console.log('Connected to the WebSocket server');
  // socket.send(JSON.stringify(loginRequest));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
  console.log('Received: String ', JSON.stringify(message));
  if (message.type === 'loginOrCreate' && message.statusCode === 200) {

    document.getElementById('login-form-wrapper').style.display = 'none';
    console.log('Login Success:', message.data);

    // Fetching list of users
    const usersRequest = {
      request: "users",
      type: "allUsers"
    };
    socket.send(JSON.stringify(usersRequest));


    // Fetching list of rooms
    const roomRequest = {
      "request": "room",
      "type": "allRooms",
      "userList": [loginRequest.userId]
    };

    socket.send(JSON.stringify(roomRequest));

  }

  if (message.type === 'allUsers' && message.statusCode === 200) {
    console.log('User list:', message.data);

    const userListDiv = document.getElementById('user-list');
    userListDiv.innerHTML = ''; // Clear existing list

    message.data.forEach(user => {
      console.log("user::: ", user);
      if (user.userId == loginRequest.userId) {
        return;
      }

      const userItem = document.createElement('div');
      userItem.classList.add('user-item');
      userItem.textContent = `${user.userName} (Online: ${user.is_online})`;
      userItem.addEventListener('click', () => {
        console.log(`User clicked: `, user);
        const createRoomRequest = {
          request: "room",
          type: "createRoom",
          userList: [loginRequest.userId, user.userId],
          createBy: user.userId,
          room_type: "individual"
        };
        socket.send(JSON.stringify(createRoomRequest));
      });
      userListDiv.appendChild(userItem);
    });
  }

  if (message.type === 'createRoom' && message.statusCode === 200) {
    currentRoom = message.data.newRoom._id;
  }

  if (message.type === 'message' && message.statusCode === 200) {
    message.data.forEach(message => {
      console.log("message::: ", message);
      if (message.message_type == "TEXT") {
        addMessageToChat(`You: ${message.message}`);
      }
    });
  }
  if (message.type === 'message' && message.statusCode === 201) {
    const messageData = message.data;
    console.log("message::: ", messageData);
    if (messageData.message_type == "TEXT") {
      addMessageToChat(`You: ${messageData.message}`);
    }

  }

  if (message.type === 'allRooms' && message.statusCode === 200) {
    console.log('Room list:', message.data);
    const roomListDiv = document.getElementById('room-list');
    roomListDiv.innerHTML = ''; // Clear existing list

    message.data.roomList.forEach(room => {
      console.log("room::: ", room);
      const roomItem = document.createElement('div');
      roomItem.classList.add('list-group-item', 'list-group-item-action');
      roomItem.textContent = `Room ID: ${room._id}`;
      roomItem.addEventListener('click', () => {
        console.log(`Room clicked: `, room);
        currentRoom = room._id;

        const messageRequest = {
          request: "message",
          type: "allMessage",
          room: room._id
        };
        console.log(`messageRequest: `, messageRequest);
        socket.send(JSON.stringify(messageRequest));
      });
      roomListDiv.appendChild(roomItem);
    });
  }
};

socket.onerror = (error) => {
  console.log('WebSocket Error:', error);
};

socket.onclose = () => {
  console.log('WebSocket connection closed');
};

document.getElementById('send-button').addEventListener('click', () => {
  const messageInput = document.getElementById('message-input').value;
  const chatMessage = {
    request: "message",
    type: "addMessage",
    roomId: currentRoom,
    room: currentRoom,
    message: messageInput,
    receiver_id: "123456", // Update this with the actual receiver ID
    message_type: "TEXT",
    sender_id: loginRequest.userId,
    message_content: {}
  };
  socket.send(JSON.stringify(chatMessage));
  document.getElementById('message-input').value = '';
  addMessageToChat(`You: ${messageInput}`);
});

function addMessageToChat(message) {
  const messagesDiv = document.getElementById('messages');
  const newMessage = document.createElement('p');
  newMessage.textContent = message;
  messagesDiv.appendChild(newMessage);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
