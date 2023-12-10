import React, { useState } from 'react';
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { useAccount, useSignMessage, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';

const FOUR_WEEKS = 2419200;

export default function MintPassport({ accountStatus, contracts, idSeed, setIdSeed }) {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [ loadingProof, setLoadingProof ] = useState(false);
  const publicClient = usePublicClient({ chainId: contracts.chain });

  const {
    isError: signError,
    isLoading: signLoading,
    isSuccess: signSuccess,
    signMessage
  } = useSignMessage({
    message: 'Coinpassport V2 Identity Commitment\n\nNever sign this message on any website except Coinpassport.',
    onSuccess: async (signature) => {
      setIdSeed(signature);
    },
  });

  const {
    data,
    isLoading,
    isError,
    isSuccess,
    write
  } = useContractWrite({
    ...contracts.VerificationV2,
    functionName: 'sumbitProof',
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
      signMessage();
      return;
    }
    setLoadingProof(true);
    const [groupId, beginningOfTime] = await publicClient.multicall({
      contracts: [
        {
          ...contracts.VerificationV2,
          functionName: 'groupId',
        },
        {
          ...contracts.VerificationV2,
          functionName: 'beginningOfTime',
        },
      ],
    });
    const merkleRoot = await publicClient.readContract({
      ...contracts.Semaphore,
      functionName: 'getMerkleTreeRoot',
      args: [ groupId.result ],
    });
    const idCommitments = await fetchIdCommitments(publicClient, contracts);
    const identity = new Identity(idSeed);
    const group = new Group(Number(groupId.result), 30);
    group.addMembers(idCommitments);

    const expirationRemaining = (accountStatus.expiration - Number(beginningOfTime.result));
    if(expirationRemaining < 0) {
      alert('Passport expired!');
      return;
    }
    const signal = Math.ceil(expirationRemaining / FOUR_WEEKS);
    console.log(idCommitments, groupId, merkleRoot, beginningOfTime, signal, expirationRemaining);

    const fullProof = await generateProof(identity, group, merkleRoot, signal, {
      zkeyFilePath: "/semaphore.zkey",
      wasmFilePath: "/semaphore.wasm",
    });
    console.log(fullProof);
    setLoadingProof(false);
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
          <button disabled={idSeed || signLoading || signSuccess}>Sign Identity Commitment</button>
          <button disabled={!idSeed || loadingProof || txLoading || txSuccess}>Send Transaction</button>
        </div>
      </fieldset>
    </form>
  );
}


async function fetchIdCommitments(publicClient, contracts) {
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
        args: [ out.length + i ],
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
