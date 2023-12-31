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
      url: 'http://127.0.0.1:8547',
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
    ethereum: {
      url: `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
      timeout: 30000,
      // gas: 'auto'
      gasPrice: 16100000000, // Gwei
    },
    avalanche: {
      url: `https://rpc.ankr.com/avalanche/${process.env.ANKR_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
      timeout: 30000,
      gas: 'auto'
      // gasPrice: 16100000000, // Gwei
    },
    kava  : {
      url: `https://evm2.kava.io`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
      timeout: 30000,
      gas: 'auto'
      // gasPrice: 16100000000, // Gwei
    },
    base: {
      url: `https://base.meowrpc.com`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
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
      mainnet: process.env.ETHERESCAN_API_KEY!,
      opera: process.env.FTMSCAN_API_KEY!,
      arbitrumOne: process.env.ARBISCAN_API_KEY!,
      metis: 'api-key',
      bsc: process.env.BSCSCAN_API_KEY!,
      polygon: process.env.POLYGONSCAN_API_KEY!,
      avalanche: process.env.SNOWTRACE_API_KEY!,
      kava: 'api-key',
      base: 'api-key'

    },
    customChains: [
      {
        network: "metis",
        chainId: 1088,
        urls: {
          apiURL: "https://andromeda-explorer.metis.io/api",
          browserURL: "https://andromeda-explorer.metis.io",
        },
      },
      {
        network: "kava",
        chainId: 2222,
        urls: {
          apiURL: "https://explorer.kava.io/api",
          browserURL: "https://explorer.kava.io/",
        },
      },
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: `https://api.basescan.org/api?apiKey=${process.env.BASESCAN_API_KEY!}`,
          browserURL: "https://basescan.org"
        }
      }
    ],
  },
  paths: {
    node_modules: "./node_modules/@openzeppelin/contracts", // Add this path to include OpenZeppelin contracts
  }
};

export default config;
