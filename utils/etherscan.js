const { default: axios } = require("axios");
const { etherscanKey } = require("./config");
const etherscanUrl = "https://api.etherscan.io/api?module=account"

const getTransactions = (address) => {
    return new Promise(async (resolve, reject) => {
        try {
            let transactions = [];

            const res = await axios.get(
                `${etherscanUrl}&action=txlist&address=${address}&apikey=${etherscanKey}`
            );

            if (res.data.status === "1") {
                transactions = res.data.result;
            }

            const res1 = await axios.get(
                `${etherscanUrl}&action=txlistinternal&address=${address}&apikey=${etherscanKey}`
            );

            if (res1.data.status) {
                transactions = [...transactions, ...res1.data.result];
            }

            transactions.sort(
                (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
            );

            resolve(transactions);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { getTransactions };
