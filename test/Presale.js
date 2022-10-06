const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const BN = require("bn.js");
const routerAbi = require("../abi/routerAbi");
const tokenAbi = require("../abi/tokenAbi");

const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const USDTAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const ONE_DAY_IN_SECS = 3600 * 24;
const MINT_AMOUNT = "700000000000000000000000000"; //700000000 * 10 ** 18
const USDT_AMOUNT = "1000000000"; //1000 * 10 ** 6

describe("Presale", function () {
  async function deployAndDepositFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const D2TPresale = await hre.ethers.getContractFactory("D2TPresale");
    const D2T = await hre.ethers.getContractFactory("D2T");
    const tokenContract = await D2T.deploy();
    await tokenContract.deployed();

    //Deploy presale contracct, duration is one day
    const presaleContract = await D2TPresale.deploy(
      tokenContract.address,
      routerAddress,
      1
    );
    await presaleContract.deployed();

    //Mint D2T tokens to presale contract
    await tokenContract.mint(presaleContract.address, MINT_AMOUNT);

    //Buy USDT using uniswap router
    const USDTContract = await ethers.getContractAt(
      tokenAbi,
      USDTAddress,
      owner
    );
    const routerContract = await ethers.getContractAt(
      routerAbi,
      routerAddress,
      owner
    );
    await routerContract.swapExactETHForTokens(
      "5000",
      [WETHAddress, USDTAddress],
      owner.address,
      (await time.latest()) + 10000,
      { value: ethers.utils.parseEther("5000") }
    );
    await routerContract
      .connect(otherAccount)
      .swapExactETHForTokens(
        "5000",
        [WETHAddress, USDTAddress],
        otherAccount.address,
        (await time.latest()) + 10000,
        { value: ethers.utils.parseEther("5000") }
      );

    //presale end time
    const presaleEndTime = (await time.latest()) + ONE_DAY_IN_SECS;

    return {
      USDTContract,
      tokenContract,
      presaleContract,
      owner,
      otherAccount,
      presaleEndTime,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { presaleContract, owner } = await loadFixture(
        deployAndDepositFixture
      );

      expect(await presaleContract.owner()).to.equal(owner.address);
    });

    it("Should have D2T token", async function () {
      const { tokenContract, presaleContract } = await loadFixture(
        deployAndDepositFixture
      );

      expect(await tokenContract.balanceOf(presaleContract.address)).to.equal(
        MINT_AMOUNT
      );
    });
  });

  describe("Deposit", function () {
    it("Should revert with the right error if called from another account", async function () {
      const { presaleContract, otherAccount } = await loadFixture(
        deployAndDepositFixture
      );
      await expect(
        presaleContract.connect(otherAccount).deposit("100")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should add token balance", async function () {
      const { presaleContract, tokenContract, owner } = await loadFixture(
        deployAndDepositFixture
      );
      //Mint tokens to owner's address
      await tokenContract.mint(owner.address, "100");

      //Approve tokens
      await tokenContract.approve(presaleContract.address, "100");
      const oldBalance = await tokenContract.balanceOf(presaleContract.address);
      await presaleContract.deposit("100");
      const newBalance = await tokenContract.balanceOf(presaleContract.address);

      expect(newBalance.sub(oldBalance)).to.equal("100");
    });
  });

  describe("Enable Claim", function () {
    it("Should revert with the right error if called from another account", async function () {
      const { presaleContract, otherAccount } = await loadFixture(
        deployAndDepositFixture
      );
      await expect(
        presaleContract.connect(otherAccount).enableClaim()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should set isClaimEnabled as true", async function () {
      const { presaleContract, owner } = await loadFixture(
        deployAndDepositFixture
      );
      await presaleContract.enableClaim();
      expect(await presaleContract.isClaimEnabled()).to.equal(true);
    });
  });

  describe("Get USDT Amount", function () {
    it("Should revert with the right error if called when presale is ended by calling closePresale()", async function () {
      const { presaleContract } = await loadFixture(deployAndDepositFixture);
      await presaleContract.closePresale();
      await expect(presaleContract.getUSDTAmount("1000")).to.be.revertedWith(
        "Presale is ended"
      );
    });

    it("Should revert with the right error if called when presale is ended by time passed", async function () {
      const { presaleContract, presaleEndTime } = await loadFixture(
        deployAndDepositFixture
      );
      await time.increaseTo(presaleEndTime);

      await expect(presaleContract.getUSDTAmount("1000")).to.be.revertedWith(
        "Presale is ended"
      );
    });

    it("Should return correct USDT value", async function () {
      const { presaleContract } = await loadFixture(deployAndDepositFixture);

      //Buy 1000 tokens
      const result1 = new BN("1000").mul(new BN("40000"));
      expect(await presaleContract.getUSDTAmount("1000")).to.equal(result1);

      //Buy 40000000 tokens
      const result2 = new BN("35000000")
        .mul(new BN("40000"))
        .add(new BN("5000000").mul(new BN("47500")));
      expect(await presaleContract.getUSDTAmount("40000000")).to.equal(result2);
    });
  });

  describe("Buy D2TToken with USDT", function () {
    it("Should revert with the right error if called with wrong token amount", async function () {
      const { presaleContract } = await loadFixture(deployAndDepositFixture);
      await expect(
        presaleContract.buyD2TTokenWithUSDT("999")
      ).to.be.revertedWith(
        "You have to buy more than 1000 tokens, less than 50000000 tokens"
      );
      await expect(
        presaleContract.buyD2TTokenWithUSDT("50000001")
      ).to.be.revertedWith(
        "You have to buy more than 1000 tokens, less than 50000000 tokens"
      );
    });

    it("Should receive USDT", async function () {
      const { presaleContract, USDTContract } = await loadFixture(
        deployAndDepositFixture
      );
      await USDTContract.approve(presaleContract.address, "40000000");
      //Buy 1000 tokens
      await presaleContract.buyD2TTokenWithUSDT("1000");

      expect(await USDTContract.balanceOf(presaleContract.address)).to.equal(
        "40000000"
      );
    });

    it("totalSoldAmount and tokenBalance should increase", async function () {
      const { presaleContract, USDTContract, owner, otherAccount } =
        await loadFixture(deployAndDepositFixture);
      await USDTContract.approve(presaleContract.address, "40000000");

      //Buy 1000 tokens 1000 * 10 ** 18
      await presaleContract.buyD2TTokenWithUSDT("1000");
      expect(await presaleContract.tokenBalance(owner.address)).to.equal(
        "1000000000000000000000"
      );

      await USDTContract.approve(presaleContract.address, "40000000");
      //Buy another 1000 tokens
      await presaleContract.buyD2TTokenWithUSDT("1000");
      expect(await presaleContract.tokenBalance(owner.address)).to.equal(
        "2000000000000000000000"
      );
      expect(await presaleContract.totalSoldTokenAmount()).to.equal("2000");
      await USDTContract.connect(otherAccount).approve(
        presaleContract.address,
        "40000000"
      );
      //Another account buys another 1000 tokens
      await presaleContract.connect(otherAccount).buyD2TTokenWithUSDT("1000");
      expect(await presaleContract.totalSoldTokenAmount()).to.equal("3000");
    });

    it("step should increase when buy more than amount of each step", async function () {
      const { presaleContract, USDTContract, owner } = await loadFixture(
        deployAndDepositFixture
      );
      await USDTContract.approve(presaleContract.address, "1637500000000");
      //Buy 40000000 tokens
      await presaleContract.buyD2TTokenWithUSDT("40000000");
      expect(await presaleContract.currentStep()).to.equal("1");
    });
  });

  describe("Buy D2TToken With ETH", function () {
    it("Should have correct eth amount", async function () {
      const { presaleContract, owner } = await loadFixture(
        deployAndDepositFixture
      );
      //Buy 1000 tokens
      const USDTAmount = await presaleContract.getUSDTAmount("1000");
      const ETHAmount = await presaleContract.getETHAmount(USDTAmount);
      expect(
        await presaleContract.buyD2TTokenWithETH("1000", { value: ETHAmount })
      ).to.changeEtherBalances(
        [owner, presaleContract],
        [-ETHAmount, ETHAmount]
      );
    });
    it("Should revert with the right error if user sent wrong eth amount", async function () {
      const { presaleContract } = await loadFixture(deployAndDepositFixture);
      //Buy 1000 tokens
      const USDTAmount = await presaleContract.getUSDTAmount("1000");
      const ETHAmount = await presaleContract.getETHAmount(USDTAmount);
      console.log(ETHAmount.sub(10));
      await expect(
        presaleContract.buyD2TTokenWithETH("1000", {
          value: ETHAmount.sub(10),
        })
      ).to.be.revertedWith("Insufficient ETH amount.");
    });
  });

  describe("Withdraw USDT", function () {
    it("Should revert with the right error if called from another account", async function () {
      const { presaleContract, otherAccount } = await loadFixture(
        deployAndDepositFixture
      );
      await expect(
        presaleContract.connect(otherAccount).withdrawUSDT()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should swap eth for tokens", async function () {
      const { presaleContract, owner } = await loadFixture(
        deployAndDepositFixture
      );
      //Buy 1000 tokens
      const USDTAmount = await presaleContract.getUSDTAmount("1000");
      const ETHAmount = await presaleContract.getETHAmount(USDTAmount);
      await presaleContract.buyD2TTokenWithETH("1000", { value: ETHAmount });
      await presaleContract.withdrawUSDT();
      expect(
        await ethers.provider.getBalance(presaleContract.address)
      ).to.equal("0");
    });

    it("Should transfer USDT to owner address", async function () {
      const { presaleContract, USDTContract, owner } = await loadFixture(
        deployAndDepositFixture
      );
      //Buy 1000 tokens
      await USDTContract.approve(presaleContract.address, "40000000");
      await presaleContract.buyD2TTokenWithUSDT("1000");
      const oldBalance = await USDTContract.balanceOf(owner.address);
      await presaleContract.withdrawUSDT();
      const newBalance = await USDTContract.balanceOf(owner.address);
      expect(newBalance.sub(oldBalance)).to.equal("40000000");
    });
  });

  describe("Claim Tokens", function () {
    it("Should revert with the right error if called when presale is not ended", async function () {
      const { presaleContract, USDTContract } = await loadFixture(
        deployAndDepositFixture
      );
      //Buy 1000 tokens
      await USDTContract.approve(presaleContract.address, "40000000");
      await presaleContract.buyD2TTokenWithUSDT("1000");
      await expect(presaleContract.claim()).to.be.revertedWith(
        "Presale is in progress"
      );
    });

    it("Should revert with the right error if called when claim is not enabled", async function () {
      const { presaleContract, USDTContract, presaleEndTime } =
        await loadFixture(deployAndDepositFixture);
      //Buy 1000 tokens
      await USDTContract.approve(presaleContract.address, "40000000");
      await presaleContract.buyD2TTokenWithUSDT("1000");
      await time.increaseTo(presaleEndTime);
      await expect(presaleContract.claim()).to.be.revertedWith(
        "Claim is not enabled"
      );
    });

    it("Should send tokens to user claimed", async function () {
      const {
        presaleContract,
        tokenContract,
        USDTContract,
        presaleEndTime,
        owner,
      } = await loadFixture(deployAndDepositFixture);
      //Buy 1000 tokens
      await USDTContract.approve(presaleContract.address, "40000000");
      await presaleContract.buyD2TTokenWithUSDT("1000");
      //Time passed and enableClaim()
      await time.increaseTo(presaleEndTime);
      await presaleContract.enableClaim();

      const oldBalance = await tokenContract.balanceOf(owner.address);
      const claimBalance = await presaleContract.tokenBalance(owner.address);
      //Claim tokens
      await presaleContract.claim();

      const newBalance = await tokenContract.balanceOf(owner.address);
      expect(newBalance.sub(oldBalance)).to.be.equal(claimBalance);
    });
  });
});
