import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, run } from "hardhat";
import { MAX_UINT } from "../utils/constants";

const migratorAddress = '0xe3b6CC7b76a7f67BBCcb66c010780bE0AF31Ff05'
const deadline = '1692624600'

const mainDeployerAddress = '0xfE351F5Ed699fd5eA80b906F89DfdAd2f885A46C'

async function main() {
    const migrator = await ethers.getContractAt('Migrator', migratorAddress);

    await (await migrator.grantRole(await migrator.SETTER_ROLE(), mainDeployerAddress)).wait();
    await (await migrator.setEarlyMigrationDeadline(deadline)).wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });