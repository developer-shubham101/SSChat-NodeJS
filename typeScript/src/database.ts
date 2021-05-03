import * as Mongoose from 'mongoose';
import {UserModel} from "./users/users.model";

let config = require("./config");

let database: Mongoose.Connection;

export const connect = () => {
    if (database) {
        return;
    }

    Mongoose.connect(config.dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    database = Mongoose.connection;

    database.once('open', async () => {
        console.log('Connected to database');
    });

    database.on('error', () => {
        console.log('Error connecting to database');
    });

    return {
        UserModel,
    };
};

export const disconnect = () => {
    if (!database) {
        return;
    }

    Mongoose.disconnect();
};
