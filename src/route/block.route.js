const { isFine } = require('./../utility');

  async function blockUser(requestData, connection, ssChatInstance) {

  if (requestData.type == 'allBlockUser') {
    if (!isFine(requestData.user)) {
      connection.sendUTF(responseError(400, "allBlockUser", "user is required.", true));
    } else {

      let dataToUpdate = [{
        "blockedBy": requestData.user,
      }, {
        "blockedTo": requestData.user
      }];

      BlockModel.find({
        $or: dataToUpdate
      }, (err, data) => {
        console.warn("allBlockUser", err, data);
        if (data) {
          // console.log("allBlockUser", data);
          /// Notify to all active user about that user status
          connection.sendUTF(responseSuccess(200, "allBlockUser", data, "Block Status Changed", true));
        }
      });
    }
  } else if (requestData.type == 'blockUser') {
    // console.log(requestData);

    // blockedBy: String,
    // blockedTo: String,

    // login validation
    if (!isFine(requestData.blockedBy) || !isFine(requestData.blockedTo)) {
      connection.sendUTF(responseError(400, "blockUser", "BlockedBy and BlockedTo is required.", true));
    } else {

      let dataToUpdate = {
        "blockedBy": requestData.blockedBy,
        "blockedTo": requestData.blockedTo,
        "isBlock": requestData.isBlock,

      };

      BlockModel.updateOne({
        "blockedBy": requestData.blockedBy,
        "blockedTo": requestData.blockedTo
      }, dataToUpdate, { upsert: true }, (err, data) => {
        console.warn(err, data);
        if (data) {

          BlockModel.find({
            "blockedBy": requestData.blockedBy,
            "blockedTo": requestData.blockedTo
          }, (err, data) => {
            console.warn("allBlockUser", err, data);
            if (data) {
              // console.log("allBlockUser", data);
              // Notify to all active user about that user status
              ssChatInstance.sendMessageToUser(requestData.blockedBy, responseSuccess(200, "blockUser", data[0], "Block Status Changed", true));
              ssChatInstance.sendMessageToUser(requestData.blockedTo, responseSuccess(200, "blockUser", data[0], "Block Status Changed", true));

            }
          });
        }
      });
    }
  } else {
    connection.sendUTF(responseError(404, "noActionInBlockUser", "Action/Path not found.", true));
  }
}


module.exports = { blockUser };