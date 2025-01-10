const isFine = (item) => !(item === '' || item === 'undefined' || item === null);

const formatTheMessages = (message) => {
  message = JSON.parse(JSON.stringify(message));

  message = { ...message, "timestamp": new Date(message.time).getTime() };
  return message;

}

const makeRandomString = (length) => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};


const responseSuccess = (code, type, dataObject, message, toString) => {
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
};

const responseError = (code, type, message, toString) => {
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
};


const getLastMessage = (message, type) => {
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
    case "REPlAY":
      return "Replay";
    default:
      return message.substring(0, 100);
  }

}
const getLastMessageForNotification = (message, type) => {
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
    case "REPlAY":
      return "Replay";
    default:
      return message.substring(0, 100);
  }

}


module.exports = { isFine, responseError, responseSuccess, makeRandomString, formatTheMessages, getLastMessage, getLastMessageForNotification };
