import verificationV2ABI from './abi/VerificationV2.json';
import feeERC20ABI from './abi/FeeERC20.json';

export const defaultChain = 17000;

export const byChain = {
  17000: {
    chain: 17000,
    name: 'Holesky',
    explorer: 'https://holesky.etherscan.io/',
    nativeCurrency: 'ETH',
    VerificationV2: {
      address: '0x91f378af9a1baf49ed02bd20977031e3ffc3a38d',
      abi: verificationV2ABI,
      chainId: 17000,
    },
    FeeERC20: {
      address: '0x925556a61d27e2e30e9e3a2eb45feedfd2003801',
      abi: feeERC20ABI,
      chainId: 17000,
    },
  },
};

export function chainContracts(chain) {
  if(chain && (chain.id in byChain || chain in byChain)) return byChain[chain.id || chain];
  return byChain[defaultChain];
}
