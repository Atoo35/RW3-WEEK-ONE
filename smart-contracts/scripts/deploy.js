const { ethers } = require('hardhat');
const {
  KECCAK_NFT_CONTRACT_NAME,
  TOKEN_BASE_URI,
  NFT_NAME,
  NFT_SYMBOL,
  BOX_CONTRACT_NAME,
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
  const boxContract = await ethers.getContractFactory(BOX_CONTRACT_NAME);
  const box = await boxContract.deploy();
  await box.deployed();
  box.on('ValueChanged',(value)=>{
    console.log('in listen event')
    console.log(`Box value changed to ${value}`)
  })

  console.log(`Box contract deployed at address: ${box.address}`);

  
  //deploy dao
  const keccakDAOContract = await ethers.getContractFactory(DAO_CONTRACT_NAME);
  const keccakDAO = await keccakDAOContract.deploy(box.address, keccakNFT.address);
  await keccakDAO.deployed();
  console.log(`Keccak DAO contract deployed at address: ${keccakDAO.address}`);

  //comment out while deploying to test net
  await test(box, keccakNFT, keccakDAO, [owner, alice, bob])

}

const test = async (box, keccakNFT, keccakDAO, addresses) => {

  const [owner, alice, bob] = addresses
  //mint to owner
  await keccakNFT.connect(owner).mint({value:ethers.utils.parseEther("0.001")});
  console.log(`Owner nft balance: ${await keccakNFT.balanceOf(owner.address)}`)

  //mint to alice
  await keccakNFT.connect(alice).mint({value:ethers.utils.parseEther("0.001")});
  console.log(`Alice nft balance: ${await keccakNFT.balanceOf(alice.address)}`)

  //create proposal
  const proposalTx = await keccakDAO.connect(alice).createProposal(77);
  const rc = await proposalTx.wait(1);
  let event = rc.events.find(event => event.event === 'ProposalCreated');
  const proposalId = event.args.proposalId
  console.log(`Proposal value: ${event.args.value.toString()}`)

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
  const boxTx = await box.getValue();
  console.log(`Box value: ${boxTx.toString()}`)
}

main()
  .then(()=>process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

