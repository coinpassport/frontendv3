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
