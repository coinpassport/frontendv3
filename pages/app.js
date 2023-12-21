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
import {Remaining} from '../components/Remaining.js';
import Footer from '../components/Footer.js';

const SERVER_URL = 'https://6ja7ykjh2ek5ojbx2hzhiga6sq0pvrcx.lambda-url.us-west-2.on.aws';
export default function AppPage() {
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const contracts = chainContracts(chain);
  const publicClient = usePublicClient({ chainId: contracts.chain });
  const [accountStatus, setAccountStatus] = useState(null);
  const [idSeed, setIdSeed] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [acctInGroup, setAcctInGroup] = useState(null);
  const [expiration, setExpiration] = useState(null);
  const [nextGroupStart, setNextGroupStart] = useState(null);
  const { data, isError, isLoading } = useContractReads({
    contracts: [
      { // 0
        // TODO support more than one feeChoice
        ...contracts.FeeERC20,
        functionName: 'feeChoices',
        args: [ 0 ],
      },
      { // 1
        ...contracts.VerificationV2,
        functionName: 'feePaidBlock',
        args: [ account ],
      },
      { // 2
        ...contracts.VerificationV2,
        functionName: 'accountToIdHash',
        args: [ account ],
      },
      { // 3
        ...contracts.VerificationV2,
        functionName: 'groupId',
      },
      { // 4
        ...contracts.VerificationV2,
        functionName: 'addressActive',
        args: [ account ],
      },
      { // 5
        ...contracts.VerificationV2,
        functionName: 'groupIndex',
      },
      { // 6
        ...contracts.VerificationV2,
        functionName: 'groupCount',
      },
      { // 7
        ...contracts.VerificationV2,
        functionName: 'identityCommitmentCount',
      },
    ],
    watch: true,
    async onSuccess(data) {
      setGroupId(data[3].result);
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

      if(data[5].result + 1n < data[6].result) {
        const nextGroup = await publicClient.readContract({
          ...contracts.VerificationV2,
          functionName: 'groups',
          args: [ data[5].result + 1n ],
        });
        setNextGroupStart(nextGroup[2]);
      } else {
        setNextGroupStart(null);
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
    setIdSeed(null);
  }, [groupId]);
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
      {account && data[4].result && <p className="complete">Connected wallet account is an active passport NFT holder!</p>}
      {expiration && <p className="complete">Connected wallet is linked to a passport that expires on {(new Date(Number(expiration) * 1000)).toLocaleDateString()}<ToolTip message="Date fuzzed from actual date on document to enhance privacy" id="date-fuzzed" /></p>}
      {nextGroupStart && <p className="form-status">
        Next group starts in <Remaining value={nextGroupStart} onlyFirst={true} />
        <ToolTip message={(new Date(Number(nextGroupStart) * 1000)).toLocaleString()} id="next-group-time" />
      </p>}
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
        {...{contracts, accountStatus, idSeed, setIdSeed, idHashPublished, acctInGroup}}
      />
      <MintPassport
        identityCommitmentCount={data[7].result}
        {...{contracts, accountStatus, idSeed, setIdSeed, acctInGroup}}
      />
    </>}
    </div>
    <Footer />
    </div>
  </>);
}
