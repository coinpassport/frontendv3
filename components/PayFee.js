import { useAccount, useContractReads, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, erc20ABI } from 'wagmi';

import {chainContracts} from '../contracts.js';
import {TokenDetails} from './TokenDetails.js';

export default function PayFee() {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const contracts = chainContracts(chain);
  const { data, isError, isLoading } = useContractReads({
    contracts: [
      {
        // TODO support more than one feeChoice
        ...contracts.FeeERC20,
        functionName: 'feeChoices',
        args: [ 0 ],
      },
      {
        ...contracts.VerificationV2,
        functionName: 'feePaidBlock',
        args: [ account ],
      },
    ],
    watch: true,
  });
  return (<>
    {isLoading && <p>Loading fee data...</p>}
    {isError && <p>Error loading fee data!</p>}
    {data && data[0].result &&
      <TokenVendor
        feePaidBlock={data[1].result}
        feeToken={data[0].result[0]}
        feeAmount={data[0].result[1]}
        {...{contracts}}
      />
    }
  </>);
}


function TokenVendor({ feePaidBlock, feeToken, feeAmount, contracts }) {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const {
    data: approvalData,
    isError: approvalReadError,
    isLoading: approvalReadLoading
  } = useContractReads({
    contracts: [
      {
        chainId: contracts.chain,
        address: feeToken,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [ account ],
      },
      {
        chainId: contracts.chain,
        address: feeToken,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [ account, contracts.FeeERC20.address ],
      },
    ],
    watch: true,
  });
  const needsApproval = approvalData && (approvalData[1].result < feeAmount);
  const insufficientBalance = approvalData && (approvalData[0].result < feeAmount);

  const {
    data: approveData,
    isLoading: approveLoading,
    isError: approveError,
    isSuccess: approveSuccess,
    write: approveWrite
  } = useContractWrite({
    chainId: contracts.chain,
    address: feeToken,
    abi: erc20ABI,
    functionName: 'approve',
  });
  const {
    isError: approveTxError,
    isLoading: approveTxLoading,
    isSuccess: approveTxSuccess
  } = useWaitForTransaction({
    hash: approveData ? approveData.hash : null,
  });

  const {
    data: payData,
    isLoading: payLoading,
    isError: payError,
    isSuccess: paySuccess,
    write: payWrite
  } = useContractWrite({
    ...contracts.FeeERC20,
    functionName: 'mintAndPayFee',
    args: [0],
  });
  const {
    isError: payTxError,
    isLoading: payTxLoading,
    isSuccess: payTxSuccess
  } = useWaitForTransaction({
    hash: payData ? payData.hash : null,
  });

  const shouldSwitchChain = chain && Number(contracts.chain) !== chain.id;
  if(shouldSwitchChain) return (
    <button onClick={() => switchNetwork(Number(contracts.chain))} type="button">Switch to {contracts.name}</button>
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if(needsApproval) {
      approveWrite({
        args: [ contracts.FeeERC20.address, feeAmount ],
      });
    } else {
      payWrite();
    }
  }
  if(!account) return;
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>
          Pay Fee:
          <TokenDetails amount={feeAmount} symbol={true} address={feeToken} {...{contracts}} />
        </legend>
        {feePaidBlock > 0 ? <span className="complete">Fee Already Paid!</span> : <>
          {insufficientBalance && <span className="error">Insufficient Balance!</span>}
          {approveLoading && <p className="form-status">Waiting for user confirmation...</p>}
          {approveSuccess && (
            approveTxError ? (<p className="form-status error">Approval transaction error!</p>)
            : approveTxLoading ? (<p className="form-status">Waiting for approval transaction...</p>)
            : approveTxSuccess ? (<p className="form-status">Approval success!</p>)
            : (<p className="form-status">Approval transaction sent...</p>))}
          {approveTxError && <p className="form-status error">Error!</p>}
          {payLoading && <p className="form-status">Waiting for user confirmation...</p>}
          {paySuccess && (
            payTxError ? (<p className="form-status error">Transaction error!</p>)
            : payTxLoading ? (<p className="form-status">Waiting for transaction...</p>)
            : payTxSuccess ? (<p className="form-status">Fee Paid Successfully!</p>)
            : (<p className="form-status">Transaction sent...</p>))}
          {payTxError && <p className="form-status error">Error!</p>}
          {!payTxSuccess &&
            <div className="field">
              <button disabled={!needsApproval || approveLoading || approveTxLoading}>Approve</button>
              <button disabled={needsApproval || payLoading || payTxLoading}>Pay Fee</button>
            </div>
          }
        </>}
      </fieldset>
    </form>
  );
}

