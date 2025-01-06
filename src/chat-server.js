// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';


// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var mongoose = require('mongoose');
let FCM = require('fcm-node');
const fs = require("fs")
const multer = require('multer')
const express = require('express');

var config = require('./config');
var { UsersModel, MessageModel, RoomModel, BlockModel } = require('./model');
const { blockUser } = require('./route/block.route');
const { isFine, responseSuccess, responseError, makeRandomString } = require('./utility');
const { messageRequest } = require('./route/messages.route');
const { roomRequest } = require('./route/room.route');
const { loginRequest } = require('./route/login.route');
const { addConnectionToList, allConnections, removeConnectionFromList } = require('./connections');


const app = express();

const upload = multer({ dest: 'uploads/', preservePath: false })

let fcm = new FCM(config.serverKey);







// route
app.get('/', (req, res) => {
	// Sending This is the home page! in the page
	res.send('This is the home page! in Express');
});

function moveFile(file) {
	let newFileName = `${file.destination}${makeRandomString(22)}.${file.originalname.split('.').pop()}`;

	fs.rename(`./${file.path}`, newFileName, (err) => {
		if (err) console.log(err)
	})

	return newFileName;
}

app.post('/upload', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), function (req, res, next) {
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any
	// console.log(req.body);
	// res.send(JSON.stringify(req.files));

	if (req.files.file && req.files.file.length > 0) {
		let newFileName = moveFile(req.files.file[0]);
		let thumbnailFileName = req.files.thumbnail?.length > 0 ? moveFile(req.files.thumbnail[0]) : '';
		res.send({ status_code: 200, data: { file: newFileName, thumbnail: thumbnailFileName }, response: 'success' });
	} else {
		// res.status(400).send('Please upload a file');
		res.send(JSON.stringify(req.files));
	}

})

app.use('/uploads', express.static(__dirname + '/uploads'));



/**
 * HTTP server
 */
/* var server = http.createServer(function (request, response) {
	// set response header
	response.writeHead(200, { 'Content-Type': 'text/html' });

	// set response content
	response.write('<html><body><p>This is home Page.</p></body></html>');
	response.end();


});
server.listen(config.webSocketsServerPort, function () {
	// console.log((new Date()) + " Server is listening on port " + config.webSocketsServerPort);
	console.log("Express server listening on port::: ", config.webSocketsServerPort);

}); */

var server = http.createServer(app);

server.listen(config.webSocketsServerPort, function () {
	console.log("Express server listening on port::: ", `http://localhost:${config.webSocketsServerPort}`);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket request is just
	// an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});


const acceptRequest = (request) => {

	let connection = request.accept(null, request.origin);

	console.log({ time: new Date(), message: ' Connection accepted room.' });


	// user sent some message
	connection.on('message', async (message) => {
		// console.log("On new request received" + message.utf8Data);

		try {
			let requestData = JSON.parse(message.utf8Data);
			if (requestData.request === 'room') {
				await roomRequest(requestData, connection, this);
			} else if (requestData.request === 'users') {
				await allUser(requestData, connection);
			} else if (requestData.request === 'login') {
				await loginRequest(requestData, connection, this);
			} else if (requestData.request === 'message') {
				await messageRequest(requestData, connection, this);
			} else if (requestData.request === 'create_connection') {
				createConnection(requestData, connection, this);
			} else if (requestData.request === 'block_user') {
				await blockUser(requestData, connection, this);
			} else if (requestData.request === 'current_location') {
				await currentLocation(requestData, connection, this);
			} else {
				connection.sendUTF(responseError(404, "unknown", "No route found", true));
			}
		} catch (ex) {
			console.log("acceptRequest", ex);
			connection.sendUTF(responseError(500, "unknown", "Server error occurred", true));
		}

	});

	// user disconnected
	connection.on('close', (event) => {
		console.log({
			time: new Date(),
			message: 'connection closed',
			id: connection.uId,
			event
		});

		removeConnectionFromList(connection);
		let userId = connection.uId;
		if (userId) {
			updateOnlineStatus(userId, false);
		}
	});
}


const originIsAllowed = (request) => {
	// put logic here to detect whether the specified origin is allowed.
	console.log(`origin:::   ${request.resourceURL.pathname}`);
	if (request.resourceURL.pathname === "/V1") {
		acceptRequest(request);
		return true;
	}
	return false;
}


// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
	console.log(`Connection from origin ${request.origin}. At ${new Date()}`);


	if (!originIsAllowed(request)) {
		// Make sure we only accept requests from an allowed origin
		request.reject();
		console.log(`Connection from origin ${request.origin} rejected. At ${new Date()}`);

	}
});






class SSChatReact {
	bookingConnectionList = {};

	constructor() {

	}





	//MARK:- Private Functions



	getLastMessage = (message, type) => {
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
			case "IMAGE_CANDY":
				return "Candy Image";
			case "VIDEO_CANDY":
				return "Candy Video";
			case "IMAGE_PACK_CANDY":
				return "Candy Pack";
			case "VIDEO_PACK_CANDY":
				return "Candy Pack";
			case "REPlAY":
				return "Replay";
			default:
				return message.substring(0, 100);
		}

	}
	getLastMessageForNotification = (message, type) => {
		switch (type) {
			case "TEXT":
				return message.substring(0, 100);
			case "IMAGE":
				return "📷 Image";
			case "DOCUMENT":
				return "📄 Document";
			case "LOCATION":
				return "📍 Location";
			case "CONTACT":
				return "📞";
			case "VIDEO":
				return "🎞️ Video";
			case "IMAGE_CANDY":
				return "📷 Candy Image";
			case "VIDEO_CANDY":
				return "🎞️ Candy Video";
			case "IMAGE_PACK_CANDY":
				return "📷 Candy Pack";
			case "VIDEO_PACK_CANDY":
				return "🎞️ Candy Pack";
			case "REPlAY":
				return "Replay";
			default:
				return message.substring(0, 100);
		}

	}

	

	sendMessageToUser = (user, message) => {
		if (allConnections[user]) {
			console.log(`Connection:: ${user} ${allConnections[user].length}`);
			allConnections[user].forEach((connection) => {
				connection.sendUTF(message);
			});
		}
	}

	



	/* sendMessageToUser = (user, message) => {
		if (allConnections[user]) {
			allConnections[user].sendUTF(message);
		}
	}

	addConnectionToList = (connection, userId) => {
		connection['uId'] = userId;
		connection['connectionID'] = Date.now();
		allConnections[userId] = connection;
	}

	removeConnectionFromList = (connection) => {

		delete allConnections[userId];
		// let userId = connection.uId;
		// let connectionID = connection.connectionID;
		// if (!(!allConnections[userId] || allConnections[userId] == undefined)) {
		// 	let filteredConnections = allConnections[userId].filter((element) => {
		// 		return element.connectionID != connectionID;
		// 	});
		// 	allConnections[userId] = filteredConnections;
		// }
	} */


	createNewRoomNotify = (savedMessage) => {
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
				this.sendMessageToUser(element, responseSuccess(200, "createRoom", responseData, "New Room Created", true));
			});
		});
	}

	createNewRoom = (findObject, connection) => {

		var room = new RoomModel(findObject);

		room.save().then((savedMessage) => {
			// console.log(`Room Saved.`, savedMessage);
			if (savedMessage) {

				this.createNewRoomNotify(savedMessage);

			} else {
				connection.sendUTF(responseError(500, "createRoom", "Failed To create room", true));
			}

		}).catch((ex) => {
			console.error(`Room Failed to Saved.`, ex);
			connection.sendUTF(responseError(500, "createRoom", "Failed To create room", true));
		});


	}

	//MARK:- Oprations


}






function createConnection(requestData, connection, ssChatInstance) {
	// console.log("createConnection::", requestData);
	if (requestData.type == "create") {
		if (isFine(requestData.user_id)) {
			let userId = requestData.user_id;

			addConnectionToList(connection, userId);

			// console.log("Connection Updated", cons);
			connection.sendUTF(responseSuccess(200, "create_connection", {}, "Connection Established.", true));
		} else {
			connection.sendUTF(responseError(404, "create_connection", "Action/Path not found.", true));
		}
	}

}


async function currentLocation(requestData, connection, ssChatInstance) {

	if (requestData.type == 'update') {
		if (!isFine(requestData.bookingId)) {
			connection.sendUTF(responseError(400, "currentLocation", "bookingId required.", true));
		} else {
			if (ssChatInstance.bookingConnectionList[requestData.bookingId] != null) {
				ssChatInstance.bookingConnectionList[requestData.bookingId].forEach((con) => {
					let response = {
						current_location: requestData.current_location,
						userId: requestData.userId
					};
					con.sendUTF(responseSuccess(200, "currentLocation", response, "Block Status Changed", true));
				});
			}
		}
	} else if (requestData.type == 'register') {
		if (!isFine(requestData.bookingId)) {
			connection.sendUTF(responseError(400, "currentLocationRegister", "bookingId required.", true));
		} else {
			let tmpBookingConnectionList = ssChatInstance.bookingConnectionList[requestData.bookingId];
			if (tmpBookingConnectionList != undefined) {
				// tmpBookingConnectionList.push(requestData.userId);
				tmpBookingConnectionList.push(connection);
				// connection.sendUTF(responseError(400, "currentLocation", "user is required.", true));
			} else {
				// tmpBookingConnectionList = [requestData.userId];
				tmpBookingConnectionList = [connection];
			}
			ssChatInstance.bookingConnectionList[requestData.bookingId] = tmpBookingConnectionList;
		}
	}
}

let ssChat = new SSChatReact();
mongoose.connect(config.dbUrl, {
	useNewUrlParser: true,
	useUnifiedTopology: true,

}, (error) => {
	console.log({ message: 'mongodb connected', error });
})
