import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Link from 'next/link';

const Home: NextPage = () => {

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
    <p>
      <Link href="/app"><button type="button">Launch App</button></Link>
    </p>
  </>);
};

export default Home;
