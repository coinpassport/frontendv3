import React, { useState } from 'react';
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { useAccount, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, useWalletClient, usePublicClient } from 'wagmi';

import {idSignature} from '../utils.js';

export default function MintPassport({ accountStatus, contracts, idSeed, setIdSeed }) {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [ loadingProof, setLoadingProof ] = useState(false);
  const walletClient = useWalletClient({ chainId: contracts.chain });
  const publicClient = usePublicClient({ chainId: contracts.chain });

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
      setIdSeed(signature);
      return;
    }
    setLoadingProof(true);
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
    const merkleRoot = await publicClient.readContract({
      ...contracts.Semaphore,
      functionName: 'getMerkleTreeRoot',
      args: [ groupId.result ],
    });
    const idCommitments = await fetchIdCommitments(groupId.result, publicClient, contracts);
    const identity = new Identity(idSeed);
    const group = new Group(Number(groupId.result), Number(groupDepth.result));
    group.addMembers(idCommitments);

    const signal = 1;
    const fullProof = await generateProof(identity, group, merkleRoot, signal, {
      zkeyFilePath: `/semaphore${groupDepth.result}.zkey`,
      wasmFilePath: `/semaphore${groupDepth.result}.wasm`,
    });
    setLoadingProof(false);
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

  if(!account) return;
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Mint Passport NFT</legend>
        {loadingProof && <p className="form-status">Loading ZK proof...</p>}
        {isLoading && <p className="form-status">Waiting for user confirmation...</p>}
        {isError && <p className="form-status error">Transaction error!</p>}
        {isSuccess && (
          txError ? (<p className="form-status error">Transaction error!</p>)
          : txLoading ? (<p className="form-status">Waiting for transaction...</p>)
          : txSuccess ? (<p className="form-status">Success!</p>)
          : (<p className="form-status">Transaction sent...</p>))}
        <div className="field">
          <button disabled={idSeed}>Sign Identity Commitment</button>
          <button disabled={!idSeed || loadingProof || txLoading || txSuccess}>Send Transaction</button>
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
