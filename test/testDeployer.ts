import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Deployer, Migrator__factory } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

describe("Deployer", function () {
    let admin: SignerWithAddress, deployer: SignerWithAddress;
    let deployerContract: Deployer;

    async function deployContract() {
        const Factory = await ethers.getContractFactory('Deployer')
        return upgrades.deployProxy(Factory, [admin.address, deployer.address])
    }

    before(async () => {
        [admin, deployer] = await ethers.getSigners()
    });

    beforeEach(async () => {
        deployerContract = (await loadFixture(deployContract)) as Deployer
    });

    it("Should deploy bytecode", async function () {
        const bytecode = Migrator__factory.bytecode
        const salt = 1

        const contractAddress = await deployerContract.connect(deployer).callStatic.deploy(bytecode, salt)
        await deployerContract.connect(deployer).deploy(bytecode, salt)

        expect(
            await deployerContract.getDeployAddress(bytecode, salt)
        ).eq(
            contractAddress
        ).eq(
            await deployerContract.deployedContracts(0)
        )

    });
});
