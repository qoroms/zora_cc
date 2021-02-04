const { default: BigNumber } = require("bignumber.js");
const { getTransactions } = require("./etherscan");
const { currentUnixTimestamp } = require("./time");

const getAccountRatingAndAge = (account) => {
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
                    Number(totalBlocks),
                );

                let age = getAccountAge(transactions[0]);

                resolve({ rating, age });
            }
        }
    });
};

const calculateRating = (totalEthIn, totalEthOut, totalBlocks) => {
    let rating = 0;

    if (totalBlocks <= 200) {
        rating += 0;
    } else if (totalBlocks > 200 && totalBlocks <= 1000) {
        rating += 6 * (totalBlocks / 1000);
    } else if (totalBlocks > 101 && totalBlocks <= 10000) {
        rating += 6 + (6 * (totalBlocks / 10000))
    } else if (totalBlocks > 10001 && totalBlocks <= 100000) {
        rating += 12 + (6 * (totalBlocks / 100000))
    } else if (totalBlocks > 100001 && totalBlocks <= 1000000) {
        rating += 20 + (12 * (totalBlocks / 1000000))
    } else if (totalBlocks > 1000001 && totalBlocks <= 10000000) {
        rating += 32 + (13 * (totalBlocks / 10000000))
    } else if (totalBlocks > 10000001 && totalBlocks <= 100000000) {
        rating += 45 + (13 * (totalBlocks / 100000000))
    } else if (totalBlocks > 100000001 && totalBlocks <= 1000000000) {
        rating += 58 + (12 * (totalBlocks / 1000000000))
    } else if (totalBlocks > 1000000000) {
        rating += 70;
    }

    const avgEth = totalEthIn.minus(totalEthOut);
    const avgEthLength = avgEth.e + 1;

    const variableRating = Number(
        new BigNumber(10).multipliedBy(
            avgEth.dividedBy(
                new BigNumber(10).pow(
                    new BigNumber(avgEthLength)
                )
            )
        )
    );

    if (avgEthLength < 15) {
        rating += 0;
    } else if (avgEthLength >= 15 && avgEthLength < 17) {
        rating += 0 + variableRating;
    } else if (avgEthLength >= 17 && avgEthLength < 20) {
        rating += 10 + variableRating;
    } else if (avgEthLength >= 20 && avgEthLength < 22) {
        rating += 20 + variableRating;
    } else if (avgEthLength >= 22) {
        rating += 30;
    }

    return rating.toFixed(2);
};

const getAccountAge = (firstTx) => {
    const txTimestamp = Number(firstTx.timeStamp);
    const timeDiff = currentUnixTimestamp() - txTimestamp;
    const age = Math.floor(timeDiff / (60 * 60 * 24));
    return age;
};

module.exports = { getAccountRatingAndAge };
