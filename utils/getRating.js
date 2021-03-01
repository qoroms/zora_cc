const { default: BigNumber } = require("bignumber.js");

const getTotalBlocksNumber = (totalBlocks) => { // max is 70
	let rating = 0;

  	if (totalBlocks <= 200) {
        rating += 0;
    } else if (totalBlocks > 200 && totalBlocks <= 1000) {
        rating += 6 * (totalBlocks / 1000);
    } else if (totalBlocks > 1000 && totalBlocks <= 10000) {
        rating += 6 + (6 * (totalBlocks / 10000))
    } else if (totalBlocks > 10000 && totalBlocks <= 100000) {
        rating += 12 + (6 * (totalBlocks / 100000))
    } else if (totalBlocks > 100000 && totalBlocks <= 1000000) {
        rating += 20 + (12 * (totalBlocks / 1000000))
    } else if (totalBlocks > 1000000 && totalBlocks <= 10000000) {
        rating += 32 + (13 * (totalBlocks / 10000000))
    } else if (totalBlocks > 10000000 && totalBlocks <= 100000000) {
        rating += 45 + (13 * (totalBlocks / 100000000))
    } else if (totalBlocks > 100000000 && totalBlocks <= 1000000000) {
        rating += 58 + (12 * (totalBlocks / 1000000000))
    } else if (totalBlocks > 1000000000) {
        rating += 70;
    }

	return rating;
}

const getTotalEth = (totalEthIn, totalEthOut) => { // max is 30
	let rating = 0;
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

	return rating;
}

const getGweiRating = (gwei) => { // max is 50
	let rating = 0;

	if (gwei <= 200) {
		rating = 10;
	} else if (gwei <= 300) {
		rating = 15;
	} else if (gwei <= 400) {
		rating = 20;
	} else if (gwei <= 500) {
		rating = 25;
	} else if (gwei <= 600) {
		rating = 30;
	} else if (gwei <= 700) {
		rating = 35;
	} else if (gwei <= 800) {
		rating = 40;
	} else if (gwei <= 900) {
		rating = 45;
	} else if (gwei > 900) {
		rating = 50;
	}

	return rating;
}

const getAgeRating = (age) => {
	let rating = 0;
	if (age < 60) {
		rating = 10;
	} else if (age < 120) {
		rating = 15;
	} else if (age < 240) {
		rating = 20;
	} else if (age < 360) {
		rating = 25;
	} else if (age < 720) {
		rating = 30;
	} else if (age < 1080) {
		rating = 35;
	} else if (age > 1080) {
		rating = 40;
	}
	return rating;
}

const getNonceRating = (nonce) => {
	let rating = 0;
	if (nonce < 100) {
		rating = 10;
	} else if (nonce < 200) {
		rating = 15;
	} else if (nonce < 400) {
		rating = 20;
	} else if (nonce < 600) {
		rating = 25;
	} else if (nonce < 800) {
		rating = 30;
	} else if (nonce < 1000) {
		rating = 35;
	} else if (nonce < 1500) {
		rating = 40;
	} else if (nonce < 2000) {
		rating = 45;
	} else if (nonce > 2000) {
		rating = 50;
	}
}

module.exports = { getTotalBlocksNumber, getTotalEth, getGweiRating, getAgeRating, getNonceRating }