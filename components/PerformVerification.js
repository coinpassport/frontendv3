import React, { useState } from 'react';
import { useSignMessage, useAccount } from 'wagmi';

import { generateNonce } from '../utils.js';

export default function PerformVerification({ accountStatus, feePaidBlock, chainId, SERVER_URL }) {
  const { address: account } = useAccount();
  const [nonce, setNonce] = useState(generateNonce);
  const [ errorMsg, setErrorMsg ] = useState(null);
  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message: 'Paid Fee on Block #' + feePaidBlock?.toString() + '\n\n' + nonce,
    onSuccess: async (signature) => {
      setErrorMsg(null);
      const response = await fetch(`${SERVER_URL}/verify`, {
        method: 'POST',
        body: JSON.stringify({ chainId, account, signature, nonce }),
        headers: { "Content-type": "application/json; charset=UTF-8" }
      });
      const data = await response.json();
      if(data.error) {
        setErrorMsg('Error: ' + data.error);
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
        {errorMsg && <p className="form-status error">{errorMsg}</p>}
        {accountStatus?.status === 'requires_input' && (
          <p className="form-status">Please try verifying again.</p>
        )}
        <div className="field">
          <button disabled={!account || (accountStatus?.status === 'verified' && accountStatus.feePaidBlock === Number(feePaidBlock)) || feePaidBlock === 0n || isLoading || isSuccess}>Perform Verification</button>
        </div>
      </fieldset>
    </form>
  </>);
}
