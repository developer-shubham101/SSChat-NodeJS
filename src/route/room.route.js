export async function roomRequest(requestData, connection, ssChatInstance) {
  if (requestData.type == 'roomsDetails') {
    if (!requestData.roomId) {
      connection.sendUTF(responseError(400, "roomsDetails", "Please enter room id", true));
    }
    let roomId = requestData.roomId;

    RoomModel.find({ _id: mongoose.Types.ObjectId(roomId) }).exec((err, messages) => {
      //res.send(messages);
      // console.log(`On connect Error:::${err} data:::`, messages);
      // connection.sendUTF(`user login successfully ${messages}`);

      if (messages && messages.length > 0) {
        console.log(`Room Data Found....`, messages);
        let usersList = [];
        messages.forEach((element) => {
          usersList = usersList.concat(Object.keys(element.users));
        });

        usersList = [...new Set(usersList)];

        let fondData = { userId: { $in: usersList } };
        // { "userName": requestData.userName, "password": requestData.password };
        UsersModel.find(fondData, (err, userList) => {

          userList = userList.map((element) => {
            let x = Object.assign({}, {
              "_id": "",
              "userName": "",
              "password": "",
              "userId": 0,
              "fcm_token": "",
              "device_id": "",
              "is_online": false,
              "last_seen": "",
              "firstName": "",
              "profile_pic": ""
            }, JSON.parse(JSON.stringify(element)))
            // console.log(x);
            return x;
          })

          let responseData = { roomList: messages, userList: userList };
          // console.log(`responseData::: `, responseData);
          connection.sendUTF(responseSuccess(200, "roomsDetails", responseData, "Data Found", true));
          // userList
        });
      } else {
        connection.sendUTF(responseError(404, "roomsDetails", "Not Found", true));
      }
    });
  } else if (requestData.type == 'allRooms') {
    let rules = {
      // userList: 'required|array|min:1'
      userList: 'array'
    };

    let validation = new Validator(requestData, rules);

    if (validation.fails()) {
      connection.sendUTF(responseError(400, "allRooms", validation.errors, true));
    } else {

      let userList = requestData.userList;

      let findObject = {};
      userList.forEach((element) => {
        findObject[`users.${element}`] = true;
      });

      console.log(findObject);
      RoomModel.find(findObject).sort({ last_message_time: -1 }).exec((err, messages) => {
        //res.send(messages);
        // console.log(`On connect Error:::${err} data:::`, messages);
        // connection.sendUTF(`user login successfully ${messages}`);

        if (messages && messages.length > 0) {
          console.log(`Room Data Found....`, messages);
          let usersList = [];
          messages.forEach((element) => {
            usersList = usersList.concat(Object.keys(element.users));
          });

          usersList = [...new Set(usersList)];

          let fondData = { userId: { $in: usersList } };
          // { "userName": requestData.userName, "password": requestData.password };
          UsersModel.find(fondData, (err, userList) => {
            // console.log("userList", userList);
            if (err) {
              connection.sendUTF(responseError(500, "allRooms", "Some technical error", true));
            } else {
              userList = userList.map((element) => {
                let x = Object.assign({}, {
                  "_id": "",
                  "userName": "",
                  "password": "",
                  "userId": 0,
                  "fcm_token": "",
                  "device_id": "",
                  "is_online": false,
                  "last_seen": "",
                  "firstName": "",
                  "profile_pic": ""
                }, JSON.parse(JSON.stringify(element)))
                // console.log(x);
                return x;
              })

              let responseData = { roomList: messages, userList: userList };
              // console.log(`responseData::: `, responseData);
              connection.sendUTF(responseSuccess(200, "allRooms", responseData, "Data Found", true));
              // userList
            }
          });
        } else {
          connection.sendUTF(responseError(404, "allRooms", "Not Found", true));
        }
      });
    }


  } else if (requestData.type == 'createRoom') {

    let rules = {
      userList: 'required|array|min:1',
      createBy: 'required'
    };

    let validation = new Validator(requestData, rules);

    let userList = requestData.userList;
    let createBy = requestData.createBy;

    if (validation.fails()) {
      connection.sendUTF(responseError(400, "createRoom", validation.errors, true));
    } else {
      // var roomType = requestData.roomType;
      let findObject = {};
      userList.forEach((element) => {
        findObject[`users.${element}`] = true;
      });
      if (requestData.room_type == "group") {
        findObject["type"] = "group";
        let groupDetails = Object.assign({}, {
          group_name: "untitled group",
        }, requestData.group_details);
        findObject["group_details"] = groupDetails;
        findObject["type"] = "group";
      } else {
        findObject["type"] = "individual";
      }

      findObject['last_message_time'] = new Date();
      findObject['create_time'] = new Date();
      findObject['userList'] = userList;
      findObject['createBy'] = createBy;

      if (userList.length == 2) {

        let group = await RoomModel.find({ userList: { $all: userList, $size: userList.length } });
        // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true , userList: {$size : 2}});
        // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true });
        if (group.length) {
          console.log('Group already exists');

          ssChatInstance.createNewRoomNotify(group[0]);

          // connection.sendUTF(responseSuccess(200, "createRoom", group[0], "New Room Created", true));
        } else {
          ssChatInstance.createNewRoom(findObject, connection);
        }
      } else {
        ssChatInstance.createNewRoom(findObject, connection);
      }

    }


  } else if (requestData.type == 'checkRoom') {

    var userList = requestData.userList;


    // var roomType = requestData.roomType;
    let findObject = {};
    userList.forEach((element) => {
      findObject[`users.${element}`] = true;
    });


    let group = await RoomModel.find({ userList: { $all: userList, $size: userList.length } });
    // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true , userList: {$size : 2}});
    // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true });
    if (group.length) {
      // console.log('Group already exists');
      connection.sendUTF(responseSuccess(200, "checkRoom", group[0], "Room already exist", true));
    } else {
      // console.log('Group not already exists');
      connection.sendUTF(responseError(404, "checkRoom", {}, "Room not exist", true));
    }
  } else if (requestData.type == 'roomsModify') {


    var roomId = requestData.roomId;

    if (!isFine(roomId)) {
      connection.sendUTF(responseError(400, "roomsModified", "Please add room id.", true));
    } else {
      let dataToUpdate = {};
      if (isFine(requestData.unread)) {
        dataToUpdate[`unread.${requestData.unread}`] = 0;
      }

      RoomModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(roomId) }, dataToUpdate, {
        new: false,
        useFindAndModify: false
      }, (err, updatedRoom) => {
        // console.log("updatedRoom:::", updatedRoom);
        if (err) {
          connection.sendUTF(responseError(500, "roomsModified", "Internal Server Error.", true));
        } else {
          updatedRoom[`unread`][requestData.unread] = 0;
          connection.sendUTF(responseSuccess(200, "roomsModified", updatedRoom, "Data updated successfully.", true));
        }

      });
    }
  } else if (requestData.type == 'removeUser') {
    var roomId = requestData.roomId;

    if (!isFine(roomId)) {
      connection.sendUTF(responseError(400, "roomsModified", "Please add room id.", true));
    } else {


      RoomModel.find({ _id: mongoose.Types.ObjectId(roomId) }).exec((err, messages) => {
        //res.send(messages);
        // console.log(`On connect Error:::${err} data:::`, messages);
        // connection.sendUTF(`user login successfully ${messages}`);

        if (messages && messages.length > 0) {
          console.log(`Room Data Found....`, messages);


          let dataToUpdate = messages[0];

          dataToUpdate.userList = dataToUpdate.userList.filter(item => item != requestData.userId);
          delete dataToUpdate.users[requestData.userId];


          RoomModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(roomId) }, dataToUpdate, {
            new: false,
            useFindAndModify: false
          }, (err, updatedRoom) => {
            console.log("updatedRoom:::", updatedRoom);
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
