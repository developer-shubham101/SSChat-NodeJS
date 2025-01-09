 
const { responseSuccess, responseError, isFine } = require('../utility'); 


const bookingConnectionList = {};
async function currentLocation(requestData, connection) {

  if (requestData.type == 'update') {
    if (!isFine(requestData.bookingId)) {
      connection.sendUTF(responseError(400, "currentLocation", "bookingId required.", true));
    } else if (bookingConnectionList[requestData.bookingId] != null) {
      bookingConnectionList[requestData.bookingId].forEach((con) => {
        let response = {
          current_location: requestData.current_location,
          userId: requestData.userId
        };
        con.sendUTF(responseSuccess(200, "currentLocation", response, "Block Status Changed", true));
      });
    }
  } else if (requestData.type == 'register') {
    if (!isFine(requestData.bookingId)) {
      connection.sendUTF(responseError(400, "currentLocationRegister", "bookingId required.", true));
    } else {
      let tmpBookingConnectionList = bookingConnectionList[requestData.bookingId];
      if (tmpBookingConnectionList != undefined) {
    
        tmpBookingConnectionList.push(connection);
        // connection.sendUTF(responseError(400, "currentLocation", "user is required.", true));
      } else {
      
        tmpBookingConnectionList = [connection];
      }
      bookingConnectionList[requestData.bookingId] = tmpBookingConnectionList;
    }
  }
}


module.exports = { currentLocation };