let config = {};

//Either Send Push Notification or not
config.isSendPushNotification = true;

// Server Key
// SSChat React
// config.serverKey = 'AAAAvvRfWBg:APA91bFUq2aKcEeodJab7UjMLUVXLgMXgJC26g0yReAOpziaDMqkzWJfWIfEEyiDwQmn_VVXd2LJS8hS6xIrIG3TBEWupOfOGt1rCn1qh8pR_TOltJw8MMkppvtfAdHuBMBwDij1HeC3';
//Tryst
config.serverKey = 'AAAAdl4ExyE:APA91bHY_PtnWTo6xN2H_5a1cXbOicQYMTZrM9HBkjTaZ1jxB-5LEsrdVMonjU4-QjVCLKU3buAx3knwaJVq56MvSA78-cPxQqDVtpxor03I1DyS1rmUPkDxmUXt6l7zRSkgJj8SOyG5'; //put your server key here

// MongoDB Url
// config.dbUrl = 'mongodb://127.0.0.1:27017/Tryste-TmpV1';//  ReactChat
//mongodb+srv://ReactChat:<password>@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
config.dbUrl = 'mongodb+srv://ReactChat:zLv9moWZL0kzPG32@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';//  ReactChat

// Port where we'll run the websocket server
config.webSocketsServerPort = process.env.PORT || 1337;


module.exports = config;
