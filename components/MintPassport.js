import React, { useState } from 'react';
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { useAccount, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, useWalletClient, usePublicClient } from 'wagmi';
import { isAddressEqual } from 'viem';

import ToolTip from '../components/ToolTip.js';
import {idSignature} from '../utils.js';

export default function MintPassport({
  accountStatus,
  contracts,
  idSeed,
  setIdSeed,
  acctInGroup
}) {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [ loadingProof, setLoadingProof ] = useState(false);
  const [ errorMsg, setErrorMsg ] = useState(null);
  const walletClient = useWalletClient({ chainId: contracts.chain });
  const publicClient = usePublicClient({ chainId: contracts.chain });

  const isInGroup = acctInGroup && idSeed && isAddressEqual(acctInGroup, idSeed.account);
  const shouldSwitchAccount = isInGroup && account && isAddressEqual(idSeed.account, account);

  const {
    data,
    isLoading,
    isError,
    isSuccess,
    write
  } = useContractWrite({
    ...contracts.VerificationV2,
    functionName: 'submitProof',
  });
  const {
    isError: txError,
    isLoading: txLoading,
    isSuccess: txSuccess
  } = useWaitForTransaction({
    hash: data ? data.hash : null,
  });

  const shouldSwitchChain = chain && Number(contracts.chain) !== chain.id;
  if(shouldSwitchChain) return (
    <button onClick={() => switchNetwork(Number(contracts.chain))} type="button">Switch to {contracts.name}</button>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if(!idSeed) {
      const signature = await idSignature(walletClient.data, publicClient, contracts);
      setIdSeed({account, signature});
      return;
    }
    setErrorMsg(null);
    setLoadingProof(true);
    const signal = 1;
    let merkleRoot, fullProof, hadError;
    try {
      const [groupId, groupDepth] = await publicClient.multicall({
        contracts: [
          {
            ...contracts.VerificationV2,
            functionName: 'groupId',
          },
          {
            ...contracts.VerificationV2,
            functionName: 'groupDepth',
          },
        ],
      });
      merkleRoot = await publicClient.readContract({
        ...contracts.Semaphore,
        functionName: 'getMerkleTreeRoot',
        args: [ groupId.result ],
      });
      const idCommitments = await fetchIdCommitments(groupId.result, publicClient, contracts);
      const identity = new Identity(idSeed.signature);
      const group = new Group(Number(groupId.result), Number(groupDepth.result));
      group.addMembers(idCommitments);

      fullProof = await generateProof(identity, group, merkleRoot, signal, {
        zkeyFilePath: `/semaphore${groupDepth.result}.zkey`,
        wasmFilePath: `/semaphore${groupDepth.result}.wasm`,
      });
    } catch(error) {
      console.error(error);
      setErrorMsg(error.message);
      hadError = true;
    } finally {
      setLoadingProof(false);
      if(hadError) return;
    }
    write({
      args: [
        BigInt(merkleRoot),
        BigInt(signal),
        BigInt(fullProof.nullifierHash),
        BigInt(fullProof.externalNullifier),
        fullProof.proof.map(x => BigInt(x)),
      ],
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Mint Passport NFT</legend>
        {loadingProof && <p className="form-status">Loading ZK proof...</p>}
        {errorMsg && <p className="form-status error">{errorMsg}</p>}
        {isLoading && <p className="form-status">Waiting for user confirmation...</p>}
        {isError && <p className="form-status error">Transaction error!<ToolTip message="Remember: cannot join the same group twice" id="no-dupes" /></p>}
        {isSuccess && (
          txError ? (<p className="form-status error">Transaction error!</p>)
          : txLoading ? (<p className="form-status">Waiting for transaction...</p>)
          : txSuccess ? (<p className="form-status">Success!</p>)
          : (<p className="form-status">Transaction sent...</p>))}
        {shouldSwitchAccount && <p className="help">Switch accounts in your wallet before minting the NFT to achieve anonymity.</p>}
        <div className="field">
          <button disabled={!account || !acctInGroup || idSeed}>Sign Identity Commitment</button>
          <button disabled={!account || !idSeed || loadingProof || isLoading || txLoading || txSuccess}>Mint NFT</button>
        </div>
      </fieldset>
    </form>
  );
}


async function fetchIdCommitments(groupId, publicClient, contracts) {
  const count = Number(await publicClient.readContract({
    ...contracts.VerificationV2,
    functionName: 'identityCommitmentCount',
  }));
  const perCall = 300;
  const out = [];
  while(out.length < count) {
    const loadCount = out.length + perCall > count ? count - out.length : perCall;
    const toLoad = [];
    for(let i = 0; i<loadCount; i++) {
      toLoad.push({
        ...contracts.VerificationV2,
        functionName: 'identityCommitments',
        args: [ groupId, out.length + i ],
      });
    }
    const batch = await publicClient.multicall({
      contracts: toLoad,
    });
    for(let i = 0; i<batch.length; i++) {
      out.push(batch[i].result);
    }
  }
  return out;

}
