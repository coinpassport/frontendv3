import React, { useState } from 'react';
import { useSignMessage, useAccount } from 'wagmi';

import { generateNonce } from '../utils.js';

export default function PerformVerification({ accountStatus, feePaidBlock, chainId, SERVER_URL }) {
  const { address: account } = useAccount();
  const [nonce, setNonce] = useState(generateNonce);
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message: 'Paid Fee on Block #' + feePaidBlock?.toString() + '\n\n' + nonce,
    onSuccess: async (signature) => {
      const response = await fetch(`${SERVER_URL}/verify`, {
        method: 'POST',
        body: JSON.stringify({ chainId, account, signature, nonce }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
      });
      const data = await response.json();
      if(data.error) {
        alert('Error: ' + data.error);
        return;
      }
      document.location = data.redirect;
    },
  });
  return (<>
    <form onSubmit={(e) => { e.preventDefault(); signMessage?.()}}>
      <fieldset>
        <legend>
          Perform Verification
        </legend>
        {accountStatus?.status === 'requires_input' && (
          <div className="active">
            <span className="msg">Further Input Required</span>
            <span className="subtext">Possible reasons:</span>
            <ul>
              <li>Verification canceled before completion</li>
              <li>Submitted verification images did not validate</li>
            </ul>
            <span className="subtext">Please try again.</span>
          </div>)}
        <div className="field">
          <button disabled={!account || (accountStatus?.status === 'verified' && accountStatus.feePaidBlock === Number(feePaidBlock)) || feePaidBlock === 0n || isLoading || isSuccess}>Perform Verification</button>
        </div>
      </fieldset>
    </form>
  </>);
}
