// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Import required modules
const { server: webSocketServer } = require('websocket');
const http = require('http');
const mongoose = require('mongoose');
const fs = require("fs");
const multer = require('multer');
const express = require('express');
const path = require('path');
// Import custom modules and configurations
const config = require('./config');
const { makeRandomString } = require('./utility');
const jwt = require('jsonwebtoken'); 



const { blockUser } = require('./route/block.route');
const { responseError } = require('./utility');
const { messageRequest } = require('./route/messages.route');
const { roomRequest } = require('./route/room.route');
const { loginRequest } = require('./route/login.route');
const { allUser } = require('./route/users.route');
const { updateOnlineStatus } = require('./update-user');
const { currentLocation } = require('./route/current-location.route');
const { removeConnectionFromList } = require('./connections');
const { authenticateJWT } = require('./auth');


// Initialize Express app and multer for file uploads
const app = express();

app.use(express.json());
const upload = multer({ dest: 'uploads/', preservePath: false });

/**
 * Moves the uploaded file to a new location and returns the new file name.
 * @param {Object} file - The file object to be moved.
 * @returns {string} - The new file name.
 */
const moveFile = (file) => {
	// Generate a new file name with a random string
	let newFileName = `${file.destination}${makeRandomString(22)}.${file.originalname.split('.').pop()}`;

	// Rename the file to the new file name
	fs.rename(`./${file.path}`, newFileName, (err) => {
		if (err) console.log("Error renaming file:", err);
	});

	return newFileName;
};

// Define route for the home page
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../html/index.html'));
});
app.get('/app.js', (req, res) => {
	res.sendFile(path.join(__dirname, '../html/app.js'));
});

app.post('/token', (req, res) => {
	console.log("Request body:", req.body);
	
	const { username, password } = req.body;

	// Validate username and password (this is just an example, you should use a proper authentication mechanism)
	if (username === 'admin' && password === 'password') {
		const payload = { username };
		const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '2d' });

		res.json({ token });
	} else {
		res.status(401).json({ message: 'Invalid username or password' });
	}
});


/**
 * Handles file upload and moves the uploaded files to a new location.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
app.post('/upload', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), function (req, res) {
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any
	console.log("Request body:", req.body);
	res.send(JSON.stringify(req.files));

	// Check if file is uploaded and move it to a new location
	if (req.files.file && req.files.file.length > 0) {
		let newFileName = moveFile(req.files.file[0]);
		let thumbnailFileName = req.files.thumbnail?.length > 0 ? moveFile(req.files.thumbnail[0]) : '';
		res.send({ status_code: 200, data: { file: newFileName, thumbnail: thumbnailFileName }, response: 'success' });
	} else {
		res.status(400).send('Please upload a file');
	}
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(__dirname + '/uploads'));

// Create HTTP server
const server = http.createServer(app);

// Start the server and listen on the specified port
server.listen(config.webSocketsServerPort, function () {
	console.log("Express server listening on port:", `http://localhost:${config.webSocketsServerPort}`);
});

/**
 * WebSocket server
 */
const wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket request is just
	// an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server
});

/**
 * Accepts a WebSocket request and sets up message and close event handlers.
 * @param {Object} request - The WebSocket request object.
 */
const acceptRequest = (request) => {
	let connection = request.accept(null, request.origin);

	console.log({ time: new Date(), message: 'Connection accepted.' });

	connection.on('message', async (message) => {
		console.log("New request received:", message.utf8Data);

		try {
			let requestData = JSON.parse(message.utf8Data);
			switch (requestData.request) {
				case 'room':
					await roomRequest(requestData, connection);
					break;
				case 'users':
					await allUser(requestData, connection);
					break;
				case 'login':
					await loginRequest(requestData, connection);
					break;
				case 'message':
					await messageRequest(requestData, connection);
					break;
				case 'create_connection':
					createConnection(requestData, connection);
					break;
				case 'block_user':
					await blockUser(requestData, connection);
					break;
				case 'current_location':
					await currentLocation(requestData, connection);
					break;
				default:
					connection.sendUTF(responseError(404, "unknown", "No route found", true));
			}
		} catch (ex) {
			console.log("Error processing request:", ex);
			connection.sendUTF(responseError(500, "unknown", "Server error occurred", true));
		}
	});

	connection.on('close', (event) => {
		console.log({
			time: new Date(),
			message: 'Connection closed',
			id: connection.uId,
			event
		});

		removeConnectionFromList(connection);
		let userId = connection.uId;
		if (userId) {
			updateOnlineStatus(userId, false);
		}
	});
};

/**
 * Checks if the origin of the request is allowed and accepts the request if it is.
 * @param {Object} request - The WebSocket request object.
 * @returns {boolean} - True if the origin is allowed, false otherwise.
 */
const originIsAllowed = (request) => {
	const allowedPaths = new Set(["/v1", "/V1", "/v1/", "/V1/"]);
	console.log(`Origin: ${request.resourceURL.pathname}`);
	if (allowedPaths.has(request.resourceURL.pathname)) {
		acceptRequest(request);
		return true;
	}
	return false;
};

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {

	console.log(`Connection from origin ${request.origin}. At ${new Date()}`);

	const extractToken = request.resourceURL.path.split('token=');
	const token = extractToken.length > 1 ? extractToken[1] : '';
	const user = authenticateJWT(token);
	if (!user) {
		// ws.close(4001, 'Invalid or missing token');
		request.reject();
		return;
	}

	// Check if the origin is allowed
	if (!originIsAllowed(request)) {
		// Make sure we only accept requests from an allowed origin
		request.reject();
		console.log(`Connection from origin ${request.origin} rejected. At ${new Date()}`);
	}
});

console.log('MongoDB URL:', config.dbUrl);

// Connect to MongoDB using Mongoose
mongoose.connect(config.dbUrl, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}, (error) => {
	console.log({ message: 'MongoDB connection error', error });
});
