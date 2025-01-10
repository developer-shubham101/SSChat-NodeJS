const { UsersModel } = require("../model");
const { responseError, responseSuccess } = require("../utility");

async function allUser(requestData, connection) {
  if (requestData.type == 'allUsers') {
    UsersModel.find({}, (err, messages) => {
      console.log(`On UsersModel.find Error:::${err} responses:::`, messages);
      if (messages && messages.length > 0) {
        connection.sendUTF(responseSuccess(200, "allUsers", messages, "User list.", true));
      } else {
        connection.sendUTF(responseError(404, "allUsers", "Not Found", true));
      }
    });
  } else {
    connection.sendUTF(responseError(500, "allUsers", "Action/Path not found.", true));
  }
}

module.exports = { allUser };