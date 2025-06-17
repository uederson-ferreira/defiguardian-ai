import { run } from "hardhat";

export async function verify(contractAddress: string, args: any[]) {
  console.log("Verificando contrato...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Contrato já verificado!");
    } else {
      console.log(e);
    }
  }
} 