import verificationV2ABI from './abi/VerificationV2.json';
import feeERC20ABI from './abi/FeeERC20.json';
import semaphoreABI from './abi/Semaphore.json';
import Groth16VerifierABI from './abi/Groth16VerifierABI.json';

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
    expVerifier: {
      address: '0x8abd8d9fab3f711b16d15ce48747db49672eedb2',
      abi: Groth16VerifierABI,
      chainId: 17000,
    },
  },
};

export function chainContracts(chain) {
  if(chain && (chain.id in byChain || chain in byChain)) return byChain[chain.id || chain];
  return byChain[defaultChain];
}
