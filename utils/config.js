require('dotenv').config();
const Web3 = require("web3");

module.exports = {
    web3: new Web3(process.env.INFURA_URL),
    etherscanKey: process.env.ETHERSCAN_KEY,
};
