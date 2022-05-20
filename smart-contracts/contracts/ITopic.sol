// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ITopic{
  function storeTopic(string memory newTopic) external;
  function getTopic() external view returns (string memory);
}