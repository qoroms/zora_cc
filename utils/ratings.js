const { default: BigNumber } = require("bignumber.js");
const { getTransactions } = require("./etherscan");
const { currentUnixTimestamp } = require("./time");
const { getTotalBlocksNumber, getTotalEth, getGweiRating, getAgeRating, getNonceRating } = require('./getRating');

const getAccountRatingAndAge = (account) => {
    return new Promise(async (resolve) => {
        let totalEthIn = new BigNumber(0);
        let totalEthOut = new BigNumber(0);
        let maxGwei = new BigNumber(0);
        let totalGasSpent = new BigNumber(0);
        let maxNonce = 0;
        const transactions = await getTransactions(account);
        const firstTxBlock = transactions[0].blockNumber;
        const lastTxBlock = transactions[transactions.length - 1].blockNumber;
        const totalBlocks = Number(lastTxBlock) - Number(firstTxBlock);
        // console.log(transactions[transactions.length - 1])
        for (let i = 0; i < transactions.length; i++) {
            if (
                Number(transactions[i].isError) === 0 &&
                transactions[i].contractAddress === "" &&
                transactions[i].to !== "" &&
                transactions[i].from !== ""
            ) {
                if (
                    transactions[i].to.toLowerCase() ===
                    account.toLowerCase()
                ) {
                    totalEthIn = totalEthIn.plus(
                        new BigNumber(transactions[i].value)
                    );
                } else {
                    totalEthOut = totalEthOut.plus(
                        new BigNumber(transactions[i].value)
                    );
                }
            }

            if (
                transactions[i].from.toLowerCase() === account.toLowerCase() &&
                Number(transactions[i].isError) === 0
            ) {
                if (maxNonce < parseInt(transactions[i].nonce, 10)) {
                    maxNonce = parseInt(transactions[i].nonce, 10)
                }
                if (maxGwei.comparedTo(new BigNumber(transactions[i].gasPrice)) < 0) {
                    maxGwei = new BigNumber(transactions[i].gasPrice)
                }
            }

            if (i === transactions.length - 1) {
                const maxGweiNumber = new Number(maxGwei.dividedBy(new BigNumber(10).pow(9)))
                let age = getAccountAge(transactions[0]);
                const rating = calculateRating(
                    totalEthIn,
                    totalEthOut,
                    Number(totalBlocks),
                    maxGweiNumber,
                    age,
                    maxNonce
                );
                resolve({ rating, age, maxNonce, maxGwei: maxGweiNumber });
            }
        }
    });
};

const calculateRating = (totalEthIn, totalEthOut, totalBlocks, maxGwei, age, maxNonce) => {
    let rating = getTotalBlocksNumber(totalBlocks); // 70
    rating += getTotalEth(totalEthIn, totalEthOut); // 30
    rating += getGweiRating(maxGwei); // 50
    rating += getAgeRating(age); // 40
    rating += getNonceRating(maxNonce); // 40

    return rating.toFixed(2);
};

const getAccountAge = (firstTx) => {
    const txTimestamp = Number(firstTx.timeStamp);
    const timeDiff = currentUnixTimestamp() - txTimestamp;
    const age = Math.floor(timeDiff / (60 * 60 * 24));
    return age;
};

module.exports = { getAccountRatingAndAge };
