let config = {};

//Either Send Push Notification or not
config.isSendPushNotification = true;

// Server Key
// SSChat React
// config.serverKey = 'AAAAvvRfWBg:APA91bFUq2aKcEeodJab7UjMLUVXLgMXgJC26g0yReAOpziaDMqkzWJfWIfEEyiDwQmn_VVXd2LJS8hS6xIrIG3TBEWupOfOGt1rCn1qh8pR_TOltJw8MMkppvtfAdHuBMBwDij1HeC3';
//Tryst
config.serverKey = 'AAAAP4u6PVI:APA91bEWx0iGiQT4_4RYXd5sW3eeQ3ThQwGfA2scuWWqrvObMs0OMiIpsPhBvcrXlW_oSJAJHw_qjq0ZDOeD1gI84Dd_5kLLJ1OM0XHwexvtdj5tsWftCLEb_dsQf0cZqFNQfZSUhati'; //put your server key here

// MongoDB Url
// config.dbUrl = 'mongodb://127.0.0.1:27017/Tryste-TmpV1';//  ReactChat
//mongodb+srv://ReactChat:<password>@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
config.dbUrl = 'mongodb+srv://ReactChat:zLv9moWZL0kzPG32@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';//  ReactChat

// Port where we'll run the websocket server
config.webSocketsServerPort = process.env.PORT || 1337;


module.exports = config;
