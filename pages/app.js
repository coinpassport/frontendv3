import { ConnectButton } from '@rainbow-me/rainbowkit';

import PayFee from '../components/PayFee.js';

export default function AppPage() {
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
    <PayFee />
    <p>Perform Verification</p>
    <p>Publish verification</p>
    <p>Switch account</p>
    <p>Mint passport nft</p>
  </>);
}
