const socket = new WebSocket(`ws://localhost:1337/V1?token=${getCookie('token')}`);


document.getElementById('update-profile-button').addEventListener('click', () => {
  const firstName = document.getElementById('update-form-first-name').value;
  const lastName = document.getElementById('update-form-last-name').value;

  if (firstName.length < 3 || lastName.length < 3) {
    alert('First name and last name must be at least 3 characters long.');
    return;
  }

  const updateProfileRequest = {
    request: "login",
    type: "updateProfile",
    userId: loginRequest.userId,
    firstName: firstName,
    lastName: lastName,
    fcm_token: "zxcvbnm"
  };
  console.log('updateProfileRequest:', updateProfileRequest);
  
  socket.send(JSON.stringify(updateProfileRequest));
});
document.addEventListener('DOMContentLoaded', () => {
  let token = getCookie('token');
  if (!token) {
    fetch('http://localhost:1337/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    })
      .then(response => response.json())
      .then(data => {
        document.cookie = `token=${data.token}; path=/`;
        token = data.token;
        window.location.reload();
      })
      .catch(error => console.error('Error fetching token:', error));
  }
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

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


let currentRoomId = null;

socket.onopen = () => {
  console.log('Connected to the WebSocket server');
  // socket.send(JSON.stringify(loginRequest));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
  console.log('Received: String ', JSON.stringify(message));

  switch (message.type) {
    case 'loginOrCreate':
      handleLoginOrCreate(message);
      break;
    case 'allUsers':
      handleAllUsers(message);
      break;
    case 'createRoom':
      handleCreateRoom(message);
      break;
    case 'message':
      handleMessage(message);
      break;
    case 'allRooms':
      handleAllRooms(message);
      break;
    case 'userModified':
      userModified(message);
      break;
    case 'roomsModified':
      handleRoomsModified(message);
      break;
    default:
      console.log('Unknown message type:', message.type);
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
    roomId: currentRoomId,
    room: currentRoomId,
    message: messageInput,
    receiver_id: "123456", // Update this with the actual receiver ID
    message_type: "TEXT",
    sender_id: loginRequest.userId,
    message_content: {}
  };
  socket.send(JSON.stringify(chatMessage));
  document.getElementById('message-input').value = '';
});

function addMessageToChat(message) {
  const messagesDiv = document.getElementById('messages');
  const newMessage = document.createElement('p');
  newMessage.textContent = message;
  messagesDiv.appendChild(newMessage);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Handles login or create response.
 * @param {Object} message - The message object.
 */
function handleLoginOrCreate(message) {
  if (message.statusCode === 200) {
    document.getElementById('login-form-wrapper').classList.add('d-none');
    document.getElementById('update-form-profile-wrapper').classList.remove('d-none');
    document.getElementById('contact-list-wrapper').classList.remove('d-none');
    console.log('Login Success:', message.data);

    document.getElementById('update-form-first-name').value = message.data.firstName;
    document.getElementById('update-form-last-name').value = message.data.lastName;

    // Fetching list of users
    const usersRequest = {
      request: "users",
      type: "allUsers"
    };
    socket.send(JSON.stringify(usersRequest));

    // Fetching list of rooms
    const roomRequest = {
      request: "room",
      type: "allRooms",
      userList: [loginRequest.userId]
    };
    socket.send(JSON.stringify(roomRequest));
  }
}

/**
 * Handles all users response.
 * @param {Object} message - The message object.
 */
function handleAllUsers(message) {
  if (message.statusCode === 200) {
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
      userItem.id = `user-item-${user.userId}`;
      if (user.is_online) {
        userItem.classList.add('bg-online');
      } else {
        userItem.classList.add('bg-offline');
      }
      
      const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.userName;
      userItem.textContent = `${displayName} (Online: ${user.is_online})`;
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
}

/**
 * Handles create room response.
 * @param {Object} message - The message object.
 */
function handleCreateRoom(message) {
  if (message.statusCode === 200) {
    currentRoomId = message.data.newRoom._id;
    const roomListDiv = document.getElementById('room-list');
    addRoomToList(message.data, roomListDiv);
  }
}

/**
 * Handles message response.
 * @param {Object} message - The message object.
 */
function handleMessage(message) {
  if (message.statusCode === 200) {
    message.data.forEach(msg => {
      if (msg.roomId !== currentRoomId) return;
      console.log("Message received:", msg);
      if (msg.message_type === "TEXT") {
        const prefix = msg.sender_id === loginRequest.userId ? 'You: ' : '';
        addMessageToChat(`${prefix}${msg.message}`);
      }
    });
  } else if (message.statusCode === 201) {
    const newMessage = message.data;
    if (newMessage.roomId !== currentRoomId) return;
    console.log("New message:", newMessage);
    if (newMessage.message_type === "TEXT") {
      const prefix = newMessage.sender_id === loginRequest.userId ? 'You: ' : '';
      addMessageToChat(`${prefix}${newMessage.message}`);
    }
  }
}

/**
 * Handles all rooms response.
 * @param {Object} message - The message object.
 */
function handleAllRooms(message) {
  if (message.statusCode === 200) {
    console.log('Room list:', message.data);
    const roomListDiv = document.getElementById('room-list');
    roomListDiv.innerHTML = ''; // Clear existing list

    message.data.roomList.forEach(room => {
      addRoomToList(room, roomListDiv);
    });
  }
}

function addRoomToList(room, roomListDiv) {
  console.log("room::: ", room);
  const roomItem = document.createElement('div');
  roomItem.classList.add('list-group-item', 'list-group-item-action');

  if (room.type === "individual") {
    const otherUser = room.userList.find(userId => userId != loginRequest.userId);
    const otherUserName = users.find(user => user.userId == otherUser)?.userName || 'Unknown User';
    roomItem.textContent = `Chat with: ${otherUserName}`;
  } else {
    roomItem.textContent = `Room ID: ${room._id}`;
  }
  roomItem.innerHTML += `<br>Last Message: ${room.last_message || 'No messages yet'}`;
  roomItem.innerHTML += `<br>Last Message Time: ${new Date(room.last_message_time).toLocaleString()}`;
  roomItem.innerHTML += `<br>Created At: ${new Date(room.create_time).toLocaleString()}`;
  roomItem.id = `room-item-${room._id}`;
  roomItem.addEventListener('click', () => {
    document.getElementById('chat-wrapper').classList.remove('d-none');
    document.getElementById('messages').innerHTML = '';
    console.log(`Room clicked: `, room);
    currentRoomId = room._id;

    const messageRequest = {
      request: "message",
      type: "allMessage",
      room: room._id
    };
    console.log(`messageRequest: `, messageRequest);
    socket.send(JSON.stringify(messageRequest));
  });
  roomListDiv.appendChild(roomItem);
}


function handleRoomsModified(message) {
  if (message.statusCode === 200) {
    console.log('Room modified:', message.data);
    const roomItem = document.getElementById(`room-item-${message.data._id}`);
    if (roomItem) {
      roomItem.innerHTML = ''; // Clear existing list

      if (message.data.type === "individual") {
        const otherUser = message.data.userList.find(userId => userId !== loginRequest.userId);
        const otherUserName = users.find(user => user.userId === otherUser)?.userName || 'Unknown User';
        roomItem.textContent = `Chat with: ${otherUserName}`;
      } else {
        roomItem.textContent = `Room ID: ${message.data._id}`;
      }
      roomItem.innerHTML += `<br>Last Message: ${message.data.last_message || 'No messages yet'}`;
      roomItem.innerHTML += `<br>Last Message Time: ${new Date(message.data.last_message_time).toLocaleString()}`;
      roomItem.innerHTML += `<br>Created At: ${new Date(message.data.create_time).toLocaleString()}`;
    }
  }
}


/**
 * Handles all rooms response.
 * @param {Object} message - The message object.
 */
function userModified(message) {
  if (message.statusCode === 200) {
    console.log('User modified:', message.data);

    const userDiv = document.getElementById(`user-item-${message.data.userId}`);

    if (userDiv) {
      if (message.data.is_online) {
        userDiv.classList.add('bg-online');
        userDiv.classList.remove('bg-offline');
      } else {
        userDiv.classList.add('bg-offline');
        userDiv.classList.remove('bg-online');
      }
    }
  }
}
