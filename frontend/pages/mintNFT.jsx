
import {useEffect, useState} from 'react';
import {ethers, Contract} from 'ethers';
import { 
  KECCAK_NFT_CONTRACT_ADDRESS,
  KECCAK_NFT_ABI,
} from '../utils/constants';
import { useRouter } from 'next/router';


export default function MintNFT(){
  const router = useRouter();
  const [currentAccount, setCurrentAccount] = useState("");
  const [nftMinted, setNftMinted] = useState(false)

  const mintNFT = async () => {
    try {
      const { ethereum } = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner()
        const KeccakNFT = new Contract(
          KECCAK_NFT_CONTRACT_ADDRESS,
          KECCAK_NFT_ABI,
          signer
        )
        const minted = await KeccakNFT.mint({
          value: ethers.utils.parseEther("0.001")
        })
        await minted.wait();
        alert("NFT minted")
        setNftMinted(true);
      }
      
    } catch (error) {
      console.error(error) 
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

  useEffect(() => {
    isWalletConnected().then(()=>{
      getMintedNFT()

    });
  },[]);
  return (
      <main>
        <h1>Road to Web3 - GOVERNANCE HACKATHON</h1>
        {currentAccount?(
          nftMinted?<p>NFT already minted.<br/>
            Go back to vote page.
            <button onClick={()=>router.push('/')}>Voting Page</button>
          </p>:
            <button onClick={mintNFT}> Mint your Keccak NFT </button>
          ): (
            <button onClick={connectWallet}> Connect your wallet </button>
          )}
      </main>
    )
}