import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Migrator, TestERC20 } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { e } from "../utils/helpers";
import { MAX_UINT } from "../utils/constants";
import { expect } from "chai";
import { setNextBlockTimestamp } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time";

describe("Migrator", function () {
    let admin: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress;
    let token1: TestERC20, token2: TestERC20;
    let migrator: Migrator;

    async function deployContract() {
        const Factory = await ethers.getContractFactory('Migrator')
        return upgrades.deployProxy(Factory, [admin.address])
    }

    before(async () => {
        [admin, user1, user2, user3] = await ethers.getSigners()
    });

    beforeEach(async () => {
        migrator = (await loadFixture(deployContract)) as Migrator

        const TestERC20 = await ethers.getContractFactory("TestERC20")
        token1 = (await TestERC20.deploy('token 1', 'tkn1')) as TestERC20
        token2 = (await TestERC20.deploy('token 2', 'tkn2')) as TestERC20

        await token1.mint(user1.address, e(2000))
        await token1.mint(user2.address, e(2000))
        await token1.mint(user3.address, e(2000))

        await token2.mint(user1.address, e(2000))
        await token2.mint(user2.address, e(2000))
        await token2.mint(user3.address, e(2000))
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
});
