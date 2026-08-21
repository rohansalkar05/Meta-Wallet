/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    bscTestnet: {
      url: "https://bsc-testnet.publicnode.com",
      chainId: 97
    }
  }
};
