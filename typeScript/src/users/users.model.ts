import * as Mongoose from "mongoose";
import UserSchema from "./users.schema";
import { IUserDocument, IUserModel } from "./users.types";

export const UserModel = Mongoose.model<IUserDocument>(
  "Users",
  UserSchema
) as IUserModel;
