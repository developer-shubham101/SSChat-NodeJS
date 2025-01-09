const { responseError, responseSuccess, isFine } = require('./utility');

let allConnections = {};

/**
 * Adds a connection to the list of all connections for a user.
 * @param {Object} connection - The WebSocket connection object.
 * @param {string} userId - The ID of the user.
 */
const addConnectionToList = (connection, userId) => {
  console.log({ message: "Adding connection to list", userId, remoteAddress: connection.remoteAddress });
  connection['uId'] = `${userId}`;

  if (!allConnections[userId]) {
    allConnections[userId] = [connection];
  } else {
    let alreadyExists = allConnections[userId].some((element) => element.remoteAddress === connection.remoteAddress);
    if (alreadyExists) {
      console.log("Connection already exists for this user and remote address.");
    } else {
      console.log("Adding new connection for this user.");
      allConnections[userId].push(connection);
    }
  }
};

/**
 * Removes a connection from the list of all connections for a user.
 * @param {Object} connection - The WebSocket connection object.
 */
const removeConnectionFromList = (connection) => {
  let userId = connection.uId;
  let remoteAddress = connection.remoteAddress;
  if (allConnections[userId]) {
    allConnections[userId] = allConnections[userId].filter((element) => element.remoteAddress !== remoteAddress);
    console.log({ message: "Removed connection from list", userId, remoteAddress });
  }
};

/**
 * Sends a message to all connections of a user.
 * @param {string} userId - The ID of the user.
 * @param {string} message - The message to be sent.
 */
const sendMessageToUser = (userId, message) => {
  if (allConnections[userId]) {
    console.log(`Sending message to user ${userId} with ${allConnections[userId].length} connections.`);
    allConnections[userId].forEach((connection) => {
      connection.sendUTF(message);
    });
  }
};

/**
 * Creates a new connection for a user.
 * @param {Object} requestData - The data from the request.
 * @param {Object} connection - The WebSocket connection object.
 */
const createConnection = (requestData, connection) => {
  if (requestData.type === "create") {
    if (isFine(requestData.user_id)) {
      let userId = requestData.user_id;
      addConnectionToList(connection, userId);
      connection.sendUTF(responseSuccess(200, "create_connection", {}, "Connection Established.", true));
    } else {
      connection.sendUTF(responseError(404, "create_connection", "Action/Path not found.", true));
    }
  }
};

module.exports = { allConnections, addConnectionToList, removeConnectionFromList, sendMessageToUser, createConnection };