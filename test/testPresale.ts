import { ethers, network, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Migrator, Presale, TestERC20 } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { e, setERC20Balance } from "../utils/helpers";
import { MAX_UINT } from "../utils/constants";
import { expect } from "chai";
import { setNextBlockTimestamp } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time";

/*

describe("Presale", function () {
    let deployer: SignerWithAddress, admin: SignerWithAddress, user: SignerWithAddress, receiver: SignerWithAddress;
    let migrator: Migrator;
    let presale: Presale;

    const QUOTER = '0xAA2f0eb52db02650959463F9801442f5dF7D5CBe'
    const MIGRATOR = '0xe3b6CC7b76a7f67BBCcb66c010780bE0AF31Ff05'

    async function deployContract() {
        const migrator = (await ethers.getContractFactory('Migrator')).attach(MIGRATOR)
        const presale = await upgrades.deployProxy(await ethers.getContractFactory('Presale'), [admin.address])
        return [
            migrator, presale
        ]
    }

    before(async () => {
        [deployer, admin, user, receiver] = await ethers.getSigners()
    });

    beforeEach(async () => {
        [migrator, presale] = (await loadFixture(deployContract)) as [Migrator, Presale]
    });

    it("Should buy", async function () {
        const usdc = (await ethers.getContractFactory('ERC20')).attach(await presale.USDC())
        const deusAddress = await presale.DEUS()
        const amount = e(1000)

        await setERC20Balance(usdc.address, user.address, amount)
        await usdc.connect(user).approve(presale.address, MAX_UINT)

        const quoter = await ethers.getContractAt('IQuoter', QUOTER, user)
        let minAmountOut = await quoter.callStatic.quoteExactInputSingle(
            usdc.address,
            deusAddress,
            3000, // fee
            amount,
            0 // sqrtPriceLimitX96
        )
        minAmountOut = minAmountOut.mul(99).div(100)

        await presale.connect(user).buy(
            amount,
            minAmountOut,
            0,
            receiver.address
        )

        expect(await presale.totalUSDC()).eq(await presale.userUSDC(receiver.address)).eq(amount)
        expect(await presale.totalDEUS()).gte(await presale.userDEUS(receiver.address)).gte(minAmountOut)
        expect(await migrator.migratedAmount(2, receiver.address, deusAddress)).gte(minAmountOut)
    });

});

*/