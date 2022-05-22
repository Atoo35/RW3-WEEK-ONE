import {useEffect, useState} from 'react';
import {ethers, Contract} from 'ethers';
import {
  KECCAK_DAO_CONTRACT_ADDRESS,
  KECCAK_NFT_CONTRACT_ADDRESS,
  KECCAK_NFT_ABI,
  KECCAK_DAO_ABI,
  TOPIC_CONTRACT_ADDRESS,
  TOPIC_ABI,
} from '../utils/constants'
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
const [currentAccount, setCurrentAccount] = useState("");
const [proposals, setProposals] = useState([]);
const [numProposals, setNumProposals] = useState("0")
const [nftMinted, setNftMinted] = useState(false)
const [proposalTopic, setProposalTopic] = useState("");
const [topic,setTopic] = useState("")

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

  const fetchProposalById = async (id) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const KeccakDAO = new ethers.Contract(
          KECCAK_DAO_CONTRACT_ADDRESS,
          KECCAK_DAO_ABI,
          signer
        );
        
        console.log("fetching proposals from the blockchain..");
        const proposals = await KeccakDAO.proposals(id);
        const parsedProposal = {
          proposalId: id,
          newTopic: proposals.newTopic.toString(),
          deadline: new Date(parseInt(proposals.deadline.toString()) * 1000),
          agree: proposals.agree.toString(),
          disagree: proposals.disagree.toString(),
          executed: proposals.executed,
        };
        console.log(parsedProposal)
        return parsedProposal;
      } else {
        alert("Metamask is not connected");
      }
      
    } catch (error) {
      console.log(error);
    }
  };

  const getProposals = async() =>{
    try {
      const proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
    }
  }

  const getTopic = async() =>{
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const Topic = new ethers.Contract(
        TOPIC_CONTRACT_ADDRESS,
        TOPIC_ABI,
        signer
      );
      
      console.log("fetching current topic.");
      const topic = await Topic.getTopic();
      console.log(topic)
      setTopic(topic);
    } catch (error) {
      console.error(error);
    }
  }

  const getNumProposalInDAO = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const KeccakDAO = new ethers.Contract(
          KECCAK_DAO_CONTRACT_ADDRESS,
          KECCAK_DAO_ABI,
          signer
        );
        
        console.log("fetching proposals from the blockchain..");
        const daoNumProposals = await KeccakDAO.numProposals();
        setNumProposals(daoNumProposals.toString())
      } else {
        alert("Metamask is not connected");
      }
      
    } catch (error) {
      console.log(error);
    }
  }
  
  const getMintedNFT = async () => {
    try {
      const { ethereum } = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner()
        const accounts = await ethereum.request({method: "eth_requestAccounts"})
        const KeccakNFT = new Contract(
          KECCAK_NFT_CONTRACT_ADDRESS,
          KECCAK_NFT_ABI,
          signer
        )
        const minted = await KeccakNFT.balanceOf(accounts[0])
        console.log("NFT minted: "+minted.toString())
        if(minted.toString()>0)
          setNftMinted(true);
      }
      
    } catch (error) {
      console.error(error) 
    }
  }

  const createProposal = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const KeccakDAO = new ethers.Contract(
          KECCAK_DAO_CONTRACT_ADDRESS,
          KECCAK_DAO_ABI,
          signer
        );
        console.log("Creating proposal..");
        const tx = await KeccakDAO.createProposal(proposalTopic);
        await tx.wait();
        await getNumProposalInDAO()
        await getProposals();
        console.log("Proposal created: ", tx.hash);
      } else {
        alert("Metamask is not connected");
      }

    } catch (error) {
      console.log(error);
    }
  }

  const voteProposal = async (proposalId, vote) => {
    // TODO
    let tx;
    let provider;
    try {
      const { ethereum } = window;
      if (ethereum) {
        provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const KeccakDAO = new ethers.Contract(
          KECCAK_DAO_CONTRACT_ADDRESS,
          KECCAK_DAO_ABI,
          signer
        );
        console.log("Voting for proposal..");
        tx = await KeccakDAO.voteOnProposal(proposalId, vote);
        await tx.wait();
        console.log("Proposal Voted: ", tx.hash);
      } else {
        alert("Metamask is not connected");
      }

    } catch (error) {
      console.log(error)
      // console.log(error.reason);
      alert(error.reason)
    }
  }

  const executeProposal = async (proposalId) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const KeccakDAO = new ethers.Contract(
          KECCAK_DAO_CONTRACT_ADDRESS,
          KECCAK_DAO_ABI,
          signer
        );
        console.log("Executing proposal..");
        const tx = await KeccakDAO.executeProposal(proposalId);
        await tx.wait();
        await getTopic();
        console.log("Proposal Executed: ", tx.hash);
      } else {
        alert("Metamask is not connected");
      }

    } catch (error) {
      alert(error.reason);
    }
}

  useEffect(() => {
    isWalletConnected().then(()=>{
       getMintedNFT();
       getNumProposalInDAO();
       getProposals();
       getTopic();
    });
  },[]);

  useEffect(() => {
    getNumProposalInDAO();
    getProposals();
  },[numProposals])
  
  return (
    <main>
      <h1>Road to Web3 - GOVERNANCE HACKATHON</h1>
      {currentAccount ? (
      /* TODO show each proposal with a button to vote*/
      <div>
        <h2>Welcome back</h2>
        {topic?(<h3>Current Topic: {topic}</h3>):(<h3>No topic set</h3>)}
        {
        nftMinted?(
        // loop through every proposal
          <div>
            <input type="text" placeholder='Enter proposal topic' onChange={(e)=>setProposalTopic(e.target.value)}/>
            <button onClick={createProposal}>Propose</button>
          { 
            proposals.map((proposal, index) => (
              <div key={index} style={{border:"2px solid", "borderRadius":"5px", padding: "5px", margin: "5px"}}>
                <p> Proposal topic: {proposal.newTopic}</p>
                <p> Deadline: {proposal.deadline.toLocaleString()}</p>
                
                {proposal.deadline.toLocaleString() < new Date().toLocaleString()? (
                  !proposal.executed?(
                  <button onClick={()=>executeProposal(proposal.proposalId)}>Execute Proposal</button>
                  ):<p>Proposal Already Executed/Denied.</p>
                ):
                (
                  <div>
                      <button type="button" onClick={() => voteProposal(proposal.proposalId,0)}>
                        Vote for this proposal!
                      </button>
                      <button type="button" onClick={() => voteProposal(proposal.proposalId,1)}>
                        Vote against this proposal!
                      </button>
                  </div>
                )}
              </div>))
          }
          </div>
          ): (
            <div>
            <p>Please mint your nft here</p>
            <button onClick={()=>router.push('/mintNFT')}>Mint NFT</button>
            </div>
          )
        
        }
      
      </div>
      ) : (
        <button onClick={connectWallet}> Connect your wallet </button>
      )}

    </main>
  )
}