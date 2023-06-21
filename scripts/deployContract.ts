import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, run } from "hardhat";
import { MAX_UINT } from "../utils/constants";

const contractName = ''

async function main() {
    const Factory = await ethers.getContractFactory(contractName)

    const [deployer] = await ethers.getSigners();

    if (network.name == 'local') {
        await setBalance(deployer.address, MAX_UINT);
    }

    const implementation = await Factory.deploy();
    await implementation.deployTransaction.wait();
    await implementation.deployed();

    console.log('Deployed', implementation.address);

    if (network.name != 'local') {
        await run('verify:verify', {
            address: implementation.address,
            constructorArguments: []
        })
    }

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });