$(function () {
	"use strict";

	// for better performance - to avoid searching in DOM
	var content = $('#content');
	var input = $('#input');
	var status = $('#status');

	// my color assigned by the server
	var myColor = false;
	// my name sent to the server
	var myName = false;

	// if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;

	// if browser doesn't support WebSocket, just show some notification and exit
	if (!window.WebSocket) {
		content.html($('<p>', {
			text: 'Sorry, but your browser doesn\'t '
				+ 'support WebSockets.'
		}));
		input.hide();
		$('span').hide();
		return;
	}

	// open connection
	var connection = new WebSocket('ws://127.0.0.1:1337/v1/chat');
	var connectionRoom = new WebSocket('ws://127.0.0.1:1337/v1/room');
	var connectionMessage = new WebSocket('ws://127.0.0.1:1337/v1/message?key=test');
	var connectionLogin = new WebSocket('ws://127.0.0.1:1337/v1/login');
	// var registerConnection = new WebSocket('ws://127.0.0.1:1337/register');
	var userListConnection = new WebSocket('ws://127.0.0.1:1337/v1/users');

	setTimeout(() => {
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// connectionLogin.send(JSON.stringify({ "userName": "anil", "password": "123456" }));
	}, 10);

	setTimeout(() => {
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// connectionRoom.send(JSON.stringify({ type: "allRooms", "userList": ["anil"] }));
	}, 100);

	setTimeout(() => {
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// userListConnection.send(JSON.stringify({ type: "allRooms", "userList": ["anil"] }));
	}, 100);

	setTimeout(() => {
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		/* var userData = { type: "updateProfile", _id: "600a729f49ee8a46a466487e" };
		console.log('userData', userData);
		connectionLogin.send(JSON.stringify(userData)); */
	}, 100);

	setTimeout(() => {
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		// connectionRoom.send(JSON.stringify({ "userName": "anil", "password": 123456 }));
		/* var userData = { type: "register", userId:4, userName: 'abcuser', password: '123456' };
		console.log('register userData', userData);
		connectionLogin.send(JSON.stringify(userData)); */
	}, 100);


	connectionLogin.onmessage = function (message) {
		console.log("Login message receved ", message.data);
	};


	connectionRoom.onmessage = function (message) {
		console.log("Room response receved ", message);

		try {
			var json = JSON.parse(message.data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}
		console.log("Login message receved ", json._id);

		connectionMessage.send(JSON.stringify({ "roomId": 12/* json._id */, "message": "hello this is the messgae " }));

	};
	connectionMessage.onmessage = function (message) {
		console.log("Chat message receved ", message);
	};

	setTimeout(() => {
		connection.send("Shubham");
	}, 2000);

	connection.onopen = function () {
		// first we want users to enter their names
		input.removeAttr('disabled');
		status.text('Choose name:');
	};

	connection.onerror = function (error) {
		// just in there were some problems with conenction...
		content.html($('<p>', {
			text: 'Sorry, but there\'s some problem with your '
				+ 'connection or the server is down.'
		}));
	};

	// most important part - incoming messages
	connection.onmessage = function (message) {
		// try to parse JSON message. Because we know that the server always returns
		// JSON this should work without any problem but we should make sure that
		// the massage is not chunked or otherwise damaged.
		try {
			var json = JSON.parse(message.data);
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ', message.data);
			return;
		}

		// NOTE: if you're not sure about the JSON structure
		// check the server source code above
		if (json.type === 'color') { // first response from the server with user's color
			myColor = json.data;
			status.text(myName + ': ').css('color', myColor);
			// input.removeAttr('disabled').focus();
			// from now user can start sending messages
		} else if (json.type === 'history') { // entire message history
			// insert every single message to the chat window
			for (var i = 0; i < json.data.length; i++) {
				addMessage(json.data[i].author, json.data[i].text,
					json.data[i].color, new Date(json.data[i].time));
			}
		} else if (json.type === 'message') { // it's a single message
			input.removeAttr('disabled'); // let the user write another message
			addMessage(json.data.author, json.data.text,
				json.data.color, new Date(json.data.time));
		} else {
			console.log('Hmm..., I\'ve never seen JSON like this: ', json);
		}
	};

	/**
	 * Send mesage when user presses Enter key
	 */
	input.keydown(function (e) {
		if (e.keyCode === 13) {
			var msg = $(this).val();
			if (!msg) {
				return;
			}
			// send the message as an ordinary text
			connection.send(msg);
			$(this).val('');
			// disable the input field to make the user wait until server
			// sends back response
			input.attr('disabled', 'disabled');

			// we know that the first message sent from a user their name
			if (myName === false) {
				myName = msg;
			}
		}
	});

	/**
	 * This method is optional. If the server wasn't able to respond to the
	 * in 3 seconds then show some error message to notify the user that
	 * something is wrong.
	 */
	setInterval(function () {
		if (connection.readyState !== 1) {
			status.text('Error');
			input.attr('disabled', 'disabled').val('Unable to communicate '
				+ 'with the WebSocket server.');
		}
	}, 3000);

	/**
	 * Add message to the chat window
	 */
	function addMessage(author, message, color, dt) {
		content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
			+ (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
			+ (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
			+ ': ' + message + '</p>');
	}

	$('#login_form').on('submit', (event)=>{
		event.preventDefault();
		console.log('login',$('#login_form').serializeArray());
		var data = $('#login_form').serializeArray();
		var dataObj = {};
		data.forEach((el, i) => {
			dataObj[el.name] = el.value
		});

		console.log('data', dataObj);
		connectionLogin.send(JSON.stringify(dataObj));
	});


	

	$('#register_form').on('submit', (event)=>{
		event.preventDefault();
		console.log('login',$('#register_form').serializeArray());
		var data = $('#register_form').serializeArray();
		var dataObj = {};
		data.forEach((el, i) => {
			dataObj[el.name] = el.value
		});

		console.log('data', dataObj);
		connectionLogin.send(JSON.stringify(dataObj));
	});

	$('#login_btn').on('click', (event) => {

		var dataObj = {type: 'login', userName: 'shubhum', password: '123456'};
		console.log('data', dataObj);
		connectionLogin.send(JSON.stringify(dataObj));
	})

	$('#profile_btn').on('click', (event) => {

		var userData = { type: "updateProfile", _id: "600fb28a7d03c711d859bb5c", userId: 4, firstName: "New", lastName: "User", profilePic: "https://i.pinimg.com/originals/7e/41/9d/7e419d717322788e3c2f3271273b0f3d.jpg",email:"new@user.com" };
		console.log('userData', userData);
		connectionLogin.send(JSON.stringify(userData));

	})

	$('#register_btn').on('click', (event) => {

		// var userData = { type: "register", userId:4, userName: 'abcuser', password: '123456' };
		var userData = { type: "register", userName: 'shubhum', password: '123456', userId:5 };
		console.log('register userData', userData);
		connectionLogin.send(JSON.stringify(userData));

	})

	$('#create_room_btn').on('click', (event) => {

		// var userData = { type: "register", userId:4, userName: 'abcuser', password: '123456' };
		var userData = { type: "createRoom", "userList": ["shubhum", "sdanil"] };
		console.log('register userData', userData);
		// connectionLogin.send(JSON.stringify(userData));
		connectionRoom.send(JSON.stringify(userData));
		

	})

	$('#all_room_btn').on('click', (event) => {

		// var userData = { type: "register", userId:4, userName: 'abcuser', password: '123456' };
		var userData = { type: "allRooms", "userList": ["anil"] };
		console.log('register userData', userData);
		// connectionLogin.send(JSON.stringify(userData));
		connectionRoom.send(JSON.stringify(userData));
		

	})

	$('#new_message_btn').on('click', (event) => {

		// var userData = { type: "register", userId:4, userName: 'abcuser', password: '123456' };
		var userData = { type: "addMessage", "roomId": "601103fe9fbde776d5bae20e", "message": "hello this is the messgae " };
		console.log('register userData', userData);
		// connectionLogin.send(JSON.stringify(userData));
		connectionMessage.send(JSON.stringify(userData));
		// connectionMessage.send(JSON.stringify({type: "addMessage", "roomId": 12/* json._id */, "message": "hello this is the messgae " }));

		

	})



});