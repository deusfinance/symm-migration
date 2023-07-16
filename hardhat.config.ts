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
      allowUnlimitedContractSize: true,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    fantom: {
      url: 'https://fantom.publicnode.com',
      accounts: [
        process.env.PRIVATE_KEY!
      ],
      gas: 'auto',
      // gasPrice: 1000100000000, //500.1 Gwei
      gasMultiplier: 1.2,
    },
    arbitrum: {
      url: 'https://arb-mainnet-public.unifra.io',
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    bsc: {
      url: `https://rpc.ankr.com/bsc/${process.env.ANKR_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    metis: {
      url: `https://rpc.ankr.com/metis/${process.env.ANKR_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    polygon: {
      url: `https://rpc.ankr.com/polygon/${process.env.ANKR_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
      timeout: 30000,
      // gas: 'auto'
      gasPrice: 155100000000, // Gwei
    },
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
      {
        version: "0.8.12",
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
      opera: process.env.FTMSCAN_API_KEY!,
      arbitrumOne: process.env.ARBISCAN_API_KEY!,
      metis: 'api-key',
      bsc: process.env.BSCSCAN_API_KEY!,
      polygon: process.env.POLYGONSCAN_API_KEY!,
    },
    customChains: [
      {
        network: "metis",
        chainId: 1088,
        urls: {
          apiURL: "https://andromeda-explorer.metis.io/api",
          browserURL: "https://andromeda-explorer.metis.io",
        },
      }
    ],
  }
};

export default config;
