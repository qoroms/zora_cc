const io = require('socket.io-client');

const BASE_URL = 'wss://api-v4.zerion.io/';

const assetsSocket = {
  namespace: 'address',
  socket: io(`${BASE_URL}address`, {
    transports: ['websocket'],
    timeout: 60000,
    query: {
      api_token:
        process.env.ZERION_KEY
    },
  }),
};

function verify(request, response) {
  // each value in request payload must be found in response meta
  return Object.keys(request.payload).every(key => {
    const requestValue = request.payload[key];
    const responseMetaValue = response.meta[key];
    if (typeof requestValue === 'object') {
      return JSON.stringify(requestValue) === JSON.stringify(responseMetaValue);
    }
    return responseMetaValue === requestValue;
  });
}

function get(socketNamespace, requestBody) {
  return new Promise(resolve => {
    const { socket, namespace } = socketNamespace;
    function handleReceive(data) {
      if (verify(requestBody, data)) {
        unsubscribe();
        resolve(data);
      }
    }
    const model = requestBody.scope[0];
    function unsubscribe() {
      socket.off(`received ${namespace} ${model}`, handleReceive);
      socket.emit('unsubscribe', requestBody);
    }
    socket.emit('get', requestBody);
    socket.on(`received ${namespace} ${model}`, handleReceive);
  });
}

function getInfo(address) {
  return new Promise((resolve) => {
    get(assetsSocket, {
      scope: ['portfolio'],
      payload: {
        address, currency: 'USD', portfolio_fields: 'all'
      },
    }).then(response => {
      console.log(response.payload.info);
      resolve(response);
    });
  })
}

module.exports = { getInfo }