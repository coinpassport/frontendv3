import { Identity } from "@semaphore-protocol/identity";
import { useAccount, useSignMessage, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction } from 'wagmi';

export default function PublishVerification({ accountStatus, contracts, idSeed, setIdSeed }) {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const {
    isError: signError,
    isLoading: signLoading,
    isSuccess: signSuccess,
    signMessage
  } = useSignMessage({
    message: 'Coinpassport V2 Identity Commitment\n\nNever sign this message on any website except Coinpassport.',
    onSuccess: async (signature) => {
      setIdSeed(signature);
      const identity = new Identity(signature);
      write({
        args: [
          accountStatus?.idHash,
          identity.commitment,
          accountStatus?.signature
        ]
      });
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
    functionName: 'publishVerification',
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

  const handleSubmit = (event) => {
    event.preventDefault();
    signMessage();
  }

  if(!account) return;
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Publish Verification</legend>
        {isLoading && <p className="form-status">Waiting for user confirmation...</p>}
        {isError && <p className="form-status error">Transaction error!</p>}
        {isSuccess && (
          txError ? (<p className="form-status error">Transaction error!</p>)
          : txLoading ? (<p className="form-status">Waiting for transaction...</p>)
          : txSuccess ? (<p className="form-status">Success!</p>)
          : (<p className="form-status">Transaction sent...</p>))}
        <div className="field">
          <button disabled={!(accountStatus?.status === 'verified') || signLoading || txLoading || txSuccess}>Sign and Submit</button>
        </div>
      </fieldset>
    </form>
  );
}


