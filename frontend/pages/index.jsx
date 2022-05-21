import {useEffect, useState} from 'react';
import {ethers} from 'ethers';

import abi from '../../smart-contracts/artifacts/contracts/KeccakDAO.sol';

export default function Home() {

const [currentAccount, setCurrentAccount] = useState("");
  
  const checkIfWalletIsConnected = async () => {
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

  const contractAddress = "0xa4d5bfa5e43b67E6f8dE8F75Ca38e019B01eA66e"
  const contractABI = abi.abi
  
  return (
    <main>
      <h1>Road to Web3 - GOVERNANCE HACKATHON</h1>
      {currentAccount ? (
        <h2>Welcome back</h2>
      ) : (
        <button onClick={connectWallet}> Connect your wallet </button>
      )}
    </main>
  )
}