import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, run, upgrades } from "hardhat";
import { MAX_UINT } from "../utils/constants";

const contractName = 'Migrator'

async function main() {
    const Factory = await ethers.getContractFactory(contractName)

    const [deployer] = await ethers.getSigners();

    if (network.name == 'local') {
        await setBalance(deployer.address, MAX_UINT);
    }

    const proxy = await upgrades.deployProxy(Factory, [deployer.address])

    console.log('Deployed', proxy.address);

    if (network.name != 'local') {
        await run('verify:verify', {
            address: proxy.address,
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