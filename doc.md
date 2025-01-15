Here is a document based on the details you provided:

---

### WebSocket API Documentation

**WebSocket URL:** `ws://localhost:1337/V1`

#### Login/Register Request

**Request:**
```json
{
  "request": "login",
  "type": "loginOrCreate",
  "userId": "5",
  "fcm_token": "new_fcm_token",
  "password": "new_password",
  "userName": "john.doe@example.com"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Login Success",
  "data": {
    "_id": "677c1948e157f73ee0959a28",
    "userName": "john.doe@example.com",
    "password": "new_password",
    "userId": 5,
    "fcm_token": "new_fcm_token",
    "is_online": true,
    "last_seen": "2025-01-07T17:14:49.703Z",
    "__v": 0
  },
  "type": "loginOrCreate"
}
```

#### List of Users

**Request:**
```json
{
  "request": "users",
  "type": "allUsers"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "User list.",
  "data": [
    {
      "_id": "677c16d591462c213cacce6b",
      "userName": "ali@yopmail.com",
      "password": "new_password",
      "userId": 4,
      "fcm_token": "new_fcm_token",
      "is_online": true,
      "last_seen": "2025-01-06T17:48:33.097Z",
      "__v": 0
    },
    {
      "_id": "677c1948e157f73ee0959a28",
      "userName": "john.doe@example.com",
      "password": "new_password",
      "userId": 5,
      "fcm_token": "new_fcm_token",
      "is_online": true,
      "last_seen": "2025-01-07T17:14:49.703Z",
      "__v": 0
    }
  ],
  "type": "allUsers"
}
```

#### Create New Room

**Request:**
```json
{
  "request": "room",
  "type": "createRoom",
  "userList": [
    "677c16d591462c213cacce6b",
    "677c1948e157f73ee0959a28"
  ],
  "createBy": "677c16d591462c213cacce6b",
  "room_type": "group|individual",
  "groupDetails": {
    "group_name": "group chat"
  }
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "New Room Created",
  "data": {
    "newRoom": {
      "userList": [
        "5",
        4
      ],
      "_id": "677d6a2a2d1aaf21b845f81e",
      "users": {
        "4": true,
        "5": true
      },
      "type": "individual",
      "last_message_time": "2025-01-07T17:53:46.850Z",
      "create_time": "2025-01-07T17:53:46.850Z",
      "createBy": "4",
      "__v": 0
    },
    "userList": [
      {
        "_id": "677c16d591462c213cacce6b",
        "userName": "ali@yopmail.com",
        "password": "new_password",
        "userId": 4,
        "fcm_token": "new_fcm_token",
        "device_id": "",
        "is_online": true,
        "last_seen": "2025-01-06T17:48:33.097Z",
        "firstName": "",
        "profile_pic": "",
        "__v": 0
      },
      {
        "_id": "677c1948e157f73ee0959a28",
        "userName": "john.doe@example.com",
        "password": "new_password",
        "userId": 5,
        "fcm_token": "new_fcm_token",
        "device_id": "",
        "is_online": true,
        "last_seen": "2025-01-07T18:05:05.577Z",
        "firstName": "",
        "profile_pic": "",
        "__v": 0
      }
    ]
  },
  "type": "createRoom"
}
```

#### List All Rooms

**Request:**
```json
{
  "request": "rooms",
  "type": "allRooms",
  "userList": [
    "677c16d591462c213cacce6b"
  ]
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Data Found",
  "data": {
    "roomList": [
      {
        "userList": [
          "5",
          4
        ],
        "_id": "677d6a2a2d1aaf21b845f81e",
        "users": {
          "4": true,
          "5": true
        },
        "type": "individual",
        "last_message_time": "2025-01-07T17:53:46.850Z",
        "create_time": "2025-01-07T17:53:46.850Z",
        "createBy": "4",
        "__v": 0
      }
    ],
    "userList": [
      {
        "_id": "677c16d591462c213cacce6b",
        "userName": "ali@yopmail.com",
        "password": "new_password",
        "userId": 4,
        "fcm_token": "new_fcm_token",
        "device_id": "",
        "is_online": true,
        "last_seen": "2025-01-06T17:48:33.097Z",
        "firstName": "",
        "profile_pic": "",
        "__v": 0
      },
      {
        "_id": "677c1948e157f73ee0959a28",
        "userName": "john.doe@example.com",
        "password": "new_password",
        "userId": 5,
        "fcm_token": "new_fcm_token",
        "device_id": "",
        "is_online": true,
        "last_seen": "2025-01-07T18:11:56.265Z",
        "firstName": "",
        "profile_pic": "",
        "__v": 0
      }
    ]
  },
  "type": "allRooms"
}
```

#### Add New Message

**Request:**
```json
{
  "roomId": "608437be5c7a813378e455b5",
  "room": "608437be5c7a813378e455b5",
  "message": "Hello World",
  "receiver_id": "123456",
  "message_type": "TEXT",
  "sender_id": "4",
  "message_content": {},
  "request": "message",
  "type": "addMessage"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Modified",
  "data": {
    "userList": [
      "5",
      4
    ],
    "_id": "677d6a2a2d1aaf21b845f81e",
    "users": {
      "4": true,
      "5": true
    },
    "type": "individual",
    "last_message_time": "2025-01-07T18:26:55.203Z",
    "create_time": "2025-01-07T17:53:46.850Z",
    "createBy": "4",
    "__v": 0,
    "last_message": "Hello World",
    "unread": {
      "4": 2,
      "5": 0
    }
  },
  "type": "roomsModified"
}
```

#### Get All Messages

**Request:**
```json
{
  "request": "message",
  "type": "allMessage",
  "room": "room1"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "message All list",
  "data": [
    {
      "_id": "677e050cbc0b563c3407df2f",
      "roomId": "677d6a2a2d1aaf21b845f81e",
      "message": "test",
      "message_type": "TEXT",
      "media": "",
      "receiver_id": "123456",
      "time": "2025-01-08T04:54:36.368Z",
      "sender_id": "5",
      "__v": 0,
      "timestamp": 1736312076368
    }
  ],
  "type": "message"
}
```

#### Update Message

**Request:**
```json
{
  "room": "608437be5c7a813378e455b5",
  "messageId": "60845847bf1e5b470dba2ccb",
  "message_content": {
    "key": "value",
    "key2": "value2"
  },
  "request": "message",
  "type": "updateMessage",
  "message": "updated message"
}
```

#### Update User Details

**Request:**
```json
{
  "request": "login",
  "type": "updateProfile",
  "firstName": "John",
  "lastName": "Doe",
  "profile_pic": "https://example.com/profile.jpg",
  "email": "john.doe@example.com",
  "fcm_token": "randomToken123",
  "device_id": "deviceId456"
}
```

#### User Status Change Notification

**Notification:**
```json
{
  "statusCode": 200,
  "message": "Online/Offline Status Changed",
  "data": {
    "_id": "678009e966cb9a0d406888ac",
    "userName": "bob@example.com",
    "password": "password2",
    "userId": 2,
    "fcm_token": "zxcvbnm",
    "is_online": true,
    "last_seen": "2025-01-10T17:18:00.408Z",
    "__v": 0
  },
  "type": "userModified"
}
```

#### Block User

**Request:**
```json
{
  "request": "block_user",
  "type": "blockUser",
  "blockedBy": "3",
  "blockedTo": "4",
  "isBlock": true
}
```

#### List of Blocked Users

**Request:**
```json
{
  "request": "block_user",
  "type": "allBlockUser",
  "user": "3"
}
```