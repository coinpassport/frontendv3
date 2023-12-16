
export function generateNonce() {
  const nonceArray = new Uint8Array(10);
  crypto.getRandomValues(nonceArray);
  return Array.from(nonceArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function idSignature(walletClient, publicClient, contracts) {
  const groupId = await publicClient.readContract({
    ...contracts.VerificationV2,
    functionName: 'groupId',
  });
  const signature = await walletClient.signMessage({
    message: `Coinpassport V2 Identity Commitment\n\nGroup ID: ${groupId}\n\nNever sign this message on any website except Coinpassport.`,
  });
  return signature;
}

export async function calculateProof(input) {
  console.log(input);
    const { proof, publicSignals } =
      await snarkjs.groth16.fullProve( input, "./eddsa_impl.wasm", "./circuit_final.zkey");

    console.log(JSON.stringify(proof, null, 1));
    console.log(publicSignals);
    console.log(bitsToBigInt(publicSignals, true));

    const args = JSON.parse('[' + await snarkjs.groth16.exportSolidityCallData(proof, publicSignals) + ']');
    console.log(args);
// 
// 
//     const vkey = await fetch("./verification_key.json").then( function(res) {
//         return res.json();
//     });
// 
//     const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);
// 
//     console.log(res);
    return { proof, publicSignals, args };
}

export function bitsToBigInt(bits, reverseBytes) {
    // Function to reverse bits within each byte
    const reverseByte = byte => byte.slice().reverse();

    // Split the array into chunks of 8 bits and reverse each chunk if required
    let processedBits = [];
    for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.slice(i, i + 8);
        processedBits = processedBits.concat(reverseBytes ? reverseByte(byte) : byte);
    }

    // Join the processed array of bits into a binary string
    const binaryString = processedBits.join('');

    // Convert the binary string to a BigInt and return
    return BigInt('0b' + binaryString);
}

// From ChatGPT4
export function bitsToBigIntLittleEndian(bitsArray, startBit, stopBit) {
    // Validate the input array
    if (!Array.isArray(bitsArray) || bitsArray.some(bit => bit !== 0 && bit !== 1)) {
        throw new Error('Invalid input: bitsArray must be an array of 0s and 1s');
    }

    // Validate startBit and stopBit
    if (startBit < 0 || stopBit >= bitsArray.length || startBit > stopBit) {
        throw new Error('Invalid startBit or stopBit');
    }

    // Extract the slice of the array
    const slicedArray = bitsArray.slice(startBit, stopBit + 1);

    // Convert the sliced array to BigInt in little-endian format
    let result = BigInt(0);
    slicedArray.forEach((bit, index) => {
        result += BigInt(bit) << BigInt(index);
    });

    return result;
}

export function reverseHexString(hexString) {
    if (hexString.length % 2 !== 0) {
        throw new Error("Hex string must have an even number of characters");
    }

    let reversedHexString = '';
    for (let i = hexString.length; i > 0; i -= 2) {
        reversedHexString += hexString.substring(i - 2, i);
    }

    return reversedHexString;
}
