//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./ITopic.sol";
import "./IKeccakNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KeccakDAO is Ownable{
  ITopic topicContract;
  IKeccakNFT keccakNFT;
  event ProposalCreated(uint256 proposalId, string newTopic);
  event ProposalExecutedSuccessfully(uint256 proposalId, string newTopic);
  event ProposalDenied(uint256 proposalId, string newTopic);
  uint256 public numProposals;
  struct Proposal{
    string newTopic;
    uint deadline;
    uint agree;
    uint disagree;
    bool executed;
    mapping(uint => bool) voters;
  }
  enum Vote {
    AGREE, //  0
    DISAGREE // 1
  }
  mapping(uint256 => Proposal) public proposals;

  constructor(address _topicContract, address _keccakNFT) payable {
    topicContract = ITopic(_topicContract);
    keccakNFT = IKeccakNFT(_keccakNFT);
  }

  modifier nftHolderOnly() {
    require(keccakNFT.balanceOf(msg.sender) > 0, "You must have a token to propose/vote.");
    _;
  }

  modifier activeProposalOnly(uint256 proposalIndex) {
    require(
        proposals[proposalIndex].deadline > block.timestamp,
        "DEADLINE_EXCEEDED"
    );
    _;
  }

  modifier inactiveProposalOnly(uint256 proposalIndex) {
    require(
        proposals[proposalIndex].deadline <= block.timestamp,
        "DEADLINE_NOT_EXCEEDED"
    );
    require(
        proposals[proposalIndex].executed == false,
        "PROPOSAL_ALREADY_EXECUTED"
    );
    _;
  }

  function createProposal(string memory _newTopic) external nftHolderOnly returns(uint) {
    require(!proposals[numProposals].executed, "Proposal already executed.");
    Proposal storage proposal = proposals[numProposals];
    proposal.newTopic = _newTopic;
    proposal.deadline = block.timestamp + 5 ;
    numProposals++;
    emit ProposalCreated(numProposals - 1, _newTopic);
    return numProposals - 1;
  }

  function voteOnProposal(uint256 proposalIndex, Vote vote)
    external
    nftHolderOnly
    activeProposalOnly(proposalIndex)
  {
    Proposal storage proposal = proposals[proposalIndex];

    uint256 voterNFTBalance = keccakNFT.balanceOf(msg.sender);
    uint256 numVotes = 0;

    // Calculate how many NFTs are owned by the voter
    // that haven't already been used for voting on this proposal
    for (uint256 i = 0; i < voterNFTBalance; i++) {
        uint256 tokenId = keccakNFT.tokenOfOwnerByIndex(msg.sender, i);
        if (proposal.voters[tokenId] == false) {
            numVotes++;
            proposal.voters[tokenId] = true;
        }
    }
    require(numVotes > 0, "ALREADY_VOTED");

    if (vote == Vote.AGREE) {
        proposal.agree += numVotes;
    } else {
        proposal.disagree += numVotes;
    }
  }

  function executeProposal(uint256 proposalIndex)
    external
    nftHolderOnly
    inactiveProposalOnly(proposalIndex)
  {
    Proposal storage proposal = proposals[proposalIndex];

    if (proposal.agree > proposal.disagree) {
        topicContract.storeTopic(proposal.newTopic);
        emit ProposalExecutedSuccessfully(proposalIndex, proposal.newTopic);
    } else {
        emit ProposalDenied(proposalIndex, proposal.newTopic);
    }
    proposal.executed = true;
  }

  /// @dev withdrawEther allows the contract owner (deployer) to withdraw the ETH from the contract
  // function withdrawEther() external onlyOwner {
  //     payable(owner()).transfer(address(this).balance);
  // }

  //   // The following two functions allow the contract to accept ETH deposits directly
  //   // from a wallet without calling a function
  //   receive() external payable {}

  //   fallback() external payable {}
}