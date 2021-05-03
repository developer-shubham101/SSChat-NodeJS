import {Document, Model} from "mongoose";

export interface IUser {
    userName: string,
    password: string,
    firstName: string,
    lastName: string,
    profile_pic: string,
    userId: number,
    email: string,
    device_id: string,
    fcm_token: string,
    last_seen: Date,
    is_online: boolean
}

export interface IUserDocument extends IUser, Document {

}

export interface IUserModel extends Model<IUserDocument> {

}
