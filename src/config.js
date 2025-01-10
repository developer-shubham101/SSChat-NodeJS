let config = {};

//Either Send Push Notification or not
config.isSendPushNotification = false;

// Server Key
config.serverKey = 'AAAAdl4ExyE:APA91bHY_PtnWTo6xN2H_5a1cXbOicQYMTZrM9HBkjTaZ1jxB-5LEsrdVMonjU4-QjVCLKU3buAx3knwaJVq56MvSA78-cPxQqDVtpxor03I1DyS1rmUPkDxmUXt6l7zRSkgJj8SOyG5'; //put your server key here

// MongoDB Url
config.dbUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ReactChat';

// Port where we'll run the websocket server
config.webSocketsServerPort = process.env.PORT || 1337;

config.jwtSecret = process.env.JWT_SECRET || '700f67c519a051de5471cdb753d28cb688e0af8895ef1d292fd6c785d7d043b3';

module.exports = config;
