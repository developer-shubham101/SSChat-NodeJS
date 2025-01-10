const mongoose = require('mongoose');
const { UsersModel, MessageModel, RoomModel, BlockModel } = require('../model');
const { responseSuccess, responseError, isFine, formatTheMessages, getLastMessage, getLastMessageForNotification } = require('../utility');

const Validator = require('validatorjs');
const { sendMessageToUser } = require('../connections');
const config = require('../config');




async function messageRequest(requestData, connection) {
  const key = requestData.room;
  console.log('key-----', key);

  if (!isFine(key)) {
    connection.sendUTF(responseError(400, "message", "Room id is required {room}.", true));
  } else {

    if (requestData.type === 'allMessage') {

      let findObject = {
        roomId: mongoose.Types.ObjectId(key)
      };

      MessageModel.find(findObject, (err, messages) => {
        //res.send(messages);
        // console.log(`allMessage Error:::${err} data:::`, messages);

        if (messages && messages.length > 0) {
          console.log(`All Message Found....`);
          let formatMessages = messages.map((element) => {
            return formatTheMessages(element);
          });

          connection.sendUTF(responseSuccess(200, "message", formatMessages, "message All list", true));
        } else {
          connection.sendUTF(responseError(404, "message", "Data not found.", true));
        }
      });

    } else if (requestData.type === 'addMessage') {


      /*
      * {
    "roomId": "608437be5c7a813378e455b5",
    "room": "608437be5c7a813378e455b5",
    "message": "Hiiiiiiiiiiii",
    "receiver_id": "123456",
    "message_type": "TEXT",
   "sender_id": "4",
   
    "message_content": {

    },
    "request": "message",
    "type": "addMessage"
  }*/


      let rules = {
        roomId: 'required|string',
        room: 'required|string',
        message_type: 'required|string',
        sender_id: 'required|integer|string',
        //message: 'required|string'
      };
      let validation = new Validator(requestData, rules);

      // validation.fails(); // true
      // validation.passes(); // false

      if (validation.fails()) {
        connection.sendUTF(responseError(400, "message", validation.errors, true));
      } else {
        let messageData = requestData;
        console.log("Message Data" + messageData.roomId);
        const messageModel = new MessageModel({
          roomId: mongoose.Types.ObjectId(messageData.roomId),

          message: messageData.message,
          message_type: messageData.message_type,

          media: "",

          receiver_id: messageData.receiver_id,
          time: new Date(),

          sender_id: messageData.sender_id,
          message_content: messageData.message_content
        });
        // try {
        messageModel.save().then((savedMessage) => {
          // console.log(`Message Saved.`, savedMessage);

          RoomModel.findById(mongoose.Types.ObjectId(messageData.roomId)).then((room, err) => {
            // console.log('messageRequest Room list::::', room);
            // console.log('room list::::', cons);

            let newMessageInfo = {};
            if (room["unread"] !== undefined) {
              let unreadObject = room.users;
              let userIdOfUnreadMessges = Object.keys(unreadObject);

              let unread = room.unread;

              userIdOfUnreadMessges.forEach((userId) => {
                let oldCount = unread[userId];
                let newUnreadMessage = oldCount ? oldCount + 1 : 1;
                if (userId === messageData.sender_id) {
                  unread[userId] = 0;
                } else {
                  unread[userId] = newUnreadMessage;
                }
              });
              newMessageInfo = { unread: unread }

            } else {
              let unreadObject = room.users;
              let userIdOfUnreadMessages = Object.keys(unreadObject);

              let unread = {};
              userIdOfUnreadMessages.forEach((userId) => {
                let newUnreadMessage = 1;
                if (userId === messageData.sender_id) {
                  unread[userId] = 0;
                } else {
                  unread[userId] = newUnreadMessage;
                }

              });

              newMessageInfo = { unread: unread }
            }

            newMessageInfo["last_message"] = getLastMessage(messageData.message, messageData.message_type);
            newMessageInfo["last_message_time"] = new Date();

            console.log('MessageRequest:::: newMessageInfo:: ', newMessageInfo);


            /* users: Object,

      type: String, //group/individual
      last_message: Object,
      message_info: Object,
      users_meta: Object,
      userList: Array */
            RoomModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(room._id) }, newMessageInfo, {
              new: true,
              useFindAndModify: false
            }, (err, updatedRoom) => {
              // console.log("RoomModel::: update", err, updatedRoom);
              if (err) {

              } else {
                let messageToSend = responseSuccess(200, "roomsModified", updatedRoom, "Modified", true);
                room.userList.forEach(user => {
                  sendMessageToUser(user, messageToSend);
                });
              }

            });

            let formattedMessages = formatTheMessages(savedMessage);

            let messageToSend = responseSuccess(201, "message", formattedMessages, "Data Found", true);
            room.userList.forEach(user => {
              sendMessageToUser(user, messageToSend);
            });

            // let receverUserListId = room.userList.filter((element) => {
            // 	return element != messageData.sender_id;
            // });


            let fondData = { userId: { $in: room.userList } };
            // { "userName": requestData.userName, "password": requestData.password };
            UsersModel.find(fondData, (err, userList) => {

              let receiverUserList = userList.filter((element) => {
                return element.userId != messageData.sender_id;
              });
              let senderUserDetail = userList.find((element) => {
                return element.userId == messageData.sender_id;
              });

              let fcmTokens = receiverUserList.map((element) => {
                return element.fcm_token;
              });
              console.log(`fcmTokens::: `, fcmTokens);

              let message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                "registration_ids": fcmTokens,
                // collapse_key: 'your_collapse_key',

                notification: {
                  title: `New message from ${senderUserDetail.firstName}`,
                  body: getLastMessageForNotification(messageData.message, messageData.message_type)
                },

                data: {
                  payload: {
                    payload: "17",
                    id: messageData.roomId
                  },
                }
              };


              config.isSendPushNotification && fcm.send(message, function (err, response) {
                if (err) {
                  console.log("Something has gone wrong!");
                } else {
                  console.log("Successfully sent with response: ", response);
                }
              });
            });
          });
        }).catch((ex) => {
          console.error(`Message Failed to Saved.`, ex);
          connection.sendUTF(responseError(500, "message", "message All list", true));
        });
        // }catch(ex){
        // 	console.log("Save message error:: ",ex);
        // }

      }

    } else if (requestData.type === 'updateMessage') {

      /*{
    "room": "608437be5c7a813378e455b5",
    "messageId": "60845847bf1e5b470dba2ccb",
    "message_content": {
    "asdasd": "sdasd"
    },
    "request": "message",
    "type": "updateMessage",
    "message": "asdasdasd"
  }*/

      let rules = {
        //room: 'required|string',
        messageId: 'required|string',
        // message: 'string',
        // message_content: 'object'
      };
      let validation = new Validator(requestData, rules);

      // validation.fails(); // true
      // validation.passes(); // false

      if (validation.fails()) {
        connection.sendUTF(responseError(400, "updateMessage", validation.errors, true));
      } else {
        let dataToUpdate = {};

        isFine(requestData.message_content) && (dataToUpdate["message_content"] = requestData.message_content);
        isFine(requestData.message) && (dataToUpdate["message"] = requestData.message);
        isFine(requestData.isDelete) && (dataToUpdate["message_type"] = "DELETE");

        MessageModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(requestData.messageId) }, dataToUpdate, {
          new: true,
          useFindAndModify: false
        }, (err, data) => {
          console.warn("updateMessage", err, data);
          if (data.roomId) {
            RoomModel.find({ _id: mongoose.Types.ObjectId(data.roomId) }).exec((err, roomData) => {
              // console.log("updateMessage", err, roomData);
              if (roomData.length > 0) {
                roomData[0].userList.forEach((userId) => {
                  // console.log("Sending Message To", userId, data);
                  sendMessageToUser(userId, responseSuccess(200, "updateMessage", formatTheMessages(data), "Modified", true))
                });
              }
            });
          }
        });
      }
    }

  }
}

module.exports = { messageRequest };