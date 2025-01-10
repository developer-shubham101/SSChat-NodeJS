const mongoose = require('mongoose');
const { UsersModel, RoomModel } = require('../model');
const { responseSuccess, responseError, isFine } = require('../utility');
const Validator = require('validatorjs'); 
const { sendMessageToUser } = require('../connections');

/**
 * Creates a new room and notifies users.
 * @param {Object} roomData - The room data to be saved.
 * @param {Object} connection - The WebSocket connection object.
 */
const createNewRoom = (roomData, connection) => {
  let room = new RoomModel(roomData);

  room.save().then((savedRoom) => {
    if (savedRoom) {
      notifyNewRoom(savedRoom);
    } else {
      connection.sendUTF(responseError(500, "createRoom", "Failed to create room", true));
    }
  }).catch((error) => {
    console.error("Room failed to save.", error);
    connection.sendUTF(responseError(500, "createRoom", "Failed to create room", true));
  });
};

/**
 * Notifies users about the new room.
 * @param {Object} savedRoom - The saved room object.
 */
const notifyNewRoom = (savedRoom) => {
  let query = { userId: { $in: savedRoom.userList } };

  UsersModel.find(query, (err, users) => {
    if (err) {
      console.error("Error finding users for notification.", err);
      return;
    }

    users = users.map(user => ({
      "_id": "",
      "userName": "",
      "password": "",
      "userId": 0,
      "fcm_token": "",
      "device_id": "",
      "is_online": false,
      "last_seen": "",
      "firstName": "",
      "profile_pic": "",
      ...JSON.parse(JSON.stringify(user))
    }));

    let responseData = { newRoom: savedRoom, userList: users };
    savedRoom.userList.forEach(userId => {
      sendMessageToUser(userId, responseSuccess(200, "createRoom", responseData, "New Room Created", true));
    });
  });
};

/**
 * Handles room-related requests.
 * @param {Object} requestData - The request data.
 * @param {Object} connection - The WebSocket connection object.
 */
async function roomRequest(requestData, connection) {
  if (requestData.type === 'roomsDetails') {
    if (!requestData.roomId) {
      connection.sendUTF(responseError(400, "roomsDetails", "Please enter room id", true));
      return;
    }

    let roomId = requestData.roomId;

    try {
      let rooms = await RoomModel.find({ _id: mongoose.Types.ObjectId(roomId) }).exec();

      if (rooms && rooms.length > 0) {
        let usersList = rooms.reduce((acc, room) => acc.concat(Object.keys(room.users)), []);
        usersList = [...new Set(usersList)];

        let query = { userId: { $in: usersList } };
        let users = await UsersModel.find(query).exec();

        users = users.map(user => ({
          "_id": "",
          "userName": "",
          "password": "",
          "userId": 0,
          "fcm_token": "",
          "device_id": "",
          "is_online": false,
          "last_seen": "",
          "firstName": "",
          "profile_pic": "",
          ...JSON.parse(JSON.stringify(user))
        }));

        let responseData = { roomList: rooms, userList: users };
        connection.sendUTF(responseSuccess(200, "roomsDetails", responseData, "Data Found", true));
      } else {
        connection.sendUTF(responseError(404, "roomsDetails", "Not Found", true));
      }
    } catch (err) {
      console.error(`Error fetching room details for roomId: ${roomId}`, err);
      connection.sendUTF(responseError(500, "roomsDetails", "Internal Server Error", true));
    }
  } else if (requestData.type === 'allRooms') {
    let rules = {
      userList: 'required|array|min:1'
    };

    let validation = new Validator(requestData, rules);

    if (validation.fails()) {
      connection.sendUTF(responseError(400, "allRooms", validation.errors, true));
    } else {
      let userList = requestData.userList.map((userId) => `${userId}`);
      let query = {};

      userList.forEach(userId => {
        query[`users.${userId}`] = true;
      });

      RoomModel.find(query).sort({ last_message_time: -1 }).exec((err, rooms) => {
        if (rooms && rooms.length > 0) {
          let usersList = rooms.reduce((acc, room) => acc.concat(Object.keys(room.users)), []);
          usersList = [...new Set(usersList)];

          let userQuery = { userId: { $in: usersList } };
          UsersModel.find(userQuery, (err, users) => {
            if (err) {
              connection.sendUTF(responseError(500, "allRooms", "Some technical error", true));
            } else {
              users = users.map(user => ({
                "_id": "",
                "userName": "",
                "password": "",
                "userId": 0,
                "fcm_token": "",
                "device_id": "",
                "is_online": false,
                "last_seen": "",
                "firstName": "",
                "profile_pic": "",
                ...JSON.parse(JSON.stringify(user))
              }));

              let responseData = { roomList: rooms, userList: users };
              connection.sendUTF(responseSuccess(200, "allRooms", responseData, "Data Found", true));
            }
          });
        } else {
          connection.sendUTF(responseError(404, "allRooms", "Not Found", true));
        }
      });
    }
  } else if (requestData.type === 'createRoom') {
    let rules = {
      userList: 'required|array|min:1',
      createBy: 'required'
    };

    let validation = new Validator(requestData, rules);

    if (validation.fails()) {
      connection.sendUTF(responseError(400, "createRoom", validation.errors, true));
    } else {
      
      let findObject = {};
      let userList = requestData.userList.map((userId) => `${userId}`);
      userList.forEach((element) => {
        findObject[`users.${element}`] = true;
      });
      let createBy = requestData.createBy;
      let roomData = {
        ...findObject,
        userList,
        createBy,
        last_message_time: new Date(),
        create_time: new Date(),
        type: requestData.room_type === "group" ? "group" : "individual",
        group_details: requestData.room_type === "group" ? { group_name: "untitled group", ...requestData.group_details } : undefined
      };

      if (userList.length === 2) {
        let existingRoom = await RoomModel.find({ userList: { $all: userList, $size: userList.length } });

        if (existingRoom.length) {
          notifyNewRoom(existingRoom[0]);
        } else {
          createNewRoom(roomData, connection);
        }
      } else {
        createNewRoom(roomData, connection);
      }
    }
  } else if (requestData.type === 'checkRoom') {
    let userList = requestData.userList;
    let query = { userList: { $all: userList, $size: userList.length } };

    let existingRoom = await RoomModel.find(query);

    if (existingRoom.length) {
      connection.sendUTF(responseSuccess(200, "checkRoom", existingRoom[0], "Room already exists", true));
    } else {
      connection.sendUTF(responseError(404, "checkRoom", {}, "Room does not exist", true));
    }
  } else if (requestData.type === 'roomsModify') {
    let roomId = requestData.roomId;

    if (!isFine(roomId)) {
      connection.sendUTF(responseError(400, "roomsModified", "Please add room id.", true));
    } else {
      let updateData = {};

      if (isFine(requestData.unread)) {
        updateData[`unread.${requestData.unread}`] = 0;
      }

      RoomModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(roomId) }, updateData, {
        new: false,
        useFindAndModify: false
      }, (err, updatedRoom) => {
        if (err) {
          connection.sendUTF(responseError(500, "roomsModified", "Internal Server Error.", true));
        } else {
          updatedRoom[`unread`][requestData.unread] = 0;
          connection.sendUTF(responseSuccess(200, "roomsModified", updatedRoom, "Data updated successfully.", true));
        }
      });
    }
  } else if (requestData.type === 'removeUser') {
    let roomId = requestData.roomId;

    if (!isFine(roomId)) {
      connection.sendUTF(responseError(400, "roomsModified", "Please add room id.", true));
    } else {
      RoomModel.find({ _id: mongoose.Types.ObjectId(roomId) }).exec((err, rooms) => {
        if (rooms && rooms.length > 0) {
          let room = rooms[0];
          room.userList = room.userList.filter(userId => userId !== requestData.userId);
          delete room.users[requestData.userId];

          RoomModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(roomId) }, room, {
            new: false,
            useFindAndModify: false
          }, (err, updatedRoom) => {
            if (err) {
              connection.sendUTF(responseError(500, "roomsModified", "Internal Server Error.", true));
            } else {
              connection.sendUTF(responseSuccess(200, "roomsModified", updatedRoom, "Data updated successfully.", true));
            }
          });
        } else {
          connection.sendUTF(responseError(404, "roomsDetails", "Not Found", true));
        }
      });
    }
  }
}

module.exports = { roomRequest };