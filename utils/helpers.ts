import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
    ERC20,
    IERC20,
    IWETH9,
} from "../typechain-types";
import {
    getStorageAt,
    setBalance,
    setStorageAt,
} from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber } from "ethers";
import { MAX_UINT } from "./constants";

export type TestTokens = {
    weth: IWETH9;
    usdc: ERC20;
    usdt: ERC20;
    dei: ERC20;
    deus: ERC20;
    wbtc: ERC20;
};

export function e(amount: string | number) {
    return ethers.utils.parseEther(String(amount));
}


export async function getBalances(wallet: string, tokens: ERC20[]) {
    const balances: Record<string, BigNumber> = {};
    for (const token of tokens) {
        balances[await token.symbol()] = await token.balanceOf(wallet);
    }
    return balances;
}


export async function sleep(s: number) {
    console.log("(sleeping for", s, "seconds)");
    return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

function toBytes32(amount: BigNumber) {
    return ethers.utils.hexlify(ethers.utils.zeroPad(amount.toHexString(), 32))
  }

async function findBalanceOfSlot(token: IERC20) {
    const balance = await token.balanceOf(token.address);
    const newBalance = balance.add(1);

    let slot = 0;
    while (true) {
        const index = ethers.utils
            .solidityKeccak256(
                ["uint256", "uint256"],
                [token.address, slot] // key, slot (vyper is reversed)
            )
            .toString();

        const storage = await getStorageAt(token.address, index);

        await setStorageAt(token.address, index, toBytes32(newBalance));

        if ((await token.balanceOf(token.address)).eq(newBalance)) {
            break;
        }

        await setStorageAt(token.address, index, storage);

        slot++;
    }

    return slot;
}

export async function setERC20Balance(
    tokenAddress: string,
    userAddress: string,
    balance: BigNumber
) {
    const token = (await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        tokenAddress
    )) as IERC20;

    // Get storage slot index
    const index = ethers.utils.solidityKeccak256(
        ["uint256", "uint256"],
        [userAddress, await findBalanceOfSlot(token)] // key, slot
    );

    // Manipulate local balance (needs to be bytes32 string)
    await setStorageAt(
        token.address,
        index.toString(),
        toBytes32(balance).toString()
    );
}