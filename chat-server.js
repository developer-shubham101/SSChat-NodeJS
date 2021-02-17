// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var mongoose = require('mongoose');

var FCM = require('fcm-node');

//SSChat React
// var serverKey = 'AAAA5sgZE7o: APA91bGdnxQsMAvPjrHmEdcjIWseqPMJA_89mq3Y - Wu9EZXiAtzUjGJx1ldPzEvu2YunT6xeFbzP2sEJkoZYP7Zqip0 - bkzS3YX1KD8yVPm - DGL0RRHUso2Yrd1Rdjxc_B_sH56pnb4d';

//Tryst
var serverKey = 'AAAAP4u6PVI:APA91bEWx0iGiQT4_4RYXd5sW3eeQ3ThQwGfA2scuWWqrvObMs0OMiIpsPhBvcrXlW_oSJAJHw_qjq0ZDOeD1gI84Dd_5kLLJ1OM0XHwexvtdj5tsWftCLEb_dsQf0cZqFNQfZSUhati'; //put your server key here
var fcm = new FCM(serverKey);

var cons = {};
var loginUsers = {}


// var dbUrl = 'mongodb://127.0.0.1:27017/ReactChat';
var dbUrl = 'mongodb://127.0.0.1:27017/Tryste-Tmp';

var UsersModel = mongoose.model('Users', {

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
});

var MessageSchema = {
	roomId: mongoose.Schema.Types.ObjectId,

	message: String,
	message_type: String,

	media: String,

	receiver_id: String,
	time: Date,

	sender_id: String,
	message_content: Object
};

var RoomModel = mongoose.model('Room', {
	users: Object,

	type: String, //group/individual
	last_message: Object,
	last_message_time: Date,
	message_info: Object,
	group_details: Object,
	users_meta: Object,
	userList: Array,

	unread: Object,
});


/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
		.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
// ... in random order
colors.sort(function (a, b) { return Math.random() > 0.5; });

/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
	// Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket request is just
	// an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});



var responseError = (code, type, message, toString) => {
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

var responseSuccess = (code, type, dataObject, message, toString) => {
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

var MsgModel = {};


function isFine(item) {

	if (item == '' || item == 'undefined' || item == null) {

		return false;
	} else {

		return true;
	}
}


function chatRequest(request) {

	// accept connection - you should check 'request.origin' to make sure that
	// client is connecting from your website
	// (http://en.wikipedia.org/wiki/Same_origin_policy)
	var connection = request.accept(null, request.origin);
	// we need to know client index to remove them on 'close' event
	var index = clients.push(connection) - 1;
	var userName = false;
	var userColor = false;

	console.log((new Date()) + ' Connection accepted.');

	// send back chat history
	if (history.length > 0) {

		connection.sendUTF(responseSuccess(200, "history", history, "Success.", true));
	}

	// user sent some message
	connection.on('message', function (message) {
		console.log("On Message on chat", message);

		// UsersModel.find({}, (err, messages) => {
		// 	//res.send(messages);
		// 	console.log(`On connect Error:::${err} users:::`, messages);
		// });


		if (message.type === 'utf8') { // accept only text
			if (userName === false) { // first message sent by user is their name
				// remember user name
				userName = htmlEntities(message.utf8Data);
				// get random color and send it back to the user
				userColor = colors.shift();


				connection.sendUTF(responseSuccess(200, "color", userColor, "User list.", true));

				console.log((new Date()) + ' User is known as: ' + userName
					+ ' with ' + userColor + ' color.');

			} else { // log and broadcast the message
				console.log((new Date()) + ' Received Message from '
					+ userName + ': ' + message.utf8Data);

				// we want to keep history of all sent messages
				var obj = {
					time: (new Date()).getTime(),
					text: htmlEntities(message.utf8Data),
					author: userName,
					color: userColor
				};
				history.push(obj);
				history = history.slice(-100);

				// broadcast message to all connected clients

				var json = connection.sendUTF(responseSuccess(200, "message", obj, "Obj", true));

				for (var i = 0; i < clients.length; i++) {
					console.log("Message Data Sent To All Users");
					clients[i].sendUTF(json);
				}
			}
		}
	});

	// user disconnected
	connection.on('close', function (connection) {
		if (userName !== false && userColor !== false) {
			console.log((new Date()) + " Peer "
				+ connection.remoteAddress + " disconnected.");
			// remove user from the list of connected clients
			clients.splice(index, 1);
			// push back user's color to be reused by another user
			colors.push(userColor);
		}
	});
}

//MARK:- Private Functions

function getLastMessage(message, type) {
	switch (type) {
		case "TEXT":
			return message;
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
			return message;
	}

}

function updateOnlineStatus(userId, online) {
	///Create new object to update online and lst seen status
	let dataToUpdate = { last_seen: new Date(), is_online: online };

	UsersModel.findOneAndUpdate({ userId: userId }, dataToUpdate, { new: false, useFindAndModify: false }, (err, updated_user) => {
		console.log("On Update Online Status:: ", err, updated_user);

		updated_user["is_online"] = online;

		/// Notify to all active user about that user status
		Object.keys(cons).forEach((element) => {
			cons[element].sendUTF(responseSuccess(200, "userModified", updated_user, "Online/Offline Status Changed", true));
		});

	});
}
function createNewRoomNotify(savedMessage) {
	let fondData = { userId: { $in: savedMessage.userList } };
	// { "userName": requestData.userName, "password": requestData.password };
	UsersModel.find(fondData, (err, userList) => {

		userList = userList.map((element) => {
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

		let responseData = { newRoom: savedMessage, userList: userList };
		// console.log(`Room Saved.`, savedMessage.userList);
		savedMessage.userList.forEach(element => {
			// console.log(`Room Saved.`, element, cons[element]);
			if (cons[element]) {
				cons[element].sendUTF(responseSuccess(200, "createRoom", responseData, "New Room Created", true));
			}

		});
	});
}
function createNewRoom(findObject, connection) {

	var room = new RoomModel(findObject);

	room.save().then((savedMessage) => {
		// console.log(`Room Saved.`, savedMessage);
		if (savedMessage) {

			createNewRoomNotify(savedMessage);

		} else {
			connection.sendUTF(responseError(500, "createRoom", "Failed To create room", true));
		}

	}).catch((ex) => {
		console.error(`Room Failed to Saved.`, ex);
		connection.sendUTF(responseError(500, "createRoom", "Failed To create room", true));
	});


}
//MARK:- Oprations
async function roomRequest(requestData, connection) {

	if (requestData.type == 'allRooms') {
		if (!requestData.userList) {
			connection.sendUTF(responseError(400, "allRooms", "Please enter user id", true));
		}
		let userList = requestData.userList;

		let findObject = {};
		userList.forEach((element) => {
			findObject[`users.${element}`] = true;
		});

		console.log(findObject);
		RoomModel.find(findObject/* , { sort: { last_message_time: -1 } } */, (err, messages) => {
			//res.send(messages);
			// console.log(`On connect Error:::${err} data:::`, messages);
			// connection.sendUTF(`user login successfully ${messages}`);

			if (messages && messages.length > 0) {
				console.log(`Room Data Found....`);
				let usersList = [];
				messages.forEach((element) => {
					usersList = usersList.concat(Object.keys(element.users));
				});

				usersList = [...new Set(usersList)];

				let fondData = { userId: { $in: usersList } };
				// { "userName": requestData.userName, "password": requestData.password };
				UsersModel.find(fondData, (err, userList) => {

					userList = userList.map((element) => {
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

					let responseData = { roomList: messages, userList: userList };
					// console.log(`responseData::: `, responseData);
					connection.sendUTF(responseSuccess(200, "allRooms", responseData, "Data Found", true));
					// userList
				});
			} else {
				connection.sendUTF(responseError(404, "allRooms", "Not Found", true));
			}
		});
	} else if (requestData.type == 'createRoom') {

		var userList = requestData.userList;


		// var roomType = requestData.roomType;
		let findObject = {};
		userList.forEach((element) => {
			findObject[`users.${element}`] = true;
		});

		/* 
		
		users: Object,

	type: String, //group/individual
	last_message: Object,
	message_info: Object,
	users_meta: Object,
	userList: Array,

	unread: Object,
	*/
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
		if (userList.length == 2) {

			let group = await RoomModel.find({ userList: { $all: userList, $size: userList.length } });
			// let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true , userList: {$size : 2}});
			// let group = await RoomModel.find({ 'users.anil' : true,  'users.shubhum' : true });
			if (group.length) {
				console.log('Group already exists');

				createNewRoomNotify(group[0]);

				// connection.sendUTF(responseSuccess(200, "createRoom", group[0], "New Room Created", true));
			} else {
				createNewRoom(findObject, connection);
			}
		} else {
			createNewRoom(findObject, connection);
		}

	}

}
async function allUser(requestData, connection) {
	if (requestData.type == 'allUsers') {
		UsersModel.find({}, (err, messages) => {
			//res.send(messages);
			console.log(`On UsersModel.find Error:::${err} responses:::`, messages);
			if (messages && messages.length > 0) {
				connection.sendUTF(responseSuccess(200, "allUsers", messages, "User list.", true));
			} else {
				connection.sendUTF(responseError(404, "allUsers", "Not Found", true));
			}
		});
	} else {
		connection.sendUTF(responseError(500, "allUsers", "Action/Path not found.", true));
	}

}
async function loginRequest(requestData, connection) {

	if (requestData.type == 'login') {

		// login validation
		if (!isFine(requestData.userName) || !isFine(requestData.password)) {

			connection.sendUTF(responseError(400, "login", "Username and password are required.", true));

		} else {

			let fondData = {
				"userName": requestData.userName,
				"password": requestData.password,

			};
			UsersModel.findOne(fondData, async (err, userData) => {

				console.log('userData', userData);

				if (!userData) {
					connection.sendUTF(responseError(401, "login", "Unauthorized", true));
				} else if (!isFine(userData['userId'])) {
					connection.sendUTF(responseError(401, "login", "UserId not found.", true));

				} else {

					let userId = userData['_id'];

					connection['uId'] = userId;
					cons[userId] = connection;
					loginUsers[userId] = userData;

					userData.fcm_token = isFine(requestData.fcm_token) ? requestData.fcm_token : '';
					userData.device_id = isFine(requestData.device_id) ? requestData.device_id : '';
					userData.is_online = true;
					userData.last_seen = new Date();

					await userData.save();

					//res.send(messages);
					// console.log(`On connect Error:::${err} users:::`, userData);

					console.log(`user login successfully`, userData);
					connection.sendUTF(responseSuccess(200, "login", userData, "Login Success", true));

					updateOnlineStatus(userId, true);

				}

			});

		}


	} else if (requestData.type == 'loginOrCreate') {

		if (!isFine(requestData.userName)) {

			connection.sendUTF(responseError(400, "loginOrCreate", "Username is required.", true));

		} else if (!isFine(requestData.password)) {

			connection.sendUTF(responseError(400, "loginOrCreate", "Password is required.", true));

		} else if (!isFine(requestData.userId)) {

			connection.sendUTF(responseError(400, "loginOrCreate", "UserId is required.", true));

		} else {

			let fondData = {
				"userName": requestData.userName,
				"password": requestData.password,
				"userId": requestData.userId,

			};

			UsersModel.findOne(fondData, async (err, userData) => {

				if (!userData) {

					fondData.fcm_token = isFine(requestData.fcm_token) ? requestData.fcm_token : '';
					fondData.device_id = isFine(requestData.device_id) ? requestData.device_id : '';

					fondData.is_online = true;
					fondData.last_seen = new Date();
					var user = new UsersModel(fondData);
					user.save().then((savedMessage) => {
						// console.log(`User Saved.`, savedMessage);
						connection.sendUTF(responseSuccess(200, "loginOrCreate", savedMessage, "Success.", true));
					}).catch((ex) => {
						console.error(`User Failed to Saved.`, ex);
						connection.sendUTF(responseError(500, "loginOrCreate", "Internal Server Error.", true));
					});

				} else {

					let userId = userData['userId'];

					connection['uId'] = userId;

					cons[userId] = connection;

					loginUsers[userId] = userData;

					userData.fcm_token = isFine(requestData.fcm_token) ? requestData.fcm_token : '';
					userData.device_id = isFine(requestData.device_id) ? requestData.device_id : '';
					await userData.save();

					connection.sendUTF(responseSuccess(200, "login", userData, "Login Success", true));

					updateOnlineStatus(userId, true);
				}

			});
		}

	} else if (requestData.type == 'register') {

		// register validation
		if (!isFine(requestData.userName)) {
			connection.sendUTF(responseError(400, "register", "Username is required.", true));

		} else if (!isFine(requestData.password)) {

			connection.sendUTF(responseError(400, "register", "Password is required.", true));

		} else if (!isFine(requestData.userId)) {

			connection.sendUTF(responseError(400, "register", "UserId is required.", true));

		} else {

			UsersModel.find({ userId: requestData.userId, userName: requestData.userName }).then((userData) => {
				console.log('userData', userData);
				if (userData.length) {
					return connection.sendUTF(responseError(400, "register", "User is already exist.", true));
				}

				let fondData = {
					"userName": requestData.userName,
					"password": requestData.password,
					"userId": requestData.userId,
					"is_online": true,
					"last_seen": new Date
				};
				var user = new UsersModel(fondData);
				user.save().then((savedMessage) => {
					console.log(`User Saved.`, savedMessage);

					connection.sendUTF(responseSuccess(200, "register", savedMessage, "Success.", true));
				}).catch((ex) => {
					console.error(`User Failed to Saved.`, ex);


					connection.sendUTF(responseError(500, "register", "Internal Server Error.", true));
				});

			})
		}

	} else if (requestData.type == 'updateProfile') {

		/* if (!isFine(requestData._id)) {
			connection.sendUTF(responseError(400, "updateProfile", "ObjectId is not provided.", true));
		} else */ if (!isFine(requestData.userId)) {
			connection.sendUTF(responseError(400, "updateProfile", "userId is required.", true));
		} else {
			var dataToUpdate = {};
			if (isFine(requestData.userName)) {
				dataToUpdate['userName'] = requestData.userName;
			}

			if (isFine(requestData.password)) {
				dataToUpdate['password'] = requestData.password;
			}

			// if (isFine(requestData.userId)) {
			// 	dataToUpdate['userId'] = requestData.userId;
			// }

			if (isFine(requestData.firstName)) {
				dataToUpdate['firstName'] = requestData.firstName;
			}

			if (isFine(requestData.lastName)) {
				dataToUpdate['lastName'] = requestData.lastName;
			}

			if (isFine(requestData.profile_pic)) {
				dataToUpdate['profile_pic'] = requestData.profile_pic;
			}

			if (isFine(requestData.email)) {
				dataToUpdate['email'] = requestData.email;
			}

			if (isFine(requestData.fcm_token)) {
				dataToUpdate['fcm_token'] = requestData.fcm_token;
			}

			if (isFine(requestData.device_id)) {
				dataToUpdate['device_id'] = requestData.device_id;
			}

			UsersModel.findOneAndUpdate({ /* _id: requestData._id,  */userId: requestData.userId }, dataToUpdate, { new: false, useFindAndModify: false }, (err, updated_user) => {
				if (err) {
					connection.sendUTF(responseError(500, "updateProfile", "Internal Server Error.", true));
				}

				if (updated_user == null) {
					connection.sendUTF(responseError(400, "updateProfile", "No user found.", true));
				}

				connection.sendUTF(responseSuccess(200, "updateProfile", updated_user, "Data updated successfully.", true));




				UsersModel.find({ _id: mongoose.Types.ObjectId(updated_user._id) }, (err, findUser) => {

					if (findUser && findUser.length > 0) {
						/// Notify to all active user about that user profile
						Object.keys(cons).forEach((element) => {
							cons[element].sendUTF(responseSuccess(200, "userModified", findUser[0], "User Details Changed", true));
						});
					}
				});

			});
		}

	} else {
		connection.sendUTF(responseError(404, "noActionInLogin", "Action/Path not found.", true));
	}
}

function formatTheMessages(message) {
	message = JSON.parse(JSON.stringify(message));
	// message["timestamp"] = new Date(message.time).getTime();

	message = Object.assign({}, message, { "timestamp": new Date(message.time).getTime() });
	// console.log("Message::::", message);
	return message;

}

async function messageRequest(requestData, connection) {

	var key = requestData.room
	console.log('key-----', key);

	console.log("MsgModel:::", MsgModel);
	if (MsgModel[`message_${key}`] == undefined) {
		MsgModel[`message_${key}`] = mongoose.model(`message_${key}`, MessageSchema);
	}


	if (requestData.type == 'allMessage') {

		let findObject = {};

		MsgModel[`message_${key}`].find(findObject, (err, messages) => {
			//res.send(messages);
			console.log(`On connect Error:::${err} data:::`, messages);

			if (messages && messages.length > 0) {
				console.log(`All Message Found....`);
				let formatMessages = messages.map((element) => {
					return formatTheMessages(element);
				});

				connection.sendUTF(responseSuccess(200, "message", formatMessages, "message All list", true));
			} else {
				connection.sendUTF(responseError(404, "message", "Data not found.", true));
			}
		});

	} else if (requestData.type == 'addMessage') {

		let messageData = requestData;
		console.log("Message Data" + messageData.roomId);
		var user = new MsgModel[`message_${key}`]({
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
		user.save().then((savedMessage) => {
			console.log(`Message Saved.`, savedMessage);


			RoomModel.findById(mongoose.Types.ObjectId(messageData.roomId)).then((room, err) => {
				console.log('messageRequest Room list::::', room);
				// console.log('room list::::', cons);

				let newMessageInfo = {};
				if (room["unread"] != undefined) {
					let unreadObject = room.users;
					let userIdOfUnreadMessges = Object.keys(unreadObject);

					let unread = room.unread;

					userIdOfUnreadMessges.forEach((userId) => {
						let oldCount = unread[userId];
						let newUnreadMessage = oldCount ? oldCount + 1 : 1;
						if (userId == messageData.sender_id) {
							unread[userId] = 0;
						} else {
							unread[userId] = newUnreadMessage;
						}
					});
					newMessageInfo = { unread: unread }

				} else {
					let unreadObject = room.users;
					let userIdOfUnreadMessges = Object.keys(unreadObject);

					let unread = {};
					userIdOfUnreadMessges.forEach((userId) => {
						let newUnreadMessage = 1;
						if (userId == messageData.sender_id) {
							unread[userId] = 0;
						} else {
							unread[userId] = newUnreadMessage;
						}

					});

					newMessageInfo = { unread: unread }
				}

				newMessageInfo["last_message"] = getLastMessage(messageData.message, messageData.message_type);
				newMessageInfo["last_message_time"] = new Date();

				console.log('MessageRequest:::: newMessageInfo:: ', newMessageInfo);


				/* users: Object,

	type: String, //group/individual
	last_message: Object,
	message_info: Object,
	users_meta: Object,
	userList: Array */
				RoomModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(room._id) }, newMessageInfo, { new: true, useFindAndModify: false }, (err, updatedRoom) => {
					// console.log("RoomModel::: update", err, updatedRoom);
					if (err) {

					} else {
						room.userList.forEach(user => {
							if (cons.hasOwnProperty(user)) {
								cons[user].sendUTF(responseSuccess(200, "allRoomsModified", updatedRoom, "Modified", true));
							} else {
								console.log('user is not login', user);
							}
						});
					}

				});

				room.userList.forEach(user => {
					if (cons.hasOwnProperty(user)) {
						console.log('user is login', user);

						cons[user].sendUTF(responseSuccess(201, "message", formatTheMessages(savedMessage), "Data Found", true));

					} else {

						console.log('user is not login', user);
					}
				});

				let receverUserListId = room.userList.filter((element) => {
					return element != messageData.sender_id;
				});


				let fondData = { userId: { $in: room.userList } };
				// { "userName": requestData.userName, "password": requestData.password };
				UsersModel.find(fondData, (err, userList) => {

					let receverUserList = userList.filter((element) => {
						return element.userId != messageData.sender_id;
					});
					let senderUserDetail = userList.find((element) => {
						return element.userId == messageData.sender_id;
					});

					let fcmTokens = receverUserList.map((element) => {
						return element.fcm_token;
					});
					console.log(`fcmTokens::: `, fcmTokens);

					var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
						// to: 'dmR-mgKqSuGymuJNQ5CsSR:APA91bFkMkphaI-La1rfnNOX1P8ND8aAzy5hjt4qRN4wqpGjWgfHLB3TbkSEhrQsf9v7_dDwlpv7l8fqwTiPOiHAEItKKS0gePF9hTN5nSfNqzBu1BlRGJC04W9BVXPaNEgjJS3ouBzV',

						"registration_ids": fcmTokens,
						collapse_key: 'your_collapse_key',

						notification: {
							title: `New message from ${senderUserDetail.userName}`,
							body: 'Body of your push notification'
						},

						data: {  //you can send only notification or only data(or include both)
							my_key: 'my value',
							my_another_key: 'my another value'
						}
					};

					/* fcm.send(message, function (err, response) {
						if (err) {
							console.log("Something has gone wrong!");
						} else {
							console.log("Successfully sent with response: ", response);
						}
					}); */

				});




			});
		}).catch((ex) => {
			console.error(`Message Failed to Saved.`, ex);
			connection.sendUTF(responseSuccess(500, "message", savedMessage, "message All list", true));
		});
		// }catch(ex){
		// 	console.log("Save message error:: ",ex);
		// }

	}


}
function createConnection(requestData, connection) {
	// console.log("createConnection::", requestData);
	if (requestData.type == "create") {
		if (isFine(requestData.user_id)) {
			let userId = requestData.user_id;

			connection['uId'] = userId;
			cons[userId] = connection;

			console.log("Connection Updated", cons);
			connection.sendUTF(responseSuccess(200, "create_connection", {}, "Connection Established.", true));
		} else {
			connection.sendUTF(responseError(404, "create_connection", "Action/Path not found.", true));
		}
	}

}
function acceptRequest(request) {

	var connection = request.accept(null, request.origin);

	console.log((new Date()) + ' Connection accepted room.');


	// user sent some message
	connection.on('message', async function (message) {
		console.log("On Message on login" + message.utf8Data);

		try {
			let requestData = JSON.parse(message.utf8Data);
			if (requestData.request == 'room') {
				roomRequest(requestData, connection);
			} else if (requestData.request == 'users') {
				allUser(requestData, connection);
			} else if (requestData.request == 'login') {
				loginRequest(requestData, connection);
			} else if (requestData.request == 'message') {
				messageRequest(requestData, connection);
			} else if (requestData.request == 'create_connection') {
				createConnection(requestData, connection);
			} else {
				connection.sendUTF(responseError(404, "unknown", "No route found", true));
			}
		} catch (ex) {
			connection.sendUTF(responseError(500, "unknown", "No route found", true));
		}

	});

	// user disconnected
	connection.on('close', function (event) {
		console.log((new Date()) + 'connection closed', connection.uId, event);

		let userId = connection.uId;
		if (userId) {
			updateOnlineStatus(userId, false);
		}
	});
}
function originIsAllowed(request) {
	// put logic here to detect whether the specified origin is allowed.
	console.log(`origin:::   ${request.resourceURL.pathname}`);
	acceptRequest(request);
	/* 	if ("/v1/chat" === request.resourceURL.pathname) {
			chatRequest(request);
			return true;
		} else if ("/v1/login" === request.resourceURL.pathname) {
			loginRequest(request);
			return true;
		} else if ("/v1/room" === request.resourceURL.pathname) {
			roomRequest(request);
			return true;
		} else if ("/v1/message" === request.resourceURL.pathname) {
			console.log('request........', request.resourceURL.query.key);
			messageRequest(request);
			return true;
		} else if ('/v1/register' === request.resourceURL.pathname) {
			registerRequest(request);
			return true;
		} else if ('/v1/users' === request.resourceURL.pathname) {
			console.log('all_users request');
			allUser(request);
			return true;
		} */

	return true

}
// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');


	if (!originIsAllowed(request)) {
		// Make sure we only accept requests from an allowed origin
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}
	// chatRequest(request);
});


mongoose.connect(dbUrl, {
	useNewUrlParser: true,
	useUnifiedTopology: true,

}, (err) => {
	console.log('mongodb connected', err);
})
