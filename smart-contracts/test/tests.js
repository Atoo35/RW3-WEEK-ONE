const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const {
  KECCAK_NFT_CONTRACT_NAME,
  TOKEN_BASE_URI,
  NFT_NAME,
  NFT_SYMBOL,
  TOPIC_CONTRACT_NAME,
  DAO_CONTRACT_NAME
} = require("../constants");

const deployTopicContract = async (owner) => {
  const topicContract = await ethers.getContractFactory(TOPIC_CONTRACT_NAME);
  const topic = await topicContract.connect(owner).deploy();
  await topic.deployed();
  // console.log(`Topic contract deployed at address: ${topic.address}`);
  return topic;
};

const deployNFTContract = async (owner) => {
  const keccakNFTContract = await ethers.getContractFactory(KECCAK_NFT_CONTRACT_NAME);
  const keccakNFT = await keccakNFTContract.deploy(
    TOKEN_BASE_URI,
    NFT_NAME,
    NFT_SYMBOL
  );
  await keccakNFT.deployed();
  // console.log(`Keccak NFT contract deployed at address: ${keccakNFT.address}`);
  return keccakNFT;
};

const deployDAOContract = async (topic, keccakNFT, owner) => {
  const keccakDAOContract = await ethers.getContractFactory(DAO_CONTRACT_NAME);
  const keccakDAO = await keccakDAOContract.deploy(topic.address, keccakNFT.address);
  await keccakDAO.deployed();
  // console.log(`Keccak DAO contract deployed at address: ${keccakDAO.address}`);
  return keccakDAO;
};

const createProposal = async (keccakDAO, owner) => {
    const proposalTx = await keccakDAO.connect(owner).createProposal("Learn Solidity");
    const rc = await proposalTx.wait(1);
    let event = rc.events.find(event => event.event === 'ProposalCreated');
    const proposalId = event.args.proposalId
    return proposalId;
};

describe("Topic", function () {
  it("Should return the new value once it's changed", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const topic = await deployTopicContract(owner);

    expect(await topic.getTopic()).to.equal("");

    await expect(topic.storeTopic("Learn Solidity"))
            .to.emit(topic, "ValueChanged")
            .withArgs('Learn Solidity');;

    expect(await topic.getTopic()).to.equal("Learn Solidity");
  });
});


describe("Keccak NFT", function () {
  it("Should return the new nft balance once it's changed", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    expect(await keccakNFT.balanceOf(owner.address)).to.equal(0);

    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});

    await mint.wait(1);

    expect(await keccakNFT.balanceOf(owner.address)).to.equal(1);
  });

  it("Should not mint nft with a value less than 0.001", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    expect(await keccakNFT.balanceOf(owner.address)).to.equal(0);

    await expect(keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.0000001")})).to.be.revertedWith("Not enough ETH sent.");
  });
});


describe("Keccak DAO", function () {
  it("Should not let non-nft owners create proposal", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);


    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});

    // // wait until the transaction is mined
    await mint.wait(1);

    await expect(keccakDAO.connect(alice).createProposal("Learn Solidity")).to.be.revertedWith('You must have a token to propose/vote.');
  });

  it("Should not let non-nft owners vote", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
    await mint.wait(1);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);

    const proposalId = await createProposal(keccakDAO, owner);

    await expect(keccakDAO.connect(alice).voteOnProposal(proposalId.toString(),1)).to.be.revertedWith('You must have a token to propose/vote.');
  });

  it("Should not let proposal be executed before deadline", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
    await mint.wait(1);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);

    const proposalId = await createProposal(keccakDAO, owner);

    await keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),1);

    await expect(keccakDAO.connect(owner).executeProposal(proposalId.toString())).to.be.revertedWith('DEADLINE_NOT_EXCEEDED');
  });

  it("Should not let voters vote twice", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
    await mint.wait(1);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);

    const proposalId = await createProposal(keccakDAO, owner);

    await keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),1);

    await expect(keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),1)).to.be.revertedWith('ALREADY_VOTED');
  });

  it("Should not let voters vote past deadline", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);
    
    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
    await mint.wait(1);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);

    const proposalId = await createProposal(keccakDAO, owner);

    await network.provider.send("evm_increaseTime", [5000])

    await expect(keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),1)).to.be.revertedWith('DEADLINE_EXCEEDED');
  });

  it("Should execute successfull proposal after deadline", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
    await mint.wait(1);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);

    const proposalId = await createProposal(keccakDAO, owner);

    await keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),0);

    await network.provider.send("evm_increaseTime", [5000])

    await expect(keccakDAO.connect(owner).executeProposal(proposalId.toString()))
          .to.emit(keccakDAO, 'ProposalExecutedSuccessfully')
          .withArgs(proposalId.toString(),'Learn Solidity')
          .to.emit(topic, "ValueChanged")
          .withArgs('Learn Solidity');

    expect(await topic.getTopic()).to.equal("Learn Solidity");
    
  });

  it("Should deny proposal if not enough votes after deadline", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
    await mint.wait(1);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);

    const proposalId = await createProposal(keccakDAO, owner);

    await keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),1);

    await network.provider.send("evm_increaseTime", [5000])

    await expect(keccakDAO.connect(owner).executeProposal(proposalId.toString()))
          .to.emit(keccakDAO, 'ProposalDenied')
          .withArgs(proposalId.toString(),'Learn Solidity');

    expect(await topic.getTopic()).to.equal("");
  });

  it("Should not execute an already executed proposal", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const keccakNFT = await deployNFTContract(owner);

    const mint = await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
    await mint.wait(1);

    const topic = await deployTopicContract(owner);

    const keccakDAO = await deployDAOContract(topic, keccakNFT, owner);

    const proposalId = await createProposal(keccakDAO, owner);

    await keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),0);

    await network.provider.send("evm_increaseTime", [5000])

    await expect(keccakDAO.connect(owner).executeProposal(proposalId.toString()))
          .to.emit(keccakDAO, 'ProposalExecutedSuccessfully')
          .withArgs(proposalId.toString(),'Learn Solidity')
          .to.emit(topic, "ValueChanged")
          .withArgs('Learn Solidity');

    await expect(keccakDAO.connect(owner).executeProposal(proposalId.toString()))
          .to.be.revertedWith('PROPOSAL_ALREADY_EXECUTED');
  });
});
