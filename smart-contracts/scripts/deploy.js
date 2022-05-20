const { ethers } = require('hardhat');
const {
  KECCAK_NFT_CONTRACT_NAME,
  TOKEN_BASE_URI,
  NFT_NAME,
  NFT_SYMBOL,
  TOPIC_CONTRACT_NAME,
  DAO_CONTRACT_NAME
} = require('../constants')


const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const main = async () => {
  const [owner, alice, bob] = await ethers.getSigners();
  console.log(`Owner: ${owner.address}\nAlice: ${alice.address}\nBob: ${bob.address}`)
  const keccakNFTContract = await ethers.getContractFactory(KECCAK_NFT_CONTRACT_NAME);
  const keccakNFT = await keccakNFTContract.deploy(
    TOKEN_BASE_URI,
    NFT_NAME,
    NFT_SYMBOL
  );
  await keccakNFT.deployed()
  // console.log(`Balance of owner: ${ethers.utils.formatEther(await ethers.provider.getBalance(owner.address))}`)
  console.log(`Keccak NFT contract deployed at address: ${keccakNFT.address}`);
  
  //deploy box contract
  const topicContract = await ethers.getContractFactory(TOPIC_CONTRACT_NAME);
  const topic = await topicContract.deploy();
  await topic.deployed();
  topic.on('ValueChanged',(value)=>{
    console.log('in listen event')
    console.log(`Topic value changed to ${value}`)
  })

  console.log(`Topic contract deployed at address: ${topic.address}`);

  
  //deploy dao
  const keccakDAOContract = await ethers.getContractFactory(DAO_CONTRACT_NAME);
  const keccakDAO = await keccakDAOContract.deploy(topic.address, keccakNFT.address);
  await keccakDAO.deployed();
  console.log(`Keccak DAO contract deployed at address: ${keccakDAO.address}`);

  //comment out while deploying to test net
  await test(topic, keccakNFT, keccakDAO, [owner, alice, bob])

}

const test = async (topic, keccakNFT, keccakDAO, addresses) => {

  const [owner, alice, bob] = addresses
  //mint to owner
  await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
  console.log(`Owner nft balance: ${await keccakNFT.balanceOf(owner.address)}`)

  //mint to alice
  await keccakNFT.connect(alice).mint({value:ethers.utils.parseEther("0.001")});
  console.log(`Alice nft balance: ${await keccakNFT.balanceOf(alice.address)}`)

  //create proposal
  const proposalTx = await keccakDAO.connect(alice).createProposal("Learn Solidity");
  const rc = await proposalTx.wait(1);
  let event = rc.events.find(event => event.event === 'ProposalCreated');
  const proposalId = event.args.proposalId
  console.log(`Proposal value: ${event.args.newTopic}`)

  //vote on proposal with valid address
  const voteTx = await keccakDAO.connect(owner).voteOnProposal(proposalId.toString(),0);
  await voteTx.wait(1);

  //vote on proposal with invalid address fails
  // const voteTx2 = await keccakDAO.connect(bob).voteOnProposal(proposalId.toString(),0);
  // await voteTx2.wait(1);
  
  await delay(5000);  // --> kept the default delay of 5 seconds
  //execute proposal
  const executeTx = await keccakDAO.connect(owner).executeProposal(proposalId.toString());
  const erc = await executeTx.wait(1);

  //check if proposal was executed
  const topicTx = await topic.getTopic();
  console.log(`Topic value: ${topicTx.toString()}`)
}

main()
  .then(()=>process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

