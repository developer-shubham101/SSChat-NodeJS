# SSChat-NodeJS

Setup the chat server you need to first install mongodb.
https://docs.mongodb.com/manual/installation/

After installing the mongodb you will find local url like that

`mongodb://127.0.0.1:27017/ReactChat`
or if you using cloud version then user must be like that
`mongodb+srv://ReactChat:<password>@sample.b9ow3.mongodb.net/MyDataBase?retryWrites=true&w=majority`

second you need to create firebase account for push notification find the serverKey

Then rename the file `config-sample.js` to `config.js` in src dir and enter config according to you

then run `yarn install` or `npm install`
then run `npm run start`