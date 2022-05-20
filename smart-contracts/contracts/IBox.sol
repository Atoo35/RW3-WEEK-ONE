// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IBox{
  function store(uint newValue) external;
  function getValue() external view returns (uint);
}