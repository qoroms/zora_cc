// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.7.0;

import "github.com/oraclize/ethereum-api/provableAPI_0.6.sol";

contract ZoraRating is usingProvable {
    struct Rating {
        string rating;
        uint256 updatedAt;
    }

    mapping(bytes32 => address) internal queryIdAddress;
    mapping(address => Rating) internal addressRating;

    event NewUpdateRatingRequest(address walletAddress, string description);
    event AddressRatingUpdated(address walletAddress, string rating);

    // Update address rating using provable
    function updateRating(address walletAddress) public payable {
        require(
            provable_getPrice("URL") <= address(this).balance,
            "Provable query will NOT be sent, please add some ETH to cover for the query fee !!"
        );

        string memory _url =
            string(
                abi.encodePacked(
                    "json(http://gov.zoracles.com/rating/",
                    toString(abi.encodePacked(walletAddress)),
                    ").result.rating"
                )
            );

        emit NewUpdateRatingRequest(
            walletAddress,
            "Provable query was sent, standing by for the answer..."
        );

        bytes32 queryId = provable_query("URL", _url);
        queryIdAddress[queryId] = walletAddress;
    }

    // Function to fetch address rating
    function getRating(address walletAddress)
        public
        view
        returns (string memory)
    {
        return addressRating[walletAddress].rating;
    }

    // Function to fetch address last updated timestamp
    function getLastUpdatedTimestamp(address walletAddress)
        public
        view
        returns (uint256)
    {
        return addressRating[walletAddress].updatedAt;
    }

    function __callback(bytes32 queryId, string memory rating) public override {
        require(
            msg.sender == provable_cbAddress(),
            "Sender should be callback address !!"
        );

        address walletAddress = queryIdAddress[queryId];
        addressRating[walletAddress] = Rating(rating, block.timestamp);
        delete queryIdAddress[queryId];

        emit AddressRatingUpdated(walletAddress, rating);
    }

    function toString(bytes memory data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }

        return string(str);
    }
}
