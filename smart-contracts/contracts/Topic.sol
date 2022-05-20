//SPDX-License-Identifier: MIT

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