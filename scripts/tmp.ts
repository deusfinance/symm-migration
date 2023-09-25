import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, network } from "hardhat";
import { MAX_UINT } from "../utils/constants";
import { e } from "../utils/helpers";

const QUOTER = '0xAA2f0eb52db02650959463F9801442f5dF7D5CBe'
const NPM = '0xAA277CB7914b7e5514946Da92cb9De332Ce610EF' // NonfungiblePositionManager
const ROUTER = '0xAA23611badAFB62D37E7295A682D21960ac85A90'
const USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' // token0
const DEUS = '0xDE5ed76E7c05eC5e4572CfC88d1ACEA165109E44' // token1

const signerAddress = '0x9acE991de0bD8F2E32a357024df85B40283319f2'

let tx

function priceToTick(price: number, tickSpacing: number) {
    return Math.floor(Math.log(price) / Math.log(1.0001));
}

async function main() {
    if (network.name != 'hardhat') {
        throw "tmp.ts only runs in hardhat network"
    }

    const deadline = Math.floor(Date.now() / 1000) + 60 * 15

    // await impersonateAccount(signerAddress)
    // const signer = await ethers.getSigner(signerAddress)
    const [signer] = await ethers.getSigners()


    const npm = await ethers.getContractAt('INonfungiblePositionManager', NPM, signer)
    const quoter = await ethers.getContractAt('IQuoter', QUOTER, signer)
    const router = await ethers.getContractAt('ISwapRouter', ROUTER, signer)
    const usdc = await ethers.getContractAt('IERC20', USDC, signer)
    const deus = await ethers.getContractAt('IERC20', DEUS, signer)

    // await (await usdc.approve(npm.address, MAX_UINT)).wait()
    // await (await deus.approve(npm.address, MAX_UINT)).wait()

    const tickLower = priceToTick(20, 60)
    const tickUpper = priceToTick(40, 60)

    console.log(tickLower, tickUpper)
    return

    const params = {
        token0: usdc.address,
        token1: deus.address,
        fee: 3000,
        tickLower: tickLower,
        tickUpper: tickUpper,
        amount0Desired: 3e6,
        amount1Desired: e(0.1),
        amount0Min: 0,
        amount1Min: 0,
        recipient: signer.address,
        deadline: deadline
    }

    console.table(params)

    tx = await npm.mint(params)
    await tx.wait()

    // await (await usdc.approve(router.address, MAX_UINT)).wait()
    // console.log((await deus.balanceOf(signer.address)).div(e(1)))
    // const minAmountOut = await quoter.callStatic.quoteExactInputSingle(
    //     usdc.address,
    //     deus.address,
    //     3000,
    //     30,
    //     0
    // )
    // let tx = await router.exactInputSingle({
    //     tokenIn: usdc.address,
    //     tokenOut: deus.address,
    //     fee: 3000,
    //     recipient: signer.address,
    //     deadline: deadline,
    //     amountIn: 30e6,
    //     amountOutMinimum: minAmountOut,
    //     sqrtPriceLimitX96: 0,
    // })
    // await tx.wait()
    // console.log((await deus.balanceOf(signer.address)).div(e(0.01)))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });