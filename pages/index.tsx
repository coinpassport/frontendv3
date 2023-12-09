import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Link from 'next/link';

async function createIdentity() {
  const group = new Group(1, 30);
  group.addMembers([
    16171973211964341168659637417730107561449765778267137326448276753627575553303n,
    3328419855159756766779838263470155554042027737262028323636796593203348048914n,
  ]);
  const identity = new Identity('new123');
  group.addMember(identity.commitment);
  console.log(identity);

  // group merkle root
  const externalNullifier =
    8179525123597609456666754529846344002649507921978616975480548874902188081862n;
  const signal = 42069;

  const fullProof = await generateProof(identity, group, externalNullifier, signal, {
    zkeyFilePath: "/semaphore.zkey",
    wasmFilePath: "/semaphore.wasm",
  });
  console.log(fullProof);
}

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
      <button type="button" onClick={createIdentity}>Create ID</button>
    </div>
    <p>
      <Link href="/app"><button type="button">Launch App</button></Link>
    </p>
  </>);
};

export default Home;
