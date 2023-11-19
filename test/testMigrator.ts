import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Migrator, TestERC20 } from "../typechain-types";
import { impersonateAccount, loadFixture, setBalance, time } from "@nomicfoundation/hardhat-network-helpers";
import { e } from "../utils/helpers";
import { MAX_UINT } from "../utils/constants";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { smock } from "@defi-wonderland/smock";

describe("Migrator", function () {
    let deployer: SignerWithAddress, admin: SignerWithAddress, withdrawer: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress;
    let token1: TestERC20, token2: TestERC20, bDEI: TestERC20;
    let migrator: Migrator;

    async function deployContract() {
        const Factory = await ethers.getContractFactory('Migrator')
        return upgrades.deployProxy(Factory, [admin.address])
    }

    before(async () => {
        [deployer, admin, withdrawer, user1, user2, user3] = await ethers.getSigners()
    });

    beforeEach(async () => {
        migrator = (await loadFixture(deployContract)) as Migrator

        await migrator.connect(admin).grantRole(await migrator.WITHDRAWER_ROLE(), withdrawer.address)
        await migrator.connect(admin).grantRole(await migrator.SETTER_ROLE(), admin.address)

        const TestERC20 = await ethers.getContractFactory("TestERC20")
        token1 = (await TestERC20.deploy('token 1', 'tkn1')) as TestERC20
        token2 = (await TestERC20.deploy('token 2', 'tkn2')) as TestERC20
        bDEI = (await TestERC20.deploy('bDEI', 'bDEI')) as TestERC20

        await migrator.connect(admin).setBDEIAddress(bDEI.address)

        const tokens = [token1, token2, bDEI]
        const users = [user1, user2, user3]

        for (const token of tokens) {
            for (const user of users) {
                await token.mint(user.address, e(2000))
                await token.connect(user).approve(migrator.address, MAX_UINT)
            }
        }
    });

    it("Deposit tokens", async function () {
        const user1Tokens = [token1.address, token1.address, token2.address, token1.address]
        const user1Amounts = [e(100), e(200), e(300), e(400)]
        const user1MigratorPreferences = [0, 1, 0, 0]

        await token1.connect(user1).approve(migrator.address, MAX_UINT)
        await token2.connect(user1).approve(migrator.address, MAX_UINT)

        let depositTimestamp = await time.latest() + 1
        let depositBlock = await time.latestBlock() + 1
        await time.setNextBlockTimestamp(depositTimestamp);
        await migrator.connect(user1).deposit(
            user1Tokens, user1Amounts, user1MigratorPreferences, user1.address
        )

        let userMigrations = await migrator.getUserMigrations(user1.address)
        for (let i = 0; i < userMigrations.length; i++) {
            expect(userMigrations[i].user).eq(user1.address)
            expect(userMigrations[i].token).eq(user1Tokens[i])
            expect(userMigrations[i].amount).eq(user1Amounts[i])
            expect(userMigrations[i].timestamp).eq(depositTimestamp)
            expect(userMigrations[i].block).eq(depositBlock)
            expect(userMigrations[i].migrationPreference).eq(user1MigratorPreferences[i])
        }

        expect(await migrator.migratedAmount(0, user1.address, token1.address)).eq(e(500))
        expect(await migrator.migratedAmount(0, user1.address, token2.address)).eq(e(300))
        expect(await migrator.migratedAmount(1, user1.address, token1.address)).eq(e(200))

        expect(await migrator.totalEarlyMigratedAmount(0, token1.address)).eq(e(500))
        expect(await migrator.totalEarlyMigratedAmount(0, token2.address)).eq(e(300))
        expect(await migrator.totalEarlyMigratedAmount(1, token1.address)).eq(e(200))


        const user2Tokens = [token1.address, token1.address, token1.address, token2.address]
        const user2Amounts = [e(500), e(600), e(700), e(800)]
        const user2MigratorPreferences = [2, 0, 1, 1]

        await token1.connect(user2).approve(migrator.address, MAX_UINT)
        await token2.connect(user2).approve(migrator.address, MAX_UINT)

        depositTimestamp = await time.latest() + 1
        depositBlock = await time.latestBlock() + 1
        await time.setNextBlockTimestamp(depositTimestamp);
        await migrator.connect(user2).deposit(
            user2Tokens, user2Amounts, user2MigratorPreferences, user2.address
        )

        userMigrations = await migrator.getUserMigrations(user2.address)
        for (let i = 0; i < userMigrations.length; i++) {
            expect(userMigrations[i].user).eq(user2.address)
            expect(userMigrations[i].token).eq(user2Tokens[i])
            expect(userMigrations[i].amount).eq(user2Amounts[i])
            expect(userMigrations[i].timestamp).eq(depositTimestamp)
            expect(userMigrations[i].block).eq(depositBlock)
            expect(userMigrations[i].migrationPreference).eq(user2MigratorPreferences[i])
        }

        expect(await migrator.migratedAmount(0, user2.address, token1.address)).eq(e(600))
        expect(await migrator.migratedAmount(1, user2.address, token1.address)).eq(e(700))
        expect(await migrator.migratedAmount(1, user2.address, token2.address)).eq(e(800))
        expect(await migrator.migratedAmount(2, user2.address, token1.address)).eq(e(500))

        const user3Tokens = [token2.address, token2.address, token2.address, token1.address]
        const user3Amounts = [e(500), e(600), e(700), e(800)]
        const user3MigratorPreferences = [1, 2, 0, 0]

        await token1.connect(user3).approve(migrator.address, MAX_UINT)
        await token2.connect(user3).approve(migrator.address, MAX_UINT)

        await time.increase(31 * 24 * 60 * 60)

        depositTimestamp = await time.latest() + 1
        depositBlock = await time.latestBlock() + 1
        await time.setNextBlockTimestamp(depositTimestamp);
        await migrator.connect(user3).deposit(
            user3Tokens, user3Amounts, user3MigratorPreferences, user3.address
        )

        userMigrations = await migrator.getUserMigrations(user3.address)
        for (let i = 0; i < userMigrations.length; i++) {
            expect(userMigrations[i].user).eq(user3.address)
            expect(userMigrations[i].token).eq(user3Tokens[i])
            expect(userMigrations[i].amount).eq(user3Amounts[i])
            expect(userMigrations[i].timestamp).eq(depositTimestamp)
            expect(userMigrations[i].block).eq(depositBlock)
            expect(userMigrations[i].migrationPreference).eq(user3MigratorPreferences[i])
        }

        expect(await migrator.migratedAmount(1, user3.address, token2.address)).eq(e(500))
        expect(await migrator.migratedAmount(2, user3.address, token2.address)).eq(e(600))
        expect(await migrator.migratedAmount(0, user3.address, token2.address)).eq(e(700))
        expect(await migrator.migratedAmount(0, user3.address, token1.address)).eq(e(800))

        expect(await migrator.totalLateMigratedAmount(0, token1.address)).eq(e(800))
        expect(await migrator.totalLateMigratedAmount(0, token2.address)).eq(e(700))
        expect(await migrator.totalLateMigratedAmount(1, token1.address)).eq(e(0))
        expect(await migrator.totalLateMigratedAmount(1, token2.address)).eq(e(500))
        expect(await migrator.totalLateMigratedAmount(2, token1.address)).eq(e(0))
        expect(await migrator.totalLateMigratedAmount(2, token2.address)).eq(e(600))

        expect(await migrator.totalEarlyMigratedAmount(0, token1.address)).eq(e(1100))
        expect(await migrator.totalEarlyMigratedAmount(0, token2.address)).eq(e(300))
        expect(await migrator.totalEarlyMigratedAmount(1, token1.address)).eq(e(900))
        expect(await migrator.totalEarlyMigratedAmount(1, token2.address)).eq(e(800))
        expect(await migrator.totalEarlyMigratedAmount(2, token1.address)).eq(e(500))
        expect(await migrator.totalEarlyMigratedAmount(2, token2.address)).eq(e(0))
    });

    it("Withdraw tokens", async function () {
        const user1Tokens = [token1.address, token1.address, token2.address, token1.address]
        const user1Amounts = [e(100), e(200), e(300), e(400)]
        const user1MigratorPreferences = [0, 1, 0, 2]

        await token1.connect(user1).approve(migrator.address, MAX_UINT)
        await token2.connect(user1).approve(migrator.address, MAX_UINT)
        await migrator.connect(user1).deposit(user1Tokens, user1Amounts, user1MigratorPreferences, user1.address)

        const tokens = [token1.address, token2.address]

        // Try to withdraw using deployer
        await expect(migrator.connect(deployer).withdraw(tokens)).to.be.revertedWith(`AccessControl: account ${deployer.address.toLowerCase()} is missing role 0x10dac8c06a04bec0b551627dad28bc00d6516b0caacd1c7b345fcdb5211334e4`)

        // Withdraw using admin
        await migrator.connect(withdrawer).withdraw(tokens)

        expect(await token1.balanceOf(withdrawer.address)).eq(e(700))
        expect(await token2.balanceOf(withdrawer.address)).eq(e(300))
    });

    it("Split migration", async function () {
        await migrator.connect(user1).deposit([token1.address], [e(1000)], [0], user1.address)
        const oldMigration = await migrator.migrations(user1.address, 0)

        await migrator.connect(user1).split(0, e(300))

        const newMigration = await migrator.migrations(user1.address, 1)

        for (const field of ['user', 'token', 'timestamp', 'block', 'migrationPreference']) {
            expect(oldMigration[field]).eq(newMigration[field])
        }
        expect(newMigration.amount).eq(e(300))
        expect((await migrator.migrations(user1.address, 0)).amount).eq(e(700))
    })

    it("Transfer migration", async function () {
        await migrator.connect(user1).deposit([token1.address], [e(1000)], [0], user1.address)
        const oldMigration = await migrator.migrations(user1.address, 0)

        await migrator.connect(user1).transfer(0, user2.address)

        const newMigration = await migrator.migrations(user2.address, 0)

        for (const field of ['token', 'amount', 'timestamp', 'block', 'migrationPreference']) {
            expect(oldMigration[field]).eq(newMigration[field])
        }
        expect(newMigration.user).eq(user2.address)
        expect((await migrator.getUserMigrations(user1.address)).length).eq(0)

        expect(await migrator.migratedAmount(0, user1.address, token1.address)).eq(0)
        expect(await migrator.migratedAmount(0, user2.address, token1.address)).eq(e(1000))
    })

    it("Undo migration", async function () {
        let balance = await token1.balanceOf(user1.address)

        await migrator.connect(user1).deposit([token1.address], [e(1000)], [0], user1.address)
        await migrator.connect(user1).split(0, e(400))
        await migrator.connect(user1).undo(1)

        expect(await token1.balanceOf(user1.address)).eq(balance.sub(e(600)))

        expect((await migrator.getUserMigrations(user1.address)).length).eq(1)
        expect(await migrator.migratedAmount(0, user1.address, token1.address)).eq(e(600))
        expect(await migrator.totalEarlyMigratedAmount(0, token1.address)).eq(e(600))
        expect(await migrator.totalLateMigratedAmount(0, token1.address)).eq(0)
    })

    it("Change migration preference", async function () {
        await migrator.connect(user1).deposit([token1.address], [e(1000)], [0], user1.address)
        await migrator.connect(user1).split(0, e(400))

        const oldMigration = await migrator.migrations(user1.address, 1)
        await migrator.connect(user1).changePreference(1, 1)
        const newMigration = await migrator.migrations(user1.address, 1)

        for (const field of ['user', 'token', 'amount', 'timestamp', 'block']) {
            expect(oldMigration[field]).eq(newMigration[field])
        }
        expect(newMigration.migrationPreference).eq(1)

        expect(await migrator.migratedAmount(0, user1.address, token1.address)).eq(e(600))
        expect(await migrator.migratedAmount(1, user1.address, token1.address)).eq(e(400))
        expect(await migrator.totalEarlyMigratedAmount(0, token1.address)).eq(e(600))
        expect(await migrator.totalEarlyMigratedAmount(1, token1.address)).eq(e(400))
        expect(await migrator.totalLateMigratedAmount(0, token1.address)).eq(0)
    })

    it("Wipe migrations", async function () {
        await migrator.connect(user1).deposit(
            [token1.address, token2.address, token1.address, token2.address],
            [e(100), e(200), e(300), e(400)],
            [0, 0, 0, 0],
            user1.address
        )

        await migrator.connect(admin).wipeMigrations([user1.address], [token1.address])
        let migrations = await migrator.getUserMigrations(user1.address)
        expect(migrations.length).eq(2)
        migrations.map(m => expect(m.token).eq(token2.address))
        expect(migrations[0].amount).eq(e(400))
        expect(migrations[1].amount).eq(e(200))

        await migrator.connect(admin).wipeMigrations([user1.address], [token2.address])
        migrations = await migrator.getUserMigrations(user1.address)
        expect(migrations.length).eq(0)

        await migrator.connect(user1).deposit(
            [token1.address, token2.address, token1.address],
            [e(100), e(200), e(300)],
            [0, 0, 0],
            user1.address
        )

        await migrator.connect(admin).wipeMigrations([user1.address], [token1.address])
        migrations = await migrator.getUserMigrations(user1.address)
        expect(migrations.length).eq(1)
        expect(migrations[0].token).eq(token2.address)
        expect(migrations[0].amount).eq(e(200))

        await migrator.connect(user1).deposit(
            [token1.address, token2.address, token1.address, token2.address],
            [e(100), e(200), e(300), e(400)],
            [0, 0, 0, 0],
            user1.address
        )
        await migrator.connect(user2).deposit(
            [token1.address, token2.address, token1.address, token2.address],
            [e(100), e(200), e(300), e(400)],
            [0, 0, 0, 0],
            user2.address
        )
        await migrator.connect(admin).wipeMigrations([user1.address, user2.address], [token1.address, token2.address])
        expect((await migrator.getUserMigrations(user1.address)).length).eq(0)
        expect((await migrator.getUserMigrations(user2.address)).length).eq(0)
    })

    describe("Converts", async () => {
        let user: SignerWithAddress

        const merkleRoot = '0x31bc026b799ced455389115c03ccc75806786b41776e05117335d4c233a34c7f'
        const zeroRoot = '0x0000000000000000000000000000000000000000000000000000000000000000'
        const userAddress = '0xe2b9ddc83df26b81bea63df73117f73831505e86'
        const amount = BigNumber.from('27194724677426387426')
        const halfAmount = amount.div(2)
        const proof = ['0xa76a4729654f5cfc814684f7531a27f4028655266efdad650bedc984b7db48bc', '0x12c5488d7f77da03b8e337d9a26b139a94445367192d399a91999de7c1c3f742', '0x62fc76d398a26231c74440ce41e67b9fc1bcab257b80258af6fc681508616ae9', '0x5cd96eb4cae452eec70c899e2a620d259ad930723807c7b235219707173542d0', '0x887e183fa069569ddaf9d3114552b7b7db3dd23634496d71eb83e227cc91d2b9', '0x0114adf087e8985d752094a9fceaf748faa74e5716500606f47bbfea8c22940f', '0x23a6ed9dc38ca8d0aa64f5a94ed9def466303551dad0a7e5967bf218cfe376a3', '0xebd2e7d92c336ae17907e74da6519abb901f9add621f34eb21de5bf96fc076f8', '0x7c3ebec00d61a11e44c3c492223a80c0abad84be097899dd7358abe451fd2fba', '0x307a27e4da0d159c8deaff5b4552189e778dc3266b60f49ac8722468b27f6dc3', '0x7c6b9dcdd69bd18c4fde82ea4bc39e338dd095e14e19479adf4ccfa9aad6543c', '0xce966c60f846c5d6989c0a5dbe606c933762a30ae41f27736da31a36e761a5bc', '0xc9d8a4dfed73c3812cc0043c5e3cada5b9edf0340971a446b0c659fcc93475a9']

        beforeEach(async () => {
            await impersonateAccount(userAddress)
            await setBalance(userAddress, MAX_UINT)
            user = await ethers.getSigner(userAddress)

            await bDEI.connect(user).approve(migrator.address, MAX_UINT)
        })

        it("bDEI", async () => {
            await migrator.connect(admin).setMerkleRoots(zeroRoot, merkleRoot)
            const deus = await smock.fake('ERC20', {address: await migrator.DEUS()}) 
            deus.transfer.whenCalledWith(user.address, halfAmount.div(185)).returns(true)

            await bDEI.mint(user.address, amount)

            await migrator.connect(user).convertBDEI(halfAmount, amount, proof)
            expect(await migrator.convertedAmount(user.address, bDEI.address)).eq(halfAmount)

            await migrator.connect(user).convertBDEI(halfAmount, amount, proof)
            expect(await migrator.convertedAmount(user.address, bDEI.address)).eq(amount)

            await expect(migrator.connect(user).convertBDEI(1, amount, proof)).to.be.revertedWith("Amount Too High")
        })

        it("legacyDEI", async () => {
            await migrator.connect(admin).setMerkleRoots(merkleRoot, zeroRoot)
            const deus = await smock.fake('ERC20', {address: await migrator.DEUS()}) 
            const legacyDEI = await smock.fake('ERC20', {address: '0xDE12c7959E1a72bbe8a5f7A1dc8f8EeF9Ab011B3'}) 

            legacyDEI.transferFrom.whenCalledWith(user.address, migrator.address, halfAmount).returns(true)
            deus.transfer.whenCalledWith(user.address, halfAmount.div(217)).returns(true)

            await migrator.connect(user).convertLegacyDEI(halfAmount, amount, proof)
            expect(await migrator.convertedAmount(user.address, legacyDEI.address)).eq(halfAmount)

            await migrator.connect(user).convertLegacyDEI(halfAmount, amount, proof)
            expect(await migrator.convertedAmount(user.address, legacyDEI.address)).eq(amount)

            await expect(migrator.connect(user).convertLegacyDEI(1, amount, proof)).to.be.revertedWith("Amount Too High")
        })

        it("xDEUS", async () => {
            await migrator.connect(admin).setMerkleRoots(merkleRoot, zeroRoot)
            const deus = await smock.fake('ERC20', {address: await migrator.DEUS()}) 
            const xDEUS = await smock.fake('ERC20', {address: '0x953Cd009a490176FcEB3a26b9753e6F01645ff28'}) 

            xDEUS.transferFrom.whenCalledWith(user.address, migrator.address, halfAmount).returns(true)
            deus.transfer.whenCalledWith(user.address, halfAmount).returns(true)

            await migrator.connect(user).convertXDEUS(halfAmount)
            expect(await migrator.convertedAmount(user.address, xDEUS.address)).eq(halfAmount)

            await migrator.connect(user).convertXDEUS(halfAmount)
            expect(await migrator.convertedAmount(user.address, xDEUS.address)).eq(amount)
        })
    })
});
