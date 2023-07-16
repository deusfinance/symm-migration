import { ethers, network, run } from "hardhat";
import { InitializableTransparentUpgradeableProxy__factory } from "../typechain-types";
import { expect } from "chai";

const migratorAddress = '0xe3b6CC7b76a7f67BBCcb66c010780bE0AF31Ff05'
const contractDeployerAddress = '0x648c8F802F2Fd7F97dE4F8CC7612cC360A7A5a6c'
const proxyAdmin = '0xeede8359fbCC2550F56C3855473F4a944eD11185'
const mainDeployerAddress = '0xfE351F5Ed699fd5eA80b906F89DfdAd2f885A46C'

const bytecode = InitializableTransparentUpgradeableProxy__factory.bytecode
const salt = 1

async function main() {
    const proxy = await ethers.getContractAt('InitializableTransparentUpgradeableProxy', migratorAddress)
    const migrator = await ethers.getContractAt('Migrator', migratorAddress)
    const contractDeployer = await ethers.getContractAt('ContractDeployer', contractDeployerAddress)

    expect(await contractDeployer.getDeployAddress(bytecode, salt)).eq(migratorAddress)

    console.log('Start Deploying')

    let tx = await contractDeployer.deploy(bytecode, salt)
    await tx.wait()
    console.log('Proxy Deployed')

    const Migrator = await ethers.getContractFactory('Migrator')
    const migratorImp = await Migrator.deploy()
    await migratorImp.deployTransaction.wait()
    await migratorImp.deployed()
    console.log('Imp Deployed')

    tx = await proxy.initialize(migratorImp.address, proxyAdmin, '0x')
    await tx.wait()
    console.log('Proxy Initialized')

    tx = await migrator.initialize(mainDeployerAddress)
    await tx.wait()
    console.log('Migrator Initialized')

    console.log('done. deadline: ', await migrator.earlyMigrationDeadline())

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