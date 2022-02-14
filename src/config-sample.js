let config = {};

//Either Send Push Notification or not
config.isSendPushNotification = true;

// Server Key
config.serverKey = ''; //put your server key here

// MongoDB Url
config.dbUrl = 'mongodb://127.0.0.1:27017/ReactChat';

// Port where we'll run the websocket server
config.webSocketsServerPort = process.env.PORT || 1337;

module.exports = config;
