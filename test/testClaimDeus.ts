import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ClaimDeus, Migrator, TestERC20 } from "../typechain-types";
import { impersonateAccount, loadFixture, setBalance, time } from "@nomicfoundation/hardhat-network-helpers";
import { e } from "../utils/helpers";
import { MAX_UINT } from "../utils/constants";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("ClaimDeus", function () {
    let deployer: SignerWithAddress, admin: SignerWithAddress, depositor: SignerWithAddress, user: SignerWithAddress
    let deus: TestERC20
    let claimDeus: ClaimDeus

    const merkleRoot = '0x31bc026b799ced455389115c03ccc75806786b41776e05117335d4c233a34c7f'
    const userAddress = '0xe2b9ddc83df26b81bea63df73117f73831505e86'
    const claimAmount = BigNumber.from('27194724677426387426')
    const proof = ['0xa76a4729654f5cfc814684f7531a27f4028655266efdad650bedc984b7db48bc', '0x12c5488d7f77da03b8e337d9a26b139a94445367192d399a91999de7c1c3f742', '0x62fc76d398a26231c74440ce41e67b9fc1bcab257b80258af6fc681508616ae9', '0x5cd96eb4cae452eec70c899e2a620d259ad930723807c7b235219707173542d0', '0x887e183fa069569ddaf9d3114552b7b7db3dd23634496d71eb83e227cc91d2b9', '0x0114adf087e8985d752094a9fceaf748faa74e5716500606f47bbfea8c22940f', '0x23a6ed9dc38ca8d0aa64f5a94ed9def466303551dad0a7e5967bf218cfe376a3', '0xebd2e7d92c336ae17907e74da6519abb901f9add621f34eb21de5bf96fc076f8', '0x7c3ebec00d61a11e44c3c492223a80c0abad84be097899dd7358abe451fd2fba', '0x307a27e4da0d159c8deaff5b4552189e778dc3266b60f49ac8722468b27f6dc3', '0x7c6b9dcdd69bd18c4fde82ea4bc39e338dd095e14e19479adf4ccfa9aad6543c', '0xce966c60f846c5d6989c0a5dbe606c933762a30ae41f27736da31a36e761a5bc', '0xc9d8a4dfed73c3812cc0043c5e3cada5b9edf0340971a446b0c659fcc93475a9']

    async function deployContract() {
        const TestERC20 = await ethers.getContractFactory('TestERC20')
        const deus = await TestERC20.deploy('DEUS', 'DEUS')

        const ClaimDeusFactory = await ethers.getContractFactory('ClaimDeus')
        const claimDeus = (await upgrades.deployProxy(ClaimDeusFactory, [deus.address, merkleRoot, admin.address])) as ClaimDeus

        await deus.connect(deployer).transfer(depositor.address, await deus.balanceOf(deployer.address))
        await deus.connect(depositor).approve(claimDeus.address, MAX_UINT)
        await claimDeus.connect(admin).grantRole(await claimDeus.DEPOSITOR_ROLE(), depositor.address)

        return [deus, claimDeus]
    }

    before(async () => {
        [deployer, admin, depositor] = await ethers.getSigners()

        await impersonateAccount(userAddress)
        await setBalance(userAddress, MAX_UINT)
        user = await ethers.getSigner(userAddress)
    });

    beforeEach(async () => {
        [deus, claimDeus] = await loadFixture(deployContract)
    });

    it("Should Deposit DEUS", async function () {
        const amount = e(100)

        // only depositor should be able to deposit
        await expect(claimDeus.connect(admin).deposit(amount)).to.be.revertedWith(`AccessControl: account ${admin.address.toLowerCase()} is missing role 0x8f4f2da22e8ac8f11e15f9fc141cddbb5deea8800186560abb6e68c5496619a9`)

        await claimDeus.connect(depositor).deposit(amount)
        expect(await claimDeus.deusBalance()).eq(amount)
    });

    it("Should Claim DEUS", async function () {
        const depositAmount = e(100)
        const remainDeus = depositAmount.sub(claimAmount)

        await claimDeus.connect(depositor).deposit(depositAmount)

        await claimDeus.connect(user).claim(claimAmount, proof)

        expect(await deus.balanceOf(user.address)).eq(claimAmount)
        expect(await claimDeus.claimedDeus(user.address)).eq(claimAmount)

        expect(await deus.balanceOf(claimDeus.address)).eq(remainDeus)
        expect(await claimDeus.deusBalance()).eq(remainDeus)
        expect(await claimDeus.totalClaimedDeus()).eq(claimAmount)
    });

});
