const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  KECCAK_NFT_CONTRACT_NAME,
  TOKEN_BASE_URI,
  NFT_NAME,
  NFT_SYMBOL,
  BOX_CONTRACT_NAME,
  DAO_CONTRACT_NAME
} = require("../constants");


describe("Box", function () {
  it("Should return the new value once it's changed", async function () {
    const boxContract = await ethers.getContractFactory(BOX_CONTRACT_NAME);
    const box = await boxContract.deploy();
    await box.deployed();

    expect(await box.getValue()).to.equal(0);

    const changeValue = await box.store(77);

    // // wait until the transaction is mined
    await changeValue.wait(1);

    expect(await box.getValue()).to.equal(77);
  });
});
