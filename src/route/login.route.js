
let Validator = require('validatorjs');

var { UsersModel, MessageModel, RoomModel, BlockModel } = require('./../model');
const { isFine, responseSuccess } = require('../utility');
const { addConnectionToList } = require('../connections');
const { updateOnlineStatus } = require('../update-user');

let loginUsers = {};

async function loginRequest(requestData, connection, ssChatInstance) {
  if (requestData.type == 'login') {

    // login validation
    if (!isFine(requestData.userName) || !isFine(requestData.password)) {

      connection.sendUTF(responseError(400, "login", "Username and password are required.", true));

    } else {

      let fondData = {
        "userName": requestData.userName,
        "password": requestData.password,

      };
      UsersModel.findOne(fondData, async (err, userData) => {

        console.log('userData', userData);

        if (!userData) {
          connection.sendUTF(responseError(401, "login", "Unauthorized", true));
        } else if (!isFine(userData['userId'])) {
          connection.sendUTF(responseError(401, "login", "UserId not found.", true));

        } else {

          let userId = userData['userId'];

          ssChatInstance.addConnectionToList(connection, userId);

          loginUsers[userId] = userData;

          userData.fcm_token = isFine(requestData.fcm_token) ? requestData.fcm_token : '';
          userData.device_id = isFine(requestData.device_id) ? requestData.device_id : '';
          userData.is_online = true;
          userData.last_seen = new Date();

          await userData.save();

          //res.send(messages);
          // console.log(`On connect Error:::${err} users:::`, userData);

          console.log(`user login successfully`, userData);
          connection.sendUTF(responseSuccess(200, "login", userData, "Login Success", true));

          ssChatInstance.updateOnlineStatus(userId, true);

        }

      });

    }


  } else if (requestData.type == 'loginOrCreate') {

    /*
    * {
  "request": "login",
  "userId": "4",
  "fcm_token": "qasdfghfds",
  "password": "123456",
  "type": "loginOrCreate",
  "userName": "ali@yopmail.com"
}
* */
    let rules = {
      userId: 'required|integer|string',
      password: 'required|string',
      userName: 'required|email'
    };

    let errorMessage = {
      email: 'userName must be Email'
    };

    let validation = new Validator(requestData, rules, errorMessage);

    // validation.fails(); // true
    // validation.passes(); // false

    if (validation.fails()) {
      connection.sendUTF(responseError(400, "loginOrCreate", validation.errors, true));

    } else {

      let fondData = {
        "userName": requestData.userName,
        "password": requestData.password,
        "userId": requestData.userId,
      };

      UsersModel.findOne(fondData, async (err, userData) => {

        if (!userData) {

          isFine(requestData.fcm_token) && (fondData.fcm_token = requestData.fcm_token);
          isFine(requestData.device_id) && (fondData.device_id = requestData.device_id);
          isFine(requestData.firstName) && (fondData.firstName = requestData.firstName);

          fondData.is_online = true;
          fondData.last_seen = new Date();
          let user = new UsersModel(fondData);
          user.save().then((savedMessage) => {
            // console.log(`User Saved.`, savedMessage);
            connection.sendUTF(responseSuccess(200, "loginOrCreate", savedMessage, "Success.", true));
          }).catch((ex) => {
            console.error(`User Failed to Saved.`, ex);
            connection.sendUTF(responseError(500, "loginOrCreate", "Internal Server Error.", true));
          });

        } else {

          let userId = userData['userId'];
          addConnectionToList(connection, userId);

          loginUsers[userId] = userData;

          isFine(requestData.firstName) && (userData.firstName = requestData.firstName);
          isFine(requestData.fcm_token) && (userData.fcm_token = requestData.fcm_token);
          isFine(requestData.device_id) && (userData.device_id = requestData.device_id);

          await userData.save();

          connection.sendUTF(responseSuccess(200, "loginOrCreate", userData, "Login Success", true));

          updateOnlineStatus(userId, true);
        }

      });
    }

  } else if (requestData.type == 'register') {

    // register validation
    if (!isFine(requestData.userName)) {
      connection.sendUTF(responseError(400, "register", "Username is required.", true));

    } else if (!isFine(requestData.password)) {

      connection.sendUTF(responseError(400, "register", "Password is required.", true));

    } else if (!isFine(requestData.userId)) {

      connection.sendUTF(responseError(400, "register", "UserId is required.", true));

    } else {

      UsersModel.find({ userId: requestData.userId, userName: requestData.userName }).then((userData) => {
        console.log('userData', userData);
        if (userData.length) {
          return connection.sendUTF(responseError(400, "register", "User is already exist.", true));
        }

        let fondData = {
          "userName": requestData.userName,
          "password": requestData.password,
          "userId": requestData.userId,
          "is_online": true,
          "last_seen": new Date
        };
        var user = new UsersModel(fondData);
        user.save().then((savedMessage) => {
          console.log(`User Saved.`, savedMessage);

          connection.sendUTF(responseSuccess(200, "register", savedMessage, "Success.", true));
        }).catch((ex) => {
          console.error(`User Failed to Saved.`, ex);


          connection.sendUTF(responseError(500, "register", "Internal Server Error.", true));
        });

      })
    }

  } else if (requestData.type == 'updateProfile') {

    /* if (!isFine(requestData._id)) {
      connection.sendUTF(this.responseError(400, "updateProfile", "ObjectId is not provided.", true));
    } else */
    if (!isFine(requestData.userId)) {
      connection.sendUTF(responseError(400, "updateProfile", "userId is required.", true));
    } else {
      let dataToUpdate = {};
      if (isFine(requestData.userName)) {
        dataToUpdate['userName'] = requestData.userName;
      }

      if (isFine(requestData.password)) {
        dataToUpdate['password'] = requestData.password;
      }

      // if (isFine(requestData.userId)) {
      // 	dataToUpdate['userId'] = requestData.userId;
      // }

      if (isFine(requestData.firstName)) {
        dataToUpdate['firstName'] = requestData.firstName;
      }

      if (isFine(requestData.lastName)) {
        dataToUpdate['lastName'] = requestData.lastName;
      }

      if (isFine(requestData.profile_pic)) {
        dataToUpdate['profile_pic'] = requestData.profile_pic;
      }

      if (isFine(requestData.email)) {
        dataToUpdate['email'] = requestData.email;
      }

      if (isFine(requestData.fcm_token)) {
        dataToUpdate['fcm_token'] = requestData.fcm_token;
      }

      if (isFine(requestData.device_id)) {
        dataToUpdate['device_id'] = requestData.device_id;
      }

      UsersModel.findOneAndUpdate({ /* _id: requestData._id,  */
        userId: requestData.userId
      }, dataToUpdate, { new: false, useFindAndModify: false }, (err, updated_user) => {
        if (err) {
          connection.sendUTF(responseError(500, "updateProfile", "Internal Server Error.", true));
        }

        if (updated_user == null) {
          connection.sendUTF(responseError(400, "updateProfile", "No user found.", true));
        }

        connection.sendUTF(responseSuccess(200, "updateProfile", updated_user, "Data updated successfully.", true));


        UsersModel.find({ _id: mongoose.Types.ObjectId(updated_user._id) }, (err, findUser) => {

          if (findUser && findUser.length > 0) {
            /// Notify to all active user about that user profile
            ssChatInstance.sendMessageToAll(responseSuccess(200, "userModified", findUser[0], "User Details Changed", true))
          }
        });

      });
    }

  } else {
    connection.sendUTF(responseError(404, "noActionInLogin", "Action/Path not found.", true));
  }
}


module.exports = { loginRequest };