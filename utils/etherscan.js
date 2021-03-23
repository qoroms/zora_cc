const { default: axios } = require("axios");
const { etherscanKey } = require("./config");
const etherscanUrl = "https://api.etherscan.io/api?module=account"

const getTransactions = (address) => {
    return new Promise(async (resolve, reject) => {
        try {
            let transactions = [];
            console.log("start:", new Date().toUTCString())
            const res = await axios.get(
                `${etherscanUrl}&action=txlist&address=${address}&apikey=${etherscanKey}`
            );
            console.log("normal", res.data.result.length)

            if (res.data.status === "1") {
                transactions = res.data.result;
            }

            const res1 = await axios.get(
                `${etherscanUrl}&action=txlistinternal&address=${address}&apikey=${etherscanKey}`
            );
            console.log("internal", res1.data.result.length)
            console.log("end etherscan:", new Date().toUTCString())

            if (res1.data.status) {
                transactions = [...transactions, ...res1.data.result];
            }
            console.log("start sort:", new Date().toUTCString())
            transactions.sort(
                (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
            );
            console.log("end sort:", new Date().toUTCString())

            resolve(transactions);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { getTransactions };
