import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractDeployer, Migrator__factory } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

describe("ContractDeployer", function () {
    let admin: SignerWithAddress, deployer: SignerWithAddress;
    let contractDeployer: ContractDeployer;

    async function deployContract() {
        const Factory = await ethers.getContractFactory('ContractDeployer')
        return upgrades.deployProxy(Factory, [admin.address, deployer.address])
    }

    before(async () => {
        [admin, deployer] = await ethers.getSigners()
    });

    beforeEach(async () => {
        contractDeployer = (await loadFixture(deployContract)) as ContractDeployer
    });

    it("Should deploy bytecode", async function () {
        const bytecode = Migrator__factory.bytecode
        const salt = 1

        const contractAddress = await contractDeployer.connect(deployer).callStatic.deploy(bytecode, salt)
        await contractDeployer.connect(deployer).deploy(bytecode, salt)

        expect(
            await contractDeployer.getDeployAddress(bytecode, salt)
        ).eq(
            contractAddress
        ).eq(
            await contractDeployer.deployedContracts(0)
        )

    });
});
