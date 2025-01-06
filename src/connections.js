let allConnections = {};

const addConnectionToList = (connection, userId) => {
  console.log({ "message": "addConnectionToList", userId, remoteAddresses: connection.remoteAddress });
  connection['uId'] = `${userId}`;
  // connection['connectionID'] = Date.now();
  if (!allConnections[userId] || allConnections[userId] == undefined) {
    allConnections[userId] = [connection];
  } else {
    let alreadyHas = allConnections[userId].some((element) => {
      return element.remoteAddress == connection.remoteAddress
    });
    if (alreadyHas) {
      console.log(`connection is already available `); //${connection.remoteAddress}
    } else {
      console.log(`new connection `); //${connection.remoteAddress}
      allConnections[userId].push(connection);
    }

  }
}
const removeConnectionFromList = (connection) => {
  let userId = connection.uId;
  let remoteAddress = connection.remoteAddress;
  if (!(!allConnections[userId] || allConnections[userId] == undefined)) {
    let filteredConnections = allConnections[userId].filter((element) => {
      return element.remoteAddress != remoteAddress;
    });
    allConnections[userId] = filteredConnections;
  }
}

module.exports = { addConnectionToList, allConnections, removeConnectionFromList };