const mongoose = require('mongoose');

const UsersModel = mongoose.model('Users', {
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

const MessageModel = mongoose.model('messages', {
	roomId: mongoose.Schema.Types.ObjectId,
	message: String,
	message_type: String,
	media: String,
	receiver_id: String,
	time: Date,
	sender_id: String,
	message_content: Object
});

const RoomModel = mongoose.model('Room', {
	users: Object,
	type: String, //group/individual
	last_message: Object,
	last_message_time: Date,
	create_time: Date,
	message_info: Object,
	group_details: Object,
	users_meta: Object,
	userList: Array,
	createBy: String,
	unread: Object,
});

const BlockModel = mongoose.model('Block', {
	blockedBy: String,
	blockedTo: String,
	isBlock: Boolean
});

module.exports = {
	UsersModel,
	MessageModel,
	RoomModel,
	BlockModel
};