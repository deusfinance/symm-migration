import { ethers } from "hardhat";
import { expect } from "chai";

const migratorAddress = '0xe3b6CC7b76a7f67BBCcb66c010780bE0AF31Ff05'
const proxyAdminAddress = '0xeede8359fbCC2550F56C3855473F4a944eD11185'
const mainDeployerAddress = '0xfE351F5Ed699fd5eA80b906F89DfdAd2f885A46C'

const admin = '0xE5227F141575DcE74721f4A9bE2D7D636F923044' // checked

const msig = '0x7F5Ae1dC8D2B5d599409C57978D21Cf596D37996'
// const publicMsig = '0x2A555D90Dde030d3e40A4DEA6F0BA3DE5a14079e'

async function main() {
    const migrator = await ethers.getContractAt('Migrator', migratorAddress)
    const proxyAdmin = await ethers.getContractAt('Ownable', proxyAdminAddress)

    console.log('Change ProxyAdmin Owner');
    await (await proxyAdmin.transferOwnership(msig)).wait()

    console.log('Revoke Setter Role');
    await (await migrator.revokeRole(await migrator.SETTER_ROLE(), mainDeployerAddress)).wait();

    console.log('Grant Setter Role');
    await (await migrator.grantRole(await migrator.SETTER_ROLE(), msig)).wait()

    console.log('Grant Withdrawer Role');
    await (await migrator.grantRole(await migrator.WITHDRAWER_ROLE(), msig)).wait()

    console.log('Grant Pauser Role')
    const pauserRole = await migrator.PAUSER_ROLE();
    await (await migrator.grantRole(pauserRole, mainDeployerAddress)).wait();
    await (await migrator.grantRole(pauserRole, admin)).wait();
    await (await migrator.grantRole(pauserRole, msig)).wait();
    // await (await migrator.grantRole(pauserRole, publicMsig)).wait();

    console.log('Grant DefaultAdmin Role');
    const defaultAdminRole = await migrator.DEFAULT_ADMIN_ROLE();
    await (await migrator.grantRole(defaultAdminRole, msig)).wait()
    expect(await migrator.hasRole(defaultAdminRole, msig)).eq(true)

    console.log('Renounce DefaultAdmin Role');
    await (await migrator.renounceRole(defaultAdminRole, mainDeployerAddress)).wait()
    expect(await migrator.hasRole(defaultAdminRole, mainDeployerAddress)).eq(false)

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });