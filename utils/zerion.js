const io = require('socket.io-client');
const { default: BigNumber } = require("bignumber.js");
const { zeronKey } = require("./config");
const FALLBACK_URL = 'wss://api-v4.zerion.io/';
const BASE_URL = FALLBACK_URL;

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
      unsubscribe();
      resolve(data);
      if (verify(requestBody, data)) 
      {
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

const getAssets = (address) => {
	console.log("getAssets", address);
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['assets'],
      payload: {
      address:address,
      currency: 'usd',
      offset: 0,
      limit: 1000,
      },
    }).then(data => {
      const assets = data.payload.assets;
      let total = 0;
      for(key in assets) {
        const item = assets[key];
        const {asset: { name, price, decimals }, quantity} = item;
        const q = quantity / Math.pow(10, decimals);
        if (price)
          total += price.value * q;
      }
      return total;
    });
}

const getLockedAssets = (address) => {
	console.log("getLockedAssets", address);
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['locked-assets'],
      payload: {
      address:address,
      currency: 'usd',
      offset: 0,
      limit: 1000,
      },
    }).then(data => {
      const assets = data.payload['locked-assets'];
      let total = 0;
      assets.forEach(item => {
        total = total + item.value;
      })
      return total;
    });
}

const getMaxInHistory = (address) => {
	//console.log("getMaxInHistory", address);
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['charts'],
      payload: {
      address:address,
      charts_type: 'y',
      currency: 'usd',
      },
    }).then(response => {
      const {payload} = response;
      const charts = payload.charts.others;
      let max = 0;
      if (!charts)
        return 0;
      charts.forEach(item => {
        if (item[1] > max)
          max = item[1];
      })
      return max;
    });
}

const getPortfolio = (address) => {
	//console.log("start uniswap", address);
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['portfolio'],
      payload: {
      address:address,
      currency: 'usd',
      portfolio_fields: 'all'
      },
    }).then(data => {
      const { portfolio } = data.payload;
      return portfolio;
    });
}

const getTransactions = (address) => {
	//console.log("getTransactions", address);
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
        address: address,
        currency: 'usd',
        transactions_offset: 0,
        transactions_limit: 10000
      },
    }).then(data => {
      const { transactions } = data.payload;
      sorted = transactions.sort((a, b) => Number(a.block_number) - Number(b.block_number))
      return sorted;
    });
}

const getUniswapTransactions = (address) => {
	//console.log("getUniswapTransactions", address);
  //uniswap-v2 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'ETH') {
            const uniswap_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += uniswap_value;
                break;
              case 'receive':
                received += uniswap_value;
                break;
              case 'send':
                sent += uniswap_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}

const getSushiTransactions = (address) => {
	//console.log("getSushiTransactions", address);
  //sushi 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'ETH') {
            const sushi_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += sushi_value;
                break;
              case 'receive':
                received += sushi_value;
                break;
              case 'send':
                sent += sushi_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}


const getZoraTransactions = (address) => {
	//console.log("getZoraTransactions", address);
  //zora 0xd8e3fb3b08eba982f2754988d70d57edc0055ae6
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0xd8e3fb3b08eba982f2754988d70d57edc0055ae6'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'ZORA') {
            const zora_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += zora_value;
                break;
              case 'receive':
                received += zora_value;
                break;
              case 'send':
                sent += zora_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}

const getCompoundTransactions = (address) => {
	//console.log("getZoraTransactions", address);
  //compound 0xc00e94cb662c3520282e6f5717214004a7f26888 compound COMP token
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0xc00e94cb662c3520282e6f5717214004a7f26888'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'COMP') {
            const token_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += token_value;
                break;
              case 'receive':
                received += token_value;
                break;
              case 'send':
                sent += token_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}

const getYFITransactions = (address) => {
	//console.log("getYFITransactions", address);
  //YFI 0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e Ygov.finance: YFI Token
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      //console.log(JSON.stringify(transactions));
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'YFI') {
            const token_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += token_value;
                break;
              case 'receive':
                received += token_value;
                break;
              case 'send':
                sent += token_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}

const getPickleTransactions = (address) => {
	//console.log("getPickleTransactions", address);
  //Pickle 0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5 PICKLE.Finance: PICKLE Token
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'PICKLE') {
            const token_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += token_value;
                break;
              case 'receive':
                received += token_value;
                break;
              case 'send':
                sent += token_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}

const getWBTCTransactions = (address) => {
	//console.log("getWBTCTransactions", address);
  //WBTC 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 Wrapped BTC: WBTC Token
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'WBTC') {
            const token_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += token_value;
                break;
              case 'receive':
                received += token_value;
                break;
              case 'send':
                sent += token_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}

const getCoverTransactions = (address) => {
	//console.log("getCoverTransactions", address);
  //Cover 0x4688a8b1F292FDaB17E9a90c8Bc379dC1DBd8713 Cover Protocol: COVER Token
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0x4688a8b1F292FDaB17E9a90c8Bc379dC1DBd8713'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'COVER') {
            const token_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += token_value;
                break;
              case 'receive':
                received += token_value;
                break;
              case 'send':
                sent += token_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}

const getAaveTransactions = (address) => {
	//console.log("getAaveTransactions", address);
  //Cover 0x80fB784B7eD66730e8b1DBd9820aFD29931aab03 Aave: LEND Token
  const assetsSocket = {
      namespace: 'address',
      socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
          api_token:
            zeronKey ||
            'Demo.ukEVQp6L5vfgxcz4sBke7XvS873GMYHy',
        },
      }),
  };
  return get(assetsSocket, {
      scope: ['transactions'],
      payload: {
      address:address,
      currency: 'usd',
      transactions_limit: 10000,
      transactions_offset: 0,
      transactions_search_query: '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03'
      },
    }).then(response => {
      const {payload} = response;
      const {transactions} = payload;
      let sent, received, trading, exchangefee;
      sent = received = trading = 0;
      exchangefee = {
        ETH: 0,
        USD: 0
      }
      transactions.forEach(trx => {
        const {type, changes, fee, status} = trx;
        if (status != 'confirmed')
          return;
        changes.forEach(ast => {
          const {asset: {symbol, decimals}, value} = ast;
          if (symbol == 'LEND') {
            const token_value = value / Math.pow(10, decimals);
            switch(type) {
              case 'trade':
                trading += token_value;
                break;
              case 'receive':
                received += token_value;
                break;
              case 'send':
                sent += token_value;
                break;
              default:
                break;
            }
            if (fee) {
              fee_value = fee.value / Math.pow(10, 18);
              exchangefee.ETH += fee_value; //Eth decimal 18
              exchangefee.USD += fee_value * fee.price;
            }
          }
        })
      })
      return {
        sent, received, trading, exchangefee
      }
    });
}
const getFullDetail = (address) => {
  return Promise.all([
    getTransactions(address),
    getPortfolio(address),
    getMaxInHistory(address),
    getUniswapTransactions(address),
    getSushiTransactions(address),
    getZoraTransactions(address),
    getCompoundTransactions(address),
    getYFITransactions(address),
    getPickleTransactions(address),
    getWBTCTransactions(address),
    getCoverTransactions(address),
    getAaveTransactions(address)
  ]).then(res => {
    return {
      transactions: res[0],
      portfolio: res[1],
      max: res[2],
      uniswap: res[3],
      sushi: res[4],
      zora: res[5],
      comp: res[6],
      yfi: res[7],
      pickle: res[8],
      wbtc: res[9],
      cover: res[10],
      aave: res[11]
    }
  })
}

//0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4
//0x638aF69053892CDD7Ad295fC2482d1a11Fe5a9B7
//0xd4004f07d7b746103f2d9b4e5b5a540864526bec
/*getFullDetail("0xf146E516258D277f493366Bd216D9B3c05e0c61C").then(res => {
  console.log(res);
});*/
module.exports = {
  getAssets,
  getLockedAssets,
  getMaxInHistory,
  getUniswapTransactions,
  getSushiTransactions,
  getFullDetail,
  getTransactions
}
