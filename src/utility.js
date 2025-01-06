const isFine = (item) => !(item === '' || item === 'undefined' || item === null);


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

module.exports = { isFine, responseError, responseSuccess, makeRandomString };
