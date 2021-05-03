// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
// "use strict";


// Optional. You will see this name in eg. 'ps' or 'top' command
import {IncomingMessage, ServerResponse} from "http";
import {connection, request} from "websocket";
import {MongoError} from "mongodb";
import {NativeError} from "mongoose";
import {IUserDocument} from "./users/users.types";
import {UserModel} from "./users/users.model";

process.title = 'node-chat';


// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var mongoose = require('mongoose');
let config = require("./config");

let FCM = require('fcm-node');
let Validator = require('validatorjs');

let fcm = new FCM(config.serverKey);

let allConnections: any = {};
let loginUsers: any = {};

let userModelSchema = {

    userName: String,
    password: String,
    firstName: String,
    lastName: String,
    profile_pic: String,
    userId: Number,
    email: String,
    device_id: String,
    fcm_token: String,
    last_seen: Date,
    is_online: Boolean
}
var UsersModel = mongoose.model('Users', userModelSchema);


let MessageModel = mongoose.model(`messages`, {
    roomId: mongoose.Schema.Types.ObjectId,

    message: String,
    message_type: String,

    media: String,

    receiver_id: String,
    time: Date,

    sender_id: String,
    message_content: Object
});

var RoomModel = mongoose.model('Room', {
    users: Object,

    type: String, //group/individual
    last_message: Object,
    last_message_time: Date,
    message_info: Object,
    group_details: Object,
    users_meta: Object,
    userList: Array,

    createBy: String,

    unread: Object,
});


var BlockModel = mongoose.model('Block', {
    blockedBy: String,
    blockedTo: String,
    isBlock: Boolean
});

/**
 * HTTP server
 */
let server = http.createServer((request: IncomingMessage, response: ServerResponse) => {
    // set response header
    response.writeHead(200, {'Content-Type': 'text/html'});

    // set response content
    response.write('<html lang="en"><body><p>This is home Page.</p></body></html>');
    response.end();
});
server.listen(config.webSocketsServerPort, function () {
    // console.log((new Date()) + " Server is listening on port " + config.webSocketsServerPort);
    console.log("Express server listening on port::: ", config.webSocketsServerPort);

});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});


// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request: request) {
    console.log(`Connection from origin ${request.origin}. At ${new Date()}`);


    if (!ssChat.originIsAllowed(request)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log(`Connection from origin ${request.origin} rejected. At ${new Date()}`);

    }
    // chatRequest(request);
});


class SSChatReact {
    bookingConnectionList: any = {};

    constructor() {

    }

    responseError({
                      code,
                      type,
                      message,
                      toString
                  }: { code: number, type: string, message: string, toString: boolean }): any {
        let data = {
            statusCode: code,
            message: message,
            data: {},
            type: type
        };
        if (toString) {
            return JSON.stringify(data);
        } else {
            return data;
        }

    }

    responseSuccess({
                        code,
                        type,
                        dataObject,
                        message,
                        toString
                    }: { code: number, type: string, dataObject: any, message: string, toString: boolean }): any {
        let data = {
            statusCode: code,
            message: message,
            data: dataObject,
            type: type
        };
        if (toString) {
            return JSON.stringify(data);
        } else {
            return data;
        }

    }

    isFine = (item: any) => {

        if (item == '' || item == 'undefined' || item == null) {

            return false;
        } else {

            return true;
        }
    }

    //MARK:- Private Functions

    originIsAllowed = (request: request) => {
        // put logic here to detect whether the specified origin is allowed.
        console.log(`origin:::   ${request.resourceURL.pathname}`);
        if (request.resourceURL.pathname === "/V1") {
            this.acceptRequest(request);
            return true;
        }
        return false;
    }

    getLastMessage = (message: string, type: string) => {
        switch (type) {
            case "TEXT":
                return message.substring(0, 100);
            case "IMAGE":
                return "📷";
            case "DOCUMENT":
                return "📄";
            case "LOCATION":
                return "📍";
            case "CONTACT":
                return "📞";
            case "VIDEO":
                return "🎞️";
            case "REPlAY":
                return "Replay";
            default:
                return message.substring(0, 100);
        }

    }

    sendMessageToAll = (message: any) => {
        Object.keys(allConnections).forEach((element) => {
            console.log(`Connection:: ${allConnections[element].length}`);
            allConnections[element].forEach((connection: connection) => {
                connection.sendUTF(message);
            });
        });
    }

    sendMessageToUser = (user: string, message: any) => {
        if (allConnections[user]) {
            console.log(`Connection:: ${user} ${allConnections[user].length}`);
            allConnections[user].forEach((connection: any) => {
                connection.sendUTF(message);
            });
        }
    }

    addConnectionToList = (connection: connection, userId: string | number) => {
        // @ts-ignore
        connection['uId'] = userId;
        // @ts-ignore
        connection['connectionID'] = Date.now();
        if (!allConnections[userId] || allConnections[userId] == undefined) {
            allConnections[userId] = [connection];
        } else {
            allConnections[userId].push(connection);
        }
    }

    removeConnectionFromList = (connection: connection) => {

        // @ts-ignore
        let userId = connection.uId;
        // @ts-ignore
        let connectionID = connection.connectionID;
        if (!(!allConnections[userId] || allConnections[userId] == undefined)) {
            let filteredConnections = allConnections[userId].filter((element: any) => {
                return element.connectionID != connectionID;
            });
            allConnections[userId] = filteredConnections;
        }
    }

    updateOnlineStatus = (userId: string | number, online: boolean) => {
        ///Create new object to update online and lst seen status
        let dataToUpdate = {last_seen: new Date(), is_online: online};

        UsersModel.findOneAndUpdate({userId: userId}, dataToUpdate, {
            new: false,
            useFindAndModify: false
        }, (err: any, updated_user: IUserDocument) => {
            if (updated_user) {
                console.log("On Update Online Status:: ", err, updated_user);

                updated_user["is_online"] = online;

                /// Notify to all active user about that user status
                this.sendMessageToAll(this.responseSuccess({
                    code: 200,
                    type: "userModified",
                    dataObject: updated_user,
                    message: "Online/Offline Status Changed",
                    toString: true
                }));

            }
        });
    }

    createNewRoomNotify = (savedMessage: any) => {
        let fondData = {userId: {$in: savedMessage.userList}};
        // { "userName": requestData.userName, "password": requestData.password };
        UsersModel.find(fondData, (err: any, userList: any) => {

            userList = userList.map((element: any) => {
                let x = Object.assign({}, {
                    "_id": "",
                    "userName": "",
                    "password": "",
                    "userId": 0,
                    "fcm_token": "",
                    "device_id": "",
                    "is_online": false,
                    "last_seen": "",
                    "firstName": "",
                    "profile_pic": ""
                }, JSON.parse(JSON.stringify(element)))
                // console.log(x);
                return x;
            })

            let responseData = {newRoom: savedMessage, userList: userList};
            // console.log(`Room Saved.`, savedMessage.userList);
            savedMessage.userList.forEach((element: any) => {
                // console.log(`Room Saved.`, element, cons[element]);
                this.sendMessageToUser(element, this.responseSuccess({
                    code: 200,
                    type: "createRoom",
                    dataObject: responseData,
                    message: "New Room Created",
                    toString: true
                }));
            });
        });
    }

    createNewRoom = (findObject: any, connection: connection) => {

        var room = new RoomModel(findObject);

        room.save().then((savedMessage: any) => {
            // console.log(`Room Saved.`, savedMessage);
            if (savedMessage) {

                this.createNewRoomNotify(savedMessage);

            } else {
                connection.sendUTF(this.responseError({
                    code: 500,
                    type: "createRoom",
                    message: "Failed To create room",
                    toString: true
                }));
            }

        }).catch((ex: any) => {
            console.error(`Room Failed to Saved.`, ex);
            connection.sendUTF(this.responseError({
                code: 500,
                type: "createRoom",
                message: "Failed To create room",
                toString: true
            }));
        });


    }

    currentLocation = async (requestData: any, connection: connection) => {

        if (requestData.type == 'update') {
            if (!this.isFine(requestData.bookingId)) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "currentLocation",
                    message: "bookingId required.",
                    toString: true
                }));
            } else {
                if (this.bookingConnectionList[requestData.bookingId] != null) {
                    this.bookingConnectionList[requestData.bookingId].forEach((con: connection) => {
                        let response = {
                            current_location: requestData.current_location,
                            userId: requestData.userId
                        };
                        con.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "currentLocation",
                            dataObject: response,
                            message: "Block Status Changed",
                            toString: true
                        }));
                    });
                }
            }
        } else if (requestData.type == 'register') {
            if (!this.isFine(requestData.bookingId)) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "currentLocationRegister",
                    message: "bookingId required.",
                    toString: true
                }));
            } else {
                let tmpBookingConnectionList = this.bookingConnectionList[requestData.bookingId];
                if (tmpBookingConnectionList != undefined) {
                    // tmpBookingConnectionList.push(requestData.userId);
                    tmpBookingConnectionList.push(connection);
                    // connection.sendUTF(this.responseError(400, "currentLocation", "user is required.", true));
                } else {
                    // tmpBookingConnectionList = [requestData.userId];
                    tmpBookingConnectionList = [connection];
                }
                this.bookingConnectionList[requestData.bookingId] = tmpBookingConnectionList;
            }
        }
    }

    //MARK:- Oprations
    roomRequest = async (requestData: any, connection: connection) => {

        if (requestData.type == 'roomsDetails') {
            if (!requestData.roomId) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "roomsDetails",
                    message: "Please enter room id",
                    toString: true
                }));
            }
            let roomId = requestData.roomId;

            RoomModel.find({_id: mongoose.Types.ObjectId(roomId)}).exec((err: NativeError, messages: any) => {
                //res.send(messages);
                // console.log(`On connect Error:::${err} data:::`, messages);
                // connection.sendUTF(`user login successfully ${messages}`);

                if (messages && messages.length > 0) {
                    console.log(`Room Data Found....`, messages);
                    let usersList: any = [];
                    messages.forEach((element: any) => {
                        usersList = usersList.concat(Object.keys(element.users));
                    });

                    // @ts-ignore
                    usersList = [...new Set(usersList)];

                    let fondData = {userId: {$in: usersList}};
                    // { "userName": requestData.userName, "password": requestData.password };
                    UsersModel.find(fondData, (err: any, userList: any) => {

                        userList = userList.map((element: any) => {
                            let x = Object.assign({}, {
                                "_id": "",
                                "userName": "",
                                "password": "",
                                "userId": 0,
                                "fcm_token": "",
                                "device_id": "",
                                "is_online": false,
                                "last_seen": "",
                                "firstName": "",
                                "profile_pic": ""
                            }, JSON.parse(JSON.stringify(element)))
                            // console.log(x);
                            return x;
                        })

                        let responseData = {roomList: messages, userList: userList};
                        // console.log(`responseData::: `, responseData);
                        connection.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "roomsDetails",
                            dataObject: responseData,
                            message: "Data Found",
                            toString: true
                        }));
                        // userList
                    });
                } else {
                    connection.sendUTF(this.responseError({
                        code: 404,
                        type: "roomsDetails",
                        message: "Not Found",
                        toString: true
                    }));
                }
            });
        } else if (requestData.type == 'allRooms') {
            let rules = {
                // userList: 'required|array|min:1'
                userList: 'array'
            };

            let validation = new Validator(requestData, rules);

            if (validation.fails()) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "allRooms",
                    message: validation.errors,
                    toString: true
                }));
            } else {

                let userList = requestData.userList;

                let findObject: any = {};
                userList.forEach((element: any) => {
                    findObject[`users.${element}`] = true;
                });

                console.log(findObject);
                RoomModel.find(findObject).sort({last_message_time: -1}).exec((err: any, messages: any) => {
                    //res.send(messages);
                    // console.log(`On connect Error:::${err} data:::`, messages);
                    // connection.sendUTF(`user login successfully ${messages}`);

                    if (messages && messages.length > 0) {
                        console.log(`Room Data Found....`, messages);
                        let usersList: any = [];
                        messages.forEach((element: any) => {
                            usersList = usersList.concat(Object.keys(element.users));
                        });

                        // @ts-ignore
                        usersList = [...new Set(usersList)];

                        let fondData = {userId: {$in: usersList}};
                        // { "userName": requestData.userName, "password": requestData.password };
                        UsersModel.find(fondData, (err: any, userList: any) => {
                            // console.log("userList", userList);
                            if (err) {
                                connection.sendUTF(this.responseError({
                                    code: 500,
                                    type: "allRooms",
                                    message: "Some technical error",
                                    toString: true
                                }));
                            } else {
                                userList = userList.map((element: any) => {
                                    let x = Object.assign({}, {
                                        "_id": "",
                                        "userName": "",
                                        "password": "",
                                        "userId": 0,
                                        "fcm_token": "",
                                        "device_id": "",
                                        "is_online": false,
                                        "last_seen": "",
                                        "firstName": "",
                                        "profile_pic": ""
                                    }, JSON.parse(JSON.stringify(element)))
                                    // console.log(x);
                                    return x;
                                })

                                let responseData = {roomList: messages, userList: userList};
                                // console.log(`responseData::: `, responseData);
                                connection.sendUTF(this.responseSuccess({
                                    code: 200,
                                    type: "allRooms",
                                    dataObject: responseData,
                                    message: "Data Found",
                                    toString: true
                                }));
                                // userList
                            }
                        });
                    } else {
                        connection.sendUTF(this.responseError({
                            code: 404,
                            type: "allRooms",
                            message: "Not Found",
                            toString: true
                        }));
                    }
                });
            }


        } else if (requestData.type == 'createRoom') {

            let rules = {
                userList: 'required|array|min:1',
                createBy: 'required'
            };

            let validation = new Validator(requestData, rules);

            let userList = requestData.userList;
            let createBy = requestData.createBy;

            if (validation.fails()) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "createRoom",
                    message: validation.errors,
                    toString: true
                }));
            } else {
                // var roomType = requestData.roomType;
                let findObject: any = {};
                userList.forEach((element: any) => {
                    findObject[`users.${element}`] = true;
                });
                if (requestData.room_type == "group") {
                    findObject["type"] = "group";
                    let groupDetails = Object.assign({}, {
                        group_name: "untitled group",
                    }, requestData.group_details);
                    findObject["group_details"] = groupDetails;
                    findObject["type"] = "group";
                } else {
                    findObject["type"] = "individual";
                }

                findObject['last_message_time'] = new Date();
                findObject['userList'] = userList;
                findObject['createBy'] = createBy;

                if (userList.length == 2) {

                    let group = await RoomModel.find({userList: {$all: userList, $size: userList.length}});
                    // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true , userList: {$size : 2}});
                    // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true });
                    if (group.length) {
                        console.log('Group already exists');

                        this.createNewRoomNotify(group[0]);

                        // connection.sendUTF(this.responseSuccess(200, "createRoom", group[0], "New Room Created", true));
                    } else {
                        this.createNewRoom(findObject, connection);
                    }
                } else {
                    this.createNewRoom(findObject, connection);
                }

            }


        } else if (requestData.type == 'checkRoom') {

            var userList = requestData.userList;


            // var roomType = requestData.roomType;
            let findObject: any = {};
            userList.forEach((element: any) => {
                findObject[`users.${element}`] = true;
            });


            let group = await RoomModel.find({userList: {$all: userList, $size: userList.length}});
            // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true , userList: {$size : 2}});
            // let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true });
            if (group.length) {
                // console.log('Group already exists');
                connection.sendUTF(this.responseSuccess({
                    code: 200,
                    type: "checkRoom",
                    dataObject: group[0],
                    message: "Room already exist",
                    toString: true
                }));
            } else {
                // console.log('Group not already exists');
                connection.sendUTF(this.responseSuccess({
                    code: 404,
                    type: "checkRoom",
                    dataObject: {},
                    message: "Room not exist",
                    toString: true
                }));
            }
        } else if (requestData.type == 'roomsModify') {


            var roomId = requestData.roomId;

            if (!this.isFine(roomId)) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "roomsModified",
                    message: "Please add room id.",
                    toString: true
                }));
            } else {
                let dataToUpdate: any = {};
                if (this.isFine(requestData.unread)) {
                    dataToUpdate[`unread.${requestData.unread}`] = 0;
                }

                RoomModel.findOneAndUpdate({_id: mongoose.Types.ObjectId(roomId)}, dataToUpdate, {
                    new: false,
                    useFindAndModify: false
                }, (err: any, updatedRoom: any) => {
                    console.log("updatedRoom:::", updatedRoom);


                    if (err) {
                        connection.sendUTF(this.responseError({
                            code: 500,
                            type: "roomsModified",
                            message: "Internal Server Error.",
                            toString: true
                        }));
                    } else {
                        updatedRoom[`unread`][requestData.unread] = 0;
                        connection.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "roomsModified",
                            dataObject: updatedRoom,
                            message: "Data updated successfully.",
                            toString: true
                        }));
                    }

                });
            }
        }
    }

    allUser = async (requestData: any, connection: connection) => {
        if (requestData.type == 'allUsers') {
            UsersModel.find({}, (err: any, messages: any) => {
                //res.send(messages);
                console.log(`On UsersModel.find Error:::${err} responses:::`, messages);
                if (messages && messages.length > 0) {
                    connection.sendUTF(this.responseSuccess({
                        code: 200,
                        type: "allUsers",
                        dataObject: messages,
                        message: "User list.",
                        toString: true
                    }));
                } else {
                    connection.sendUTF(this.responseError({
                        code: 404,
                        type: "allUsers",
                        message: "Not Found",
                        toString: true
                    }));
                }
            });
        } else {
            connection.sendUTF(this.responseError({
                code: 500,
                type: "allUsers",
                message: "Action/Path not found.",
                toString: true
            }));
        }

    }

    loginRequest = async (requestData: any, connection: connection) => {

        if (requestData.type == 'login') {

            // login validation
            if (!this.isFine(requestData.userName) || !this.isFine(requestData.password)) {

                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "login",
                    message: "Username and password are required.",
                    toString: true
                }));

            } else {

                let fondData = {
                    "userName": requestData.userName,
                    "password": requestData.password,

                };
                UsersModel.findOne(fondData, async (err: any, userData: any) => {

                    console.log('userData', userData);

                    if (!userData) {
                        connection.sendUTF(this.responseError({
                            code: 401,
                            type: "login",
                            message: "Unauthorized",
                            toString: true
                        }));
                    } else if (!this.isFine(userData['userId'])) {
                        connection.sendUTF(this.responseError({
                            code: 401,
                            type: "login",
                            message: "UserId not found.",
                            toString: true
                        }));

                    } else {

                        let userId: string | number = userData['_id'];

                        this.addConnectionToList(connection, userId);

                        loginUsers[userId] = userData;

                        userData.fcm_token = this.isFine(requestData.fcm_token) ? requestData.fcm_token : '';
                        userData.device_id = this.isFine(requestData.device_id) ? requestData.device_id : '';
                        userData.is_online = true;
                        userData.last_seen = new Date();

                        await userData.save();

                        //res.send(messages);
                        // console.log(`On connect Error:::${err} users:::`, userData);

                        console.log(`user login successfully`, userData);
                        connection.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "login",
                            dataObject: userData,
                            message: "Login Success",
                            toString: true
                        }));

                        this.updateOnlineStatus(userId, true);

                    }

                });

            }


        } else if (requestData.type == 'loginOrCreate') {

            /*
            * {
      "request": "login",
      "userId": "4",
      "fcm_token": "qasdfghfds",
      "password": "123456",
      "type": "loginOrCreate",
      "userName": "ali@yopmail.com"
    }
    * */
            let rules = {
                userId: 'required|integer|string',
                password: 'required|string',
                userName: 'required|email'
            };

            let errorMessage = {
                email: 'userName must be Email'
            };

            let validation = new Validator(requestData, rules, errorMessage);

            // validation.fails(); // true
            // validation.passes(); // false

            if (validation.fails()) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "loginOrCreate",
                    message: validation.errors,
                    toString: true
                }));

            } else {

                let fondData: any = {
                    "userName": requestData.userName,
                    "password": requestData.password,
                    "userId": requestData.userId,
                };

                UsersModel.findOne(fondData, async (err: any, userData: any) => {

                    if (!userData) {

                        this.isFine(requestData.fcm_token) && (fondData.fcm_token = requestData.fcm_token);
                        this.isFine(requestData.device_id) && (fondData.device_id = requestData.device_id);
                        this.isFine(requestData.firstName) && (fondData.firstName = requestData.firstName);

                        fondData.is_online = true;
                        fondData.last_seen = new Date();
                        let user = new UsersModel(fondData);
                        user.save().then((savedMessage: any) => {
                            // console.log(`User Saved.`, savedMessage);
                            connection.sendUTF(this.responseSuccess({
                                code: 200,
                                type: "loginOrCreate",
                                dataObject: savedMessage,
                                message: "Success.",
                                toString: true
                            }));
                        }).catch((ex: any) => {
                            console.error(`User Failed to Saved.`, ex);
                            connection.sendUTF(this.responseError({
                                code: 500,
                                type: "loginOrCreate",
                                message: "Internal Server Error.",
                                toString: true
                            }));
                        });

                    } else {

                        let userId = userData['userId'];
                        this.addConnectionToList(connection, userId);

                        loginUsers[userId] = userData;

                        this.isFine(requestData.firstName) && (userData.firstName = requestData.firstName);
                        this.isFine(requestData.fcm_token) && (userData.fcm_token = requestData.fcm_token);
                        this.isFine(requestData.device_id) && (userData.device_id = requestData.device_id);

                        await userData.save();

                        connection.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "loginOrCreate",
                            dataObject: userData,
                            message: "Login Success",
                            toString: true
                        }));

                        this.updateOnlineStatus(userId, true);
                    }

                });
            }

        } else if (requestData.type == 'register') {

            // register validation
            if (!this.isFine(requestData.userName)) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "register",
                    message: "Username is required.",
                    toString: true
                }));

            } else if (!this.isFine(requestData.password)) {

                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "register",
                    message: "Password is required.",
                    toString: true
                }));

            } else if (!this.isFine(requestData.userId)) {

                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "register",
                    message: "UserId is required.",
                    toString: true
                }));

            } else {

                UsersModel.find({userId: requestData.userId, userName: requestData.userName}).then((userData: any) => {
                    console.log('userData', userData);
                    if (userData.length) {
                        return connection.sendUTF(this.responseError({
                            code: 400,
                            type: "register",
                            message: "User is already exist.",
                            toString: true
                        }));
                    }

                    let fondData = {
                        "userName": requestData.userName,
                        "password": requestData.password,
                        "userId": requestData.userId,
                        "is_online": true,
                        "last_seen": new Date
                    };
                    var user = new UsersModel(fondData);
                    user.save().then((savedMessage: any) => {
                        console.log(`User Saved.`, savedMessage);

                        connection.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "register",
                            dataObject: savedMessage,
                            message: "Success.",
                            toString: true
                        }));
                    }).catch((ex: any) => {
                        console.error(`User Failed to Saved.`, ex);


                        connection.sendUTF(this.responseError({
                            code: 500,
                            type: "register",
                            message: "Internal Server Error.",
                            toString: true
                        }));
                    });

                })
            }

        } else if (requestData.type == 'updateProfile') {

            /* if (!this.isFine(requestData._id)) {
                connection.sendUTF(this.responseError(400, "updateProfile", "ObjectId is not provided.", true));
            } else */
            if (!this.isFine(requestData.userId)) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "updateProfile",
                    message: "userId is required.",
                    toString: true
                }));
            } else {
                let dataToUpdate: any = {};
                if (this.isFine(requestData.userName)) {
                    dataToUpdate['userName'] = requestData.userName;
                }

                if (this.isFine(requestData.password)) {
                    dataToUpdate['password'] = requestData.password;
                }

                // if (this.isFine(requestData.userId)) {
                // 	dataToUpdate['userId'] = requestData.userId;
                // }

                if (this.isFine(requestData.firstName)) {
                    dataToUpdate['firstName'] = requestData.firstName;
                }

                if (this.isFine(requestData.lastName)) {
                    dataToUpdate['lastName'] = requestData.lastName;
                }

                if (this.isFine(requestData.profile_pic)) {
                    dataToUpdate['profile_pic'] = requestData.profile_pic;
                }

                if (this.isFine(requestData.email)) {
                    dataToUpdate['email'] = requestData.email;
                }

                if (this.isFine(requestData.fcm_token)) {
                    dataToUpdate['fcm_token'] = requestData.fcm_token;
                }

                if (this.isFine(requestData.device_id)) {
                    dataToUpdate['device_id'] = requestData.device_id;
                }

                UsersModel.findOneAndUpdate({ /* _id: requestData._id,  */
                    userId: requestData.userId
                }, dataToUpdate, {new: false, useFindAndModify: false}, (err: any, updated_user: any) => {
                    if (err) {
                        connection.sendUTF(this.responseError({
                            code: 500,
                            type: "updateProfile",
                            message: "Internal Server Error.",
                            toString: true
                        }));
                    }

                    if (updated_user == null) {
                        connection.sendUTF(this.responseError({
                            code: 400,
                            type: "updateProfile",
                            message: "No user found.",
                            toString: true
                        }));
                    }

                    connection.sendUTF(this.responseSuccess({
                        code: 200,
                        type: "updateProfile",
                        dataObject: updated_user,
                        message: "Data updated successfully.",
                        toString: true
                    }));


                    UsersModel.find({_id: mongoose.Types.ObjectId(updated_user._id)}, (err: any, findUser: any) => {

                        if (findUser && findUser.length > 0) {
                            /// Notify to all active user about that user profile
                            this.sendMessageToAll(this.responseSuccess({
                                code: 200,
                                type: "userModified",
                                dataObject: findUser[0],
                                message: "User Details Changed",
                                toString: true
                            }))
                        }
                    });

                });
            }

        } else {
            connection.sendUTF(this.responseError({
                code: 404,
                type: "noActionInLogin",
                message: "Action/Path not found.",
                toString: true
            }));
        }
    }

    formatTheMessages = (message: any) => {
        message = JSON.parse(JSON.stringify(message));
        // message["timestamp"] = new Date(message.time).getTime();

        message = Object.assign({}, message, {"timestamp": new Date(message.time).getTime()});
        // console.log("Message::::", message);
        return message;

    }
    messageRequest = async (requestData: any, connection: connection) => {

        const key = requestData.room;
        console.log('key-----', key);

        if (!this.isFine(key)) {
            connection.sendUTF(this.responseError({
                code: 400,
                type: "message",
                message: "Room id is required {room}.",
                toString: true
            }));
        } else {

            if (requestData.type === 'allMessage') {

                let findObject = {
                    roomId: mongoose.Types.ObjectId(key)
                };

                MessageModel.find(findObject, (err: any, messages: any) => {
                    //res.send(messages);
                    console.log(`On connect Error:::${err} data:::`, messages);

                    if (messages && messages.length > 0) {
                        console.log(`All Message Found....`);
                        let formatMessages = messages.map((element: any) => {
                            return this.formatTheMessages(element);
                        });

                        connection.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "message",
                            dataObject: formatMessages,
                            message: "message All list",
                            toString: true
                        }));
                    } else {
                        connection.sendUTF(this.responseError({
                            code: 404,
                            type: "message",
                            message: "Data not found.",
                            toString: true
                        }));
                    }
                });

            } else if (requestData.type === 'addMessage') {


                /*
                * {
          * "roomId": "608437be5c7a813378e455b5",
          * "room": "608437be5c7a813378e455b5",
          * "message": "Hiiiiiiiiiiii",
          * "receiver_id": "123456",
          * "message_type": "TEXT",
          *  "sender_id": "4",
          *
          "message_content": {

          },
          "request": "message",
          "type": "addMessage"
        }*/


                let rules = {
                    roomId: 'required|string',
                    room: 'required|string',
                    message_type: 'required|string',
                    sender_id: 'required|integer|string',
                    //message: 'required|string'
                };
                let validation = new Validator(requestData, rules);

                // validation.fails(); // true
                // validation.passes(); // false

                if (validation.fails()) {
                    connection.sendUTF(this.responseError({
                        code: 400,
                        type: "message",
                        message: validation.errors,
                        toString: true
                    }));
                } else {
                    let messageData = requestData;
                    console.log("Message Data" + messageData.roomId);
                    const messageModel = new MessageModel({
                        roomId: mongoose.Types.ObjectId(messageData.roomId),

                        message: messageData.message,
                        message_type: messageData.message_type,

                        media: "",

                        receiver_id: messageData.receiver_id,
                        time: new Date(),

                        sender_id: messageData.sender_id,
                        message_content: messageData.message_content
                    });
                    // try {
                    messageModel.save().then((savedMessage: any) => {
                        // console.log(`Message Saved.`, savedMessage);

                        RoomModel.findById(mongoose.Types.ObjectId(messageData.roomId)).then((room: any, err: any) => {
                            // console.log('messageRequest Room list::::', room);
                            // console.log('room list::::', cons);

                            let newMessageInfo: any = {};
                            if (room["unread"] !== undefined) {
                                let unreadObject = room.users;
                                let userIdOfUnreadMessges = Object.keys(unreadObject);

                                let unread = room.unread;

                                userIdOfUnreadMessges.forEach((userId) => {
                                    let oldCount = unread[userId];
                                    let newUnreadMessage = oldCount ? oldCount + 1 : 1;
                                    if (userId === messageData.sender_id) {
                                        unread[userId] = 0;
                                    } else {
                                        unread[userId] = newUnreadMessage;
                                    }
                                });
                                newMessageInfo = {unread: unread}

                            } else {
                                let unreadObject = room.users;
                                let userIdOfUnreadMessages = Object.keys(unreadObject);

                                let unread: any = {};
                                userIdOfUnreadMessages.forEach((userId) => {
                                    let newUnreadMessage = 1;
                                    if (userId === messageData.sender_id) {
                                        unread[userId] = 0;
                                    } else {
                                        unread[userId] = newUnreadMessage;
                                    }

                                });

                                newMessageInfo = {unread: unread}
                            }

                            newMessageInfo["last_message"] = this.getLastMessage(messageData.message, messageData.message_type);
                            newMessageInfo["last_message_time"] = new Date();

                            console.log('MessageRequest:::: newMessageInfo:: ', newMessageInfo);


                            /* users: Object,

                type: String, //group/individual
                last_message: Object,
                message_info: Object,
                users_meta: Object,
                userList: Array */
                            RoomModel.findOneAndUpdate({_id: mongoose.Types.ObjectId(room._id)}, newMessageInfo, {
                                new: true,
                                useFindAndModify: false
                            }, (err: any, updatedRoom: any) => {
                                // console.log("RoomModel::: update", err, updatedRoom);
                                if (err) {

                                } else {
                                    let messageToSend = this.responseSuccess({
                                        code: 200,
                                        type: "roomsModified",
                                        dataObject: updatedRoom,
                                        message: "Modified",
                                        toString: true
                                    });
                                    room.userList.forEach((user: any) => {
                                        this.sendMessageToUser(user, messageToSend);
                                    });
                                }

                            });

                            let formattedMessages = this.formatTheMessages(savedMessage);

                            let messageToSend = this.responseSuccess({
                                code: 201,
                                type: "message",
                                dataObject: formattedMessages,
                                message: "Data Found",
                                toString: true
                            });
                            room.userList.forEach((user: any) => {
                                this.sendMessageToUser(user, messageToSend);
                            });

                            // let receverUserListId = room.userList.filter((element) => {
                            // 	return element != messageData.sender_id;
                            // });


                            let fondData = {userId: {$in: room.userList}};
                            // { "userName": requestData.userName, "password": requestData.password };
                            UsersModel.find(fondData, (err: any, userList: any) => {

                                let receiverUserList = userList.filter((element: any) => {
                                    return element.userId != messageData.sender_id;
                                });
                                let senderUserDetail = userList.find((element: any) => {
                                    return element.userId == messageData.sender_id;
                                });

                                let fcmTokens = receiverUserList.map((element: any) => {
                                    return element.fcm_token;
                                });
                                console.log(`fcmTokens::: `, fcmTokens);

                                let message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                                    // to: 'dmR-mgKqSuGymuJNQ5CsSR:APA91bFkMkphaI-La1rfnNOX1P8ND8aAzy5hjt4qRN4wqpGjWgfHLB3TbkSEhrQsf9v7_dDwlpv7l8fqwTiPOiHAEItKKS0gePF9hTN5nSfNqzBu1BlRGJC04W9BVXPaNEgjJS3ouBzV',

                                    "registration_ids": fcmTokens,
                                    // collapse_key: 'your_collapse_key',

                                    notification: {
                                        title: `New message from ${senderUserDetail.firstName}`,
                                        body: this.getLastMessage(messageData.message, messageData.message_type)
                                    },

                                    data: {
                                        payload: {
                                            payload: "17",
                                            id: messageData.roomId
                                        },
                                    }
                                };


                                config.isSendPushNotification && fcm.send(message, function (err: any, response: any) {
                                    if (err) {
                                        console.log("Something has gone wrong!");
                                    } else {
                                        console.log("Successfully sent with response: ", response);
                                    }
                                });
                            });
                        });
                    }).catch((ex: any) => {
                        console.error(`Message Failed to Saved.`, ex);
                        connection.sendUTF(this.responseError({
                            code: 500,
                            type: "message",
                            message: "message All list",
                            toString: true
                        }));
                    });
                    // }catch(ex){
                    // 	console.log("Save message error:: ",ex);
                    // }

                }

            } else if (requestData.type === 'updateMessage') {

                /*{
          "room": "608437be5c7a813378e455b5",
          "messageId": "60845847bf1e5b470dba2ccb",
          "message_content": {
            "asdasd": "sdasd"
          },
          "request": "message",
          "type": "updateMessage",
          "message": "asdasdasd"
        }*/

                let rules = {
                    room: 'required|string',
                    messageId: 'required|string',
                    // message: 'string',
                    // message_content: 'object'
                };
                let validation = new Validator(requestData, rules);

                // validation.fails(); // true
                // validation.passes(); // false

                if (validation.fails()) {
                    connection.sendUTF(this.responseError({
                        code: 400,
                        type: "updateMessage",
                        message: validation.errors,
                        toString: true
                    }));
                } else {
                    let dataToUpdate: any = {};

                    this.isFine(requestData.message_content) && (dataToUpdate["message_content"] = requestData.message_content);
                    this.isFine(requestData.message) && (dataToUpdate["message"] = requestData.message);

                    MessageModel.findOneAndUpdate({_id: mongoose.Types.ObjectId(requestData.messageId)}, dataToUpdate, {
                        new: false,
                        useFindAndModify: false
                    }, (err: any, data: any) => {
                        console.warn("updateMessage", err, data);
                        if (data) {
                            //TODO:- Send message to users
                            // this.sendMessageToUser(this.responseSuccess(200, "updateMessage", data, "Modified", true))
                        }
                    });
                }
            }

        }
    }
    createConnection = (requestData: any, connection: connection) => {
        // console.log("createConnection::", requestData);
        if (requestData.type == "create") {
            if (this.isFine(requestData.user_id)) {
                let userId = requestData.user_id;

                this.addConnectionToList(connection, userId);

                // console.log("Connection Updated", cons);
                connection.sendUTF(this.responseSuccess({
                    code: 200,
                    type: "create_connection",
                    dataObject: {},
                    message: "Connection Established.",
                    toString: true
                }));
            } else {
                connection.sendUTF(this.responseError({
                    code: 404,
                    type: "create_connection",
                    message: "Action/Path not found.",
                    toString: true
                }));
            }
        }

    }
    blockUser = async (requestData: any, connection: connection) => {

        if (requestData.type == 'allBlockUser') {
            if (!this.isFine(requestData.user)) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "allBlockUser",
                    message: "user is required.",
                    toString: true
                }));
            } else {

                let dataToUpdate = [{
                    "blockedBy": requestData.user,
                }, {
                    "blockedTo": requestData.user
                }];

                BlockModel.find({
                    $or: dataToUpdate
                }, (err: any, data: any) => {
                    console.warn("allBlockUser", err, data);
                    if (data) {
                        // console.log("allBlockUser", data);
                        /// Notify to all active user about that user status
                        connection.sendUTF(this.responseSuccess({
                            code: 200,
                            type: "allBlockUser",
                            dataObject: data,
                            message: "Block Status Changed",
                            toString: true
                        }));
                    }
                });
            }
        } else if (requestData.type == 'blockUser') {
            // console.log(requestData);

            // blockedBy: String,
            // blockedTo: String,

            // login validation
            if (!this.isFine(requestData.blockedBy) || !this.isFine(requestData.blockedTo)) {
                connection.sendUTF(this.responseError({
                    code: 400,
                    type: "blockUser",
                    message: "BlockedBy and BlockedTo is required.",
                    toString: true
                }));
            } else {

                let dataToUpdate = {
                    "blockedBy": requestData.blockedBy,
                    "blockedTo": requestData.blockedTo,
                    "isBlock": requestData.isBlock,

                };

                BlockModel.updateOne({
                    "blockedBy": requestData.blockedBy,
                    "blockedTo": requestData.blockedTo
                }, dataToUpdate, {upsert: true}, (err: any, data: any) => {
                    console.warn(err, data);
                    if (data) {

                        BlockModel.find({
                            "blockedBy": requestData.blockedBy,
                            "blockedTo": requestData.blockedTo
                        }, (err: any, data: any) => {
                            console.warn("allBlockUser", err, data);
                            if (data) {
                                // console.log("allBlockUser", data);
                                // Notify to all active user about that user status
                                this.sendMessageToUser(requestData.blockedBy, this.responseSuccess({
                                    code: 200,
                                    type: "blockUser",
                                    dataObject: data[0],
                                    message: "Block Status Changed",
                                    toString: true
                                }));
                                this.sendMessageToUser(requestData.blockedTo, this.responseSuccess({
                                    code: 200,
                                    type: "blockUser",
                                    dataObject: data[0],
                                    message: "Block Status Changed",
                                    toString: true
                                }));

                            }
                        });
                    }
                });
            }
        } else {
            connection.sendUTF(this.responseError({
                code: 404,
                type: "noActionInBlockUser",
                message: "Action/Path not found.",
                toString: true
            }));
        }
    }
    acceptRequest = (request: request) => {

        let connection: connection = request.accept("", request.origin);

        console.log({time: new Date(), message: ' Connection accepted room.'});


        // user sent some message
        connection.on('message', async (message) => {
            // console.log("On new request received" + message.utf8Data);

            try {
                let messageString: string = message.utf8Data as string ?? "{}";
                let requestData: any = JSON.parse(messageString);
                if (requestData.request === 'room') {
                    await this.roomRequest(requestData, connection);
                } else if (requestData.request === 'users') {
                    await this.allUser(requestData, connection);
                } else if (requestData.request === 'login') {
                    await this.loginRequest(requestData, connection);
                } else if (requestData.request === 'message') {
                    await this.messageRequest(requestData, connection);
                } else if (requestData.request === 'create_connection') {
                    this.createConnection(requestData, connection);
                } else if (requestData.request === 'block_user') {
                    await this.blockUser(requestData, connection);
                } else if (requestData.request === 'current_location') {
                    await this.currentLocation(requestData, connection);
                } else {
                    connection.sendUTF(this.responseError({
                        code: 404,
                        type: "unknown",
                        message: "No route found",
                        toString: true
                    }));
                }
            } catch (ex) {
                console.log("acceptRequest", ex);
                connection.sendUTF(this.responseError({
                    code: 500,
                    type: "unknown",
                    message: "Server error occurred",
                    toString: true
                }));
            }

        });

        // user disconnected
        connection.on('close', (event) => {

            console.log({
                time: new Date(),
                message: 'connection closed',
                // @ts-ignore
                id: connection.uId,
                event
            });

            this.removeConnectionFromList(connection);
            // @ts-ignore
            let userId = connection.uId;
            if (userId) {
                this.updateOnlineStatus(userId, false);
            }
        });
    }
}

let ssChat = new SSChatReact();
mongoose.connect(config.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,

}, (error: MongoError) => {
    console.log({message: 'mongodb connected', error});
})
