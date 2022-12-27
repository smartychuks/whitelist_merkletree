const { expect } = require("chai");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

function encodeLeaf(address, spots) {
  // similar to abi in solidity
  return ethers.utils.defaultAbiCoder.encode(
    ["address", "uint64"],
    [address, spots]
  );
}

describe("Check if merkle root is working", function () {
  it("Should be able to verify if a given address is in whitelist or not", async function () {

    // test addressed to be used
    const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    // create elements to be encoded in the merkel tree
    const list = [
      encodeLeaf(owner.address, 2),
      encodeLeaf(addr1.address, 2),
      encodeLeaf(addr2.address, 2),
      encodeLeaf(addr3.address, 2),
      encodeLeaf(addr4.address, 2),
      encodeLeaf(addr5.address, 2),
    ];

    // create merkle tree
    const merkleTree = new MerkleTree(list, keccak256, {
      hashLeaves: true,
      sortPairs: true,
    });

    // calculate the merkle root
    const root = merkleTree.getHexRoot();

    // Deploy the contract
    const whitelist = await ethers.getContractFactory("Whitelist");
    const Whitelist = await whitelist.deploy(root);
    await Whitelist.deployed();

    // calculate proof that owner address is in the list off-chain.
    const leaf = keccak256(list[0]);
    const proof = merkleTree.getHexProof(leaf);

    // check in contract if leave exists
    let verified = await Whitelist.checkInWhitelist(proof, 2);
    expect(verified).to.equal(true);

    // test the contract using an invalid proof
    verified = await Whitelist.checkInWhitelist([], 2);
    expect(verified).to.equal(false);
  });
});