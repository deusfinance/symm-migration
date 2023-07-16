import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, run, upgrades } from "hardhat";
import { MAX_UINT } from "../utils/constants";

const contractName = 'ContractDeployer'

const mainDeployer = "0xfE351F5Ed699fd5eA80b906F89DfdAd2f885A46C"

import TransparentUpgradeableProxy from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json';

async function main() {
    const Factory = await ethers.getContractFactory(contractName)

    const [deployer] = await ethers.getSigners();

    if (network.name == 'local') {
        await setBalance(deployer.address, MAX_UINT);
    }

    // const proxy = await upgrades.deployProxy(Factory, [mainDeployer, mainDeployer])
    // await proxy.deployTransaction.wait()
    // await proxy.deployed()

    const ProxyFactory = await ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode, deployer);

    const proxy = await ProxyFactory.deploy("0x8E095091438B9778EE0F6e8d08fd7A4609Db6Ebc", "0xeede8359fbCC2550F56C3855473F4a944eD11185", '0x')
    await proxy.deployTransaction.wait()
    await proxy.deployed()

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