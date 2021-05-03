let appConfig = {
    isSendPushNotification: false,
    serverKey: "",
    dbUrl: "",
    webSocketsServerPort: "1337"
};

//Either Send Push Notification or not
appConfig.isSendPushNotification = false;

// Server Key
// SSChat React
appConfig.serverKey = 'AAAAvvRfWBg:APA91bFUq2aKcEeodJab7UjMLUVXLgMXgJC26g0yReAOpziaDMqkzWJfWIfEEyiDwQmn_VVXd2LJS8hS6xIrIG3TBEWupOfOGt1rCn1qh8pR_TOltJw8MMkppvtfAdHuBMBwDij1HeC3';
//Tryst
// config.serverKey = 'AAAAP4u6PVI:APA91bEWx0iGiQT4_4RYXd5sW3eeQ3ThQwGfA2scuWWqrvObMs0OMiIpsPhBvcrXlW_oSJAJHw_qjq0ZDOeD1gI84Dd_5kLLJ1OM0XHwexvtdj5tsWftCLEb_dsQf0cZqFNQfZSUhati'; //put your server key here

// MongoDB Url
appConfig.dbUrl = 'mongodb://127.0.0.1:27017/Tryste-TmpV1';//  ReactChat
//mongodb+srv://ReactChat:<password>@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
// config.dbUrl = 'mongodb+srv://ReactChat:zLv9moWZL0kzPG32@sample.b9ow3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';//  ReactChat

// Port where we'll run the websocket server
appConfig.webSocketsServerPort = process.env.PORT || "1337";


module.exports = appConfig;
