const { allConnections } = require("./connections");
const { UsersModel } = require("./model");
const { responseSuccess } = require("./utility");


const updateOnlineStatus = (userId, online) => {
  ///Create new object to update online and lst seen status
  let dataToUpdate = { last_seen: new Date(), is_online: online };

  UsersModel.findOneAndUpdate({ userId: userId }, dataToUpdate, {
    new: false,
    useFindAndModify: false
  }, (err, updated_user) => {
    if (updated_user) {
      // console.log("On Update Online Status:: ", err, updated_user);

      updated_user["is_online"] = online;

      /// Notify to all active user about that user status
      sendMessageToAll(responseSuccess(200, "userModified", updated_user, "Online/Offline Status Changed", true));

    }
  });
}


const sendMessageToAll = (message) => {
  Object.keys(allConnections).forEach((element) => {
    console.log(`Connection:: ${allConnections[element].length}`);
    allConnections[element].forEach((connection) => {
      connection.sendUTF(message);
    });
  });
}

module.exports = { updateOnlineStatus, sendMessageToAll };