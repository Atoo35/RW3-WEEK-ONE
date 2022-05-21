//SPDX-License-Identifier: MIT
//0x83b43E3b40758E538a2689ebBE0c11582D0958C9
pragma solidity ^0.8.4;

contract Topic {
  string private topic;
  event ValueChanged(string topic);

  function storeTopic(string memory newTopic) public{
    topic = newTopic;
    emit ValueChanged(topic);
  }
  
  function getTopic() public view returns (string memory){
    return topic;
  }
}