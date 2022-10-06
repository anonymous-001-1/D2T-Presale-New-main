require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require('dotenv').config()

const { GOERLI_RPC_URI, PRIVATE_KEY,MAINNET_RPC_URL } = process.env
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: MAINNET_RPC_URL,
      },
    },
    goerli: {
      url: GOERLI_RPC_URI,
      accounts: [PRIVATE_KEY] 
    }
  },
};
