import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Migrator, TestERC20 } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { e } from "../utils/helpers";
import { MAX_UINT } from "../utils/constants";
import { expect } from "chai";

describe("Migrator", function () {
    let deployer: SignerWithAddress, admin: SignerWithAddress, withdrawer: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress;
    let token1: TestERC20, token2: TestERC20;
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

        const TestERC20 = await ethers.getContractFactory("TestERC20")
        token1 = (await TestERC20.deploy('token 1', 'tkn1')) as TestERC20
        token2 = (await TestERC20.deploy('token 2', 'tkn2')) as TestERC20

        const tokens = [token1, token2]
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
        await expect(migrator.connect(deployer).withdraw(tokens)).to.be.revertedWith('AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a')

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

});
