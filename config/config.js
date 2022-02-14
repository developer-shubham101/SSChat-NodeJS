let config = {};

//Either Send Push Notification or not
config.isSendPushNotification = true;

// Server Key
config.serverKey = 'AAAAdl4ExyE:APA91bHY_PtnWTo6xN2H_5a1cXbOicQYMTZrM9HBkjTaZ1jxB-5LEsrdVMonjU4-QjVCLKU3buAx3knwaJVq56MvSA78-cPxQqDVtpxor03I1DyS1rmUPkDxmUXt6l7zRSkgJj8SOyG5'; //put your server key here

// MongoDB Url
// mongodb+srv://ReactChat:<password>@sample.b9ow3.mongodb.net/ReactChat?retryWrites=true&w=majority
config.dbUrl = 'mongodb+srv://ReactChat:zLv9moWZL0kzPG32@sample.b9ow3.mongodb.net/ReactChat?retryWrites=true&w=majority';

// Port where we'll run the websocket server
config.webSocketsServerPort = process.env.PORT || 1337;


module.exports = config;
