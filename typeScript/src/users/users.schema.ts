import * as Mongoose from "mongoose";
// import {findByAge, findOneOrCreate} from "./users.statics";
// import {sameLastName, setLastUpdated} from "./users.methods";

const UserSchema = new Mongoose.Schema({
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



export default UserSchema;
