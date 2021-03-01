const express = require('express');
const router = express.Router();
const { web3 } = require('../utils/config');
const { getAccountRatingAndAge } = require('../utils/ratings');

router.get('/rating/:account', async (req, res, next) => {
    const address = web3.utils.toChecksumAddress(req.params.account);
    const ethBalance = await web3.eth.getBalance(address);
    const txCount = await web3.eth.getTransactionCount(address);
    const data = await getAccountRatingAndAge(address);

    res.status(200).json({
        status: true,
        result: {
            ...data,
            ethBalance: web3.utils.fromWei(ethBalance),
            txCount,
        }
    });
});

module.exports = router;
