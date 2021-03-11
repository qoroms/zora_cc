const { DeFiSDK } = require('defi-sdk');

async function getDefiInfo() {
  const nodeUrl = 'https://mainnet.infura.io/v3/baf20951e7a74c98a51b59b3e340c636';
  const defiSdk = new DeFiSDK(nodeUrl);
  let protocols = await defiSdk.getProtocolBalances('0x638aF69053892CDD7Ad295fC2482d1a11Fe5a9B7', ['Uniswap V2']);
  console.log(protocols);
}

module.exports = { getDefiInfo }