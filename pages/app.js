import React, { useState, useEffect } from 'react';
import { useAccount, useContractReads, useNetwork, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Head from 'next/head';
import Link from 'next/link';

import {chainContracts} from '../contracts.js';
import PayFee from '../components/PayFee.js';
import PerformVerification from '../components/PerformVerification.js';
import PublishVerification from '../components/PublishVerification.js';
import MintPassport from '../components/MintPassport.js';
import ToolTip from '../components/ToolTip.js';

const SERVER_URL = 'https://6ja7ykjh2ek5ojbx2hzhiga6sq0pvrcx.lambda-url.us-west-2.on.aws';
export default function AppPage() {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const contracts = chainContracts(chain);
  const publicClient = usePublicClient({ chainId: contracts.chain });
  const [accountStatus, setAccountStatus] = useState(null);
  // TODO reset idSeed if groupId changes
  // TODO countdown until next group change
  // TODO support joining subsequent groups
  const [idSeed, setIdSeed] = useState(null);
  const [acctInGroup, setAcctInGroup] = useState(null);
  const [expiration, setExpiration] = useState(null);
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
      {
        ...contracts.VerificationV2,
        functionName: 'accountToIdHash',
        args: [ account ],
      },
      {
        ...contracts.VerificationV2,
        functionName: 'groupId',
      },
      {
        ...contracts.VerificationV2,
        functionName: 'addressActive',
        args: [ account ],
      },
    ],
    watch: true,
    async onSuccess(data) {
      const idHashPublished = data[2].result && BigInt(data[2].result) > 0;
      if(idHashPublished) {
        const [expiration, inGroup] = await publicClient.multicall({
          contracts: [
            {
              ...contracts.VerificationV2,
              functionName: 'idHashExpiration',
              args: [ data[2].result ],
            },
            {
              ...contracts.VerificationV2,
              functionName: 'idHashInGroup',
              args: [ data[2].result, data[3].result ],
            },
          ],
        });
        setAcctInGroup(inGroup.result ? account : null);
        setExpiration(expiration.result || null);
      }
    },
  });

  const idHashPublished = data && data[2].result && BigInt(data[2].result) > 0;
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
  };
  useEffect(() => {
    fetchAccountStatus();
    setAcctInGroup(null);
    setExpiration(null);
  }, [account, chainId]);
  return (<>
    <Head>
      <title>Coinpassport</title>
    </Head>
    <div id="body-bg">
        <header>
          <nav>
            <Link href="/"><h1>CoinPassport</h1></Link>
          </nav>
          <ConnectButton />
        </header>
        <div className="wizard">
        {!account && <div className="wizard-connect"><p className="welcome">Connect your wallet to begin.</p><ConnectButton /></div>}
    {isLoading && <p className="form-status loading">Loading data...</p>}
    {isError && <p className="error">Error loading!</p>}
    {data && !data[0].result && <p className="error">Error! Please refresh the page.</p>}
    {data && data[0].result && <>
      {data[4].result && <p className="complete">Connected wallet account is an active passport NFT holder!</p>}
      {expiration && <p className="complete">Connected wallet is linked to a passport that expires on {(new Date(Number(expiration) * 1000)).toLocaleDateString()}<ToolTip message="Date fuzzed from actual date on document to enhance privacy" id="date-fuzzed" /></p>}
      <PayFee
        feePaidBlock={data[1].result}
        feeToken={data[0].result[0]}
        feeAmount={data[0].result[1]}
        {...{contracts}}
      />
      <PerformVerification
        feePaidBlock={data[1].result}
        {...{chainId, SERVER_URL, accountStatus}}
      />
      <PublishVerification
        {...{contracts, accountStatus, idSeed, setIdSeed, idHashPublished}}
      />
      <MintPassport
        {...{contracts, accountStatus, idSeed, setIdSeed, acctInGroup}}
      />
    </>}
    </div>
    <footer>
      <menu>
        <li>&copy; 2023</li>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/docs">Docs</Link></li>
        <li><Link href="/privacy-policy">Privacy</Link></li>
      </menu>
    </footer>
    </div>
  </>);
}
