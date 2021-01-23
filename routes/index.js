const express = require('express');
const { web3 } = require('../utils/config');
const { getAccountRating } = require('../utils/ratings');
const router = express.Router();

router.get('/rating/:account', async (req, res, next) => {
    const address = web3.utils.toChecksumAddress(req.params.account);
    const rating = await getAccountRating(address)
    const ethBalance = await web3.eth.getBalance(address);
    const txCount = await web3.eth.getTransactionCount(address);

    res.status(200).json({
        status: true,
        result: {
            rating,
            ethBalance: web3.utils.fromWei(ethBalance),
            txCount,
        }
    });
});

module.exports = router;
