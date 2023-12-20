import { Identity } from "@semaphore-protocol/identity";
import { useAccount, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, useWalletClient, usePublicClient } from 'wagmi';

import {idSignature} from '../utils.js';

export default function PublishVerification({
  accountStatus,
  contracts,
  idSeed,
  setIdSeed,
  idHashPublished,
  acctInGroup
}) {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
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
    const signature = await idSignature(walletClient.data, publicClient, contracts);
    setIdSeed({account, signature});
    const identity = new Identity(signature);
    write({
      functionName: !idHashPublished ? 'publishVerification' : 'joinNewGroup',
      args: !idHashPublished ? [
        accountStatus?.expiration,
        accountStatus?.idHash,
        identity.commitment,
        accountStatus?.signature
      ] : [
        identity.commitment,
      ],
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Publish Verification</legend>
        {isLoading && <p className="form-status">Waiting for user confirmation...</p>}
        {isError && <p className="form-status error">Transaction error!</p>}
        {isSuccess && (
          txError ? (<p className="form-status error">Transaction error!</p>)
          : txLoading ? (<p className="form-status">Waiting for transaction...</p>)
          : txSuccess ? (<p className="complete">Published Successfully!</p>)
          : (<p className="form-status">Transaction sent...</p>))}
        <div className="field">
          <button disabled={!account || !(accountStatus?.status === 'verified') || idHashPublished || txLoading || txSuccess}>Sign and Submit</button>
          <button disabled={!account || !(accountStatus?.status === 'verified') || !idHashPublished || acctInGroup || txLoading || txSuccess}>Join Current Group</button>
        </div>
      </fieldset>
    </form>
  );
}


