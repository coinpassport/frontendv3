import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Link from 'next/link';

import { useAccount, useContractReads, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, erc20ABI } from 'wagmi';
import semaphoreABI from '../abi/Semaphore.json';

const Home: NextPage = () => {

  const  {
    data: approveData,
    isLoading: approveLoading,
    isError: approveError,
    isSuccess: approveSuccess,
    write: approveWrite
  } = useContractWrite({
    chainId: 17000,
    address: '0x05d816d46cf7a39600648ca040e94678b8342277',
    abi: semaphoreABI,
    functionName: 'verifyProof',
  });

async function createIdentity() {
  const groupId = 1;
  const group = new Group(groupId, 30);
  group.addMembers([
    16171973211964341168659637417730107561449765778267137326448276753627575553303n,
    3328419855159756766779838263470155554042027737262028323636796593203348048914n,
  ]);
  const identity = new Identity('new1');
  group.addMember(identity.commitment);
  console.log(identity);

  // group merkle root
  const externalNullifier =
    8179525123597609456666754529846344002649507921978616975480548874902188081862n;
  const signal = 42072;

  const fullProof = await generateProof(identity, group, externalNullifier, signal, {
    zkeyFilePath: "/semaphore.zkey",
    wasmFilePath: "/semaphore.wasm",
  });
  console.log(fullProof);
  approveWrite({
  args: [
    groupId,
    fullProof.merkleTreeRoot,
    fullProof.signal,
    fullProof.nullifierHash,
    fullProof.externalNullifier,
    fullProof.proof
  ]
  });
}

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
