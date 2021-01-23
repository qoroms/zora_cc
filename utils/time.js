const currentUnixTimestamp = () => {
    return Number(Date.now() / 1000 | 0);
};

module.exports = { currentUnixTimestamp };
