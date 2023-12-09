import React, { useState, useEffect } from 'react';
import { useAccount, useContractReads, useNetwork } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import {chainContracts} from '../contracts.js';
import PayFee from '../components/PayFee.js';
import PerformVerification from '../components/PerformVerification.js';

const SERVER_URL = 'https://6ja7ykjh2ek5ojbx2hzhiga6sq0pvrcx.lambda-url.us-west-2.on.aws';
export default function AppPage() {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const contracts = chainContracts(chain);
  const [accountStatus, setAccountStatus] = useState(null);
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

  const chainId = '0x' + contracts.chain.toString(16);
  const fetchAccountStatus = async () => {
    const response = await fetch(`${SERVER_URL}/account-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({ chainId, account })
    });

    const jsonData = await response.json();
    setAccountStatus(jsonData);
    console.log(jsonData);
  };
  useEffect(() => {
    fetchAccountStatus();
  }, [account, chainId]);
  return (<>
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 12,
      }}
    >
      <ConnectButton />
    </div>
    <p>Hello!</p>
    {isLoading && <p>Loading data...</p>}
    {isError && <p>Error loading!</p>}
    {data && data[0].result && <>
      <PayFee
        feePaidBlock={data[1].result}
        feeToken={data[0].result[0]}
        feeAmount={data[0].result[1]}
        {...{contracts}}
      />
      <PerformVerification
        feePaidBlock={data[1].result}
        {...{chainId, account, SERVER_URL, accountStatus}}
      />
    </>}
    <p>Publish verification</p>
    <p>Switch account</p>
    <p>Mint passport nft</p>
  </>);
}
