let config = {};

//Either Send Push Notification or not
config.isSendPushNotification = false;

// FCM Server key
config.serverKey = 'scasca';

// MongoDB Url
config.dbUrl = 'mongodb://127.0.0.1:27017/SSReactChat';//  ReactChat
//mongodb+srv://ReactChat:<password>@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
// config.dbUrl = 'mongodb+srv://ReactChat:zLv9moWZL0kzPG32@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';//  ReactChat

// Port where we'll run the websocket server
config.webSocketsServerPort = process.env.PORT || 1337;


module.exports = config;
