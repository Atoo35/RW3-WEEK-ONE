//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract Box {
  uint private value;
  event ValueChanged(uint value);

  function store(uint newValue) public{
    value = newValue;
    emit ValueChanged(value);
  }
  
  function getValue() public view returns (uint){
    return value;
  }
}