import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network, run, upgrades } from "hardhat";
import { MAX_UINT } from "../utils/constants";
import { InitializableTransparentUpgradeableProxy__factory } from "../typechain-types";


async function main() {
    console.log(
        InitializableTransparentUpgradeableProxy__factory.bytecode
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });