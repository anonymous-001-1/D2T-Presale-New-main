// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const ONE_YEAR_IN_SECS = 3600 * 24;

async function main() {
  const D2TPresale = await hre.ethers.getContractFactory("D2TPresale");
  const D2T = await hre.ethers.getContractFactory("D2T");
  const tokenContract = await D2T.deploy();
  await tokenContract.deployed();

  const presaleContract = await D2TPresale.deploy(
    tokenContract.address,
    routerAddress,
    ONE_YEAR_IN_SECS
  );
  console.log(
    `Presale contract: ${presaleContract.address}, Token contract: ${tokenContract.address}`
  );
  await presaleContract.deployed();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
