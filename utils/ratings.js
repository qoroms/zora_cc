const { default: BigNumber } = require("bignumber.js");
const e = require("express");
const { web3 } = require("./config");
const { getTransactions } = require("./etherscan");

const getAccountRating = (account) => {
    return new Promise(async (resolve) => {
        let totalEthIn = new BigNumber(0);
        let totalEthOut = new BigNumber(0);
        const transactions = await getTransactions(account);
        const firstTxBlock = transactions[0].blockNumber;
        const lastTxBlock = transactions[transactions.length - 1].blockNumber;
        const totalBlocks = Number(lastTxBlock) - Number(firstTxBlock);

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

            if (i === transactions.length - 1) {
                const rating = calculateRating(
                    totalEthIn,
                    totalEthOut,
                    totalBlocks,
                );

                resolve(rating);
            }
        }
    });
};

const calculateRating = (totalEthIn, totalEthOut, totalBlocks) => {
    let rating = 0;

    const ethInPerBlock = Number(
        totalEthIn.dividedBy(new BigNumber(totalBlocks))
    );

    const ethOutPerBlock = Number(
        totalEthOut.dividedBy(new BigNumber(totalBlocks))
    );

    const avgEth = Number(
        web3.utils.fromWei(
            String((ethInPerBlock - ethOutPerBlock).toFixed(0))
        )
    );

    if (avgEth > 3) {
        rating = 10;
    } else if (avgEth > 2 && avgEth >= 3) {
        rating = 8 + (2 * (avgEth - 2));
    } else if (avgEth > 1 && avgEth <= 2) {
        rating = 6 + (2 * (avgEth - 1));
    } else if (avgEth > 0 && avgEth <= 1) {
        rating = 4 + (2 * avgEth)
    } else if (avgEth < 0 && avgEth >= -1) {
        rating = 2 + (2 * (avgEth + 1));
    } else if (avgEth < -1 && avgEth >= -2) {
        rating = 0 + (2 * (avgEth + 2));
    } else if (avgEth < -2) {
        rating = 0;
    }

    return rating.toFixed(2);
};

const getAccountAge = (firstTx) => {
    const txTimestamp = Number(firstTx.timeStamp);
    const timeDiff = currentUnixTimestamp() - txTimestamp;
    const age = Math.floor(timeDiff / (60 * 60 * 24));
    return age;
};

module.exports = { getAccountRating };
