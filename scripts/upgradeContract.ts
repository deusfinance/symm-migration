import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, run, upgrades } from "hardhat";
import { MAX_UINT } from "../utils/constants";


const proxyAddress = "0xe3b6CC7b76a7f67BBCcb66c010780bE0AF31Ff05"
const contractName = 'Migrator'

async function main() {
    const Factory = await ethers.getContractFactory(contractName)

    // await upgrades.forceImport(proxyAddress, Factory)

    await upgrades.upgradeProxy(proxyAddress, Factory)

    if (network.name != 'local') {
        await run('verify:verify', {
            address: proxyAddress,
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