import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const nonce = await signer.getNonce();
  console.log("Endereço:", signer.address);
  console.log("Nonce atual:", nonce);
}

main(); 