import {useEffect, useState} from 'react';
import {ethers} from 'ethers';

import abi from '../../smart-contracts/artifacts/contracts/KeccakDAO.sol';

export default function Home() {

const [currentAccount, setCurrentAccount] = useState("");
const [proposals, setProposals] = useState([]);

const contractAddress = "0x286Ec26CA9f1352c526f593EAe6F8bB1e53fF977"
const contractABI = abi.abi
  
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window

      if (!ethereum){
        return
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"})
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log(error);
    }
  }

  const getProposals = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const KeccakDAO = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        
        console.log("fetching proposals from the blockchain..");
        const proposals = await KeccakDAO.getProposals();
        console.log("fetched!");
        setProposals(proposals);
      } else {
        console.log("Metamask is not connected");
      }
      
    } catch (error) {
      console.log(error);
    }
  };

  const voteProposal = async (proposal) => {
    // TODO
  }

  useEffect(async () => {
    isWalletConnected();
    getProposals();
  });

  
  return (
    <main>
      <h1>Road to Web3 - GOVERNANCE HACKATHON</h1>
      {currentAccount ? (
      /* TODO show each proposal with a button to vote*/
      <div>
        <h2>Welcome back</h2>
        {/*
        
        // loop through every proposal
        proposals.map((proposal, index) => (
          <div key={index} style={{border:"2px solid", "borderRadius":"5px", padding: "5px", margin: "5px"}}>
            <p> Proposal topic: {proposal.newTopic}</p>
            <button type="button" onClick={() => voteProposal(proposal)}>
              Vote for this proposal!
            </button>
          </div>))
        
        
        */}
      
      </div>
      ) : (
        <button onClick={connectWallet}> Connect your wallet </button>
      )}

    </main>
  )
}