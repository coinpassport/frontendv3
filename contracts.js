import verificationV2ABI from './abi/VerificationV2.json';
import feeERC20ABI from './abi/FeeERC20.json';
import semaphoreABI from './abi/Semaphore.json';

export const defaultChain = 17000;

export const byChain = {
  17000: {
    chain: 17000,
    name: 'Holesky',
    explorer: 'https://holesky.etherscan.io/',
    nativeCurrency: 'ETH',
    VerificationV2: {
      address: '0x7ad8f110ff586d5f8079cb2253ea057be847e5ce',
      abi: verificationV2ABI,
      chainId: 17000,
    },
    FeeERC20: {
      address: '0x925556a61d27e2e30e9e3a2eb45feedfd2003801',
      abi: feeERC20ABI,
      chainId: 17000,
    },
    Semaphore: {
      address: '0x05d816d46cf7a39600648ca040e94678b8342277',
      abi: semaphoreABI,
      chainId: 17000,
    },
  },
  80001: {
    chain: 80001,
    name: 'Mumbai',
    explorer: 'https://mumbai.polygonscan.com/',
    nativeCurrency: 'MATIC',
    VerificationV2: {
      address: '0xeded09fea28c8a21c69007019f31147df3a4180f',
      abi: verificationV2ABI,
      chainId: 80001,
    },
    FeeERC20: {
      address: '0xd071eaa1e9cc0c2c50ef7c25a2866ce2c4bc4bc3',
      abi: feeERC20ABI,
      chainId: 80001,
    },
    Semaphore: {
      address: '0x3889927F0B5Eb1a02C6E2C20b39a1Bd4EAd76131',
      abi: semaphoreABI,
      chainId: 80001,
    },
  },
};

export function chainContracts(chain) {
  if(chain && (chain.id in byChain || chain in byChain)) return byChain[chain.id || chain];
  return byChain[defaultChain];
}
