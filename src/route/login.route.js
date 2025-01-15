
const Validator = require('validatorjs');
const mongoose = require('mongoose');
const { UsersModel } = require('./../model');
const { isFine, responseSuccess } = require('../utility');

const { updateOnlineStatus, sendMessageToAll } = require('../update-user');
const { addConnectionToList } = require('../connections');



let loginUsers = {};

async function loginRequest(requestData, connection) {
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

        console.log(`User data found: ${JSON.stringify(userData)}`);

        if (!userData) {
          connection.sendUTF(responseError(401, "login", "Unauthorized", true));
        } else if (!isFine(userData['userId'])) {
          connection.sendUTF(responseError(401, "login", "UserId not found.", true));

        } else {

          let userId = userData['userId'];

          addConnectionToList(connection, userId);

          loginUsers[userId] = userData;

          userData.fcm_token = isFine(requestData.fcm_token) ? requestData.fcm_token : '';
          userData.device_id = isFine(requestData.device_id) ? requestData.device_id : '';
          userData.is_online = true;
          userData.last_seen = new Date();

          await userData.save();

          console.log(`user login successfully`, userData);
          connection.sendUTF(responseSuccess(200, "login", userData, "Login Success", true));

          updateOnlineStatus(userId, true);

        }

      });

    }


  } else if (requestData.type == 'loginOrCreate') {
    /*
     * Example request data:
     * {
     *   "request": "login",
     *   "userId": "4",
     *   "fcm_token": "qasdfghfds",
     *   "password": "123456",
     *   "type": "loginOrCreate",
     *   "userName": "ali@yopmail.com"
     * }
     */
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

      let userDataToFind = {
        "userName": requestData.userName,
        "password": requestData.password,
        "userId": requestData.userId,
      };

      UsersModel.findOne(userDataToFind, async (err, foundUserData) => {
        console.log("foundUserData", foundUserData);
        

        if (!foundUserData) {

          isFine(requestData.fcm_token) && (userDataToFind.fcm_token = requestData.fcm_token);
          isFine(requestData.device_id) && (userDataToFind.device_id = requestData.device_id);
          isFine(requestData.firstName) && (userDataToFind.firstName = requestData.firstName);

          userDataToFind.is_online = true;
          userDataToFind.last_seen = new Date();
          let newUser = new UsersModel(userDataToFind);
          newUser.save().then((savedUser) => {
            console.log(`User Saved: ${JSON.stringify(savedUser)}`);
            connection.sendUTF(responseSuccess(200, "loginOrCreate", savedUser, "Success.", true));
          }).catch((ex) => {
            console.error(`User Failed to Save.`, ex);
            connection.sendUTF(responseError(500, "loginOrCreate", "Internal Server Error.", true));
          });

        } else {

          let userId = foundUserData['userId'];

          addConnectionToList(connection, userId);

          loginUsers[userId] = foundUserData;
 
          if (isFine(requestData.firstName)) foundUserData.firstName = requestData.firstName;
          if (isFine(requestData.fcm_token)) foundUserData.fcm_token = requestData.fcm_token;
          if (isFine(requestData.device_id)) foundUserData.device_id = requestData.device_id; 

          await foundUserData.save();

          connection.sendUTF(responseSuccess(200, "loginOrCreate", foundUserData, "Login Success", true));

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
        let user = new UsersModel(fondData);
        user.save().then((savedMessage) => {
          console.log(`User Saved: ${JSON.stringify(savedMessage)}`);

          connection.sendUTF(responseSuccess(200, "register", savedMessage, "Success.", true));
        }).catch((ex) => {
          console.error(`User Failed to Save: ${ex.message}`, ex);
          connection.sendUTF(responseError(500, "register", "Internal Server Error.", true));
        });

      })
    }

  } else if (requestData.type == 'updateProfile') {

    if (!isFine(requestData.userId)) {
      connection.sendUTF(responseError(400, "updateProfile", "userId is required.", true));
    } else {
      let dataToUpdate = {};
      /* if (isFine(requestData.userName)) {
        dataToUpdate['userName'] = requestData.userName;
      }

      if (isFine(requestData.password)) {
        dataToUpdate['password'] = requestData.password;
      } */

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

      UsersModel.findOneAndUpdate({
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
            sendMessageToAll(responseSuccess(200, "userModified", findUser[0], "User Details Changed", true))
          }
        });

      });
    }

  } else {
    connection.sendUTF(responseError(404, "noActionInLogin", "Action/Path not found.", true));
  }
}


module.exports = { loginRequest };