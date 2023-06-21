import "@nomicfoundation/hardhat-toolbox";
import '@nomicfoundation/hardhat-chai-matchers';
import "hardhat-preprocessor";
import "hardhat-abi-exporter";
import 'hardhat-contract-sizer';
import '@openzeppelin/hardhat-upgrades';

import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      // forking: {
      //   url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      //   blockNumber: 16051852
      // }
    },
    local: {
      initialBaseFeePerGas: 0,
      url: 'http://127.0.0.1:8546',
      timeout: 36000,
      allowUnlimitedContractSize: true
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 800,
          },
          metadata: {
            bytecodeHash: "none",
          },
          viaIR: true,
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY!
    }
  }
};

export default config;
