import { useAccount, useContractReads, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, erc20ABI } from 'wagmi';

import {TokenDetails} from './TokenDetails.js';
import ToolTip from './ToolTip.js';

export default function PayFee({ feePaidBlock, feeToken, feeAmount, contracts }) {
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
      {
        ...contracts.FeeERC20,
        functionName: 'balanceOf',
        args: [ account ],
      },
    ],
    watch: true,
  });
  const needsApproval = approvalData && (approvalData[1].result < feeAmount);
  const insufficientBalance = approvalData && (approvalData[0].result < feeAmount);
  const hasNativeToken = approvalData && (approvalData[2].result > 0);

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

  const payNative = (event) => {
    event.preventDefault();
    payWrite({
      ...contracts.VerificationV2,
      functionName: 'payFee',
      args: [],
    });
  }

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
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>
          Pay Fee:&nbsp;
          <TokenDetails amount={feeAmount} symbol={true} address={feeToken} {...{contracts}} />
          {hasNativeToken && <>
            &nbsp;or native fee token
            <ToolTip message="Your account holds a native fee token that may be redeemed for a verification." id="native-token" />
          </>}
        </legend>
        {feePaidBlock > 0 && <span className="complete">Fee Paid!</span>}
        {insufficientBalance && feePaidBlock < 1 && <span className="error">Insufficient Balance!</span>}
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
          : payTxSuccess ? (<></>)
          : (<p className="form-status">Transaction sent...</p>))}
        {payTxError && <p className="form-status error">Error!</p>}
        <div className="field">
          <button disabled={!account || !needsApproval || approveLoading || approveTxLoading}>Approve</button>
          <button disabled={!account || payTxSuccess || needsApproval || payLoading || payTxLoading}>Pay Fee</button>
          {hasNativeToken && <button disabled={!account || payTxSuccess || !hasNativeToken || payLoading || payTxLoading} type="button" onClick={payNative}>Redeem Native</button>}
        </div>
      </fieldset>
    </form>
  );
}

