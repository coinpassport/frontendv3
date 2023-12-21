import Head from 'next/head';
import Link from 'next/link';

import TableOfContents from '../components/TableOfContents.js';
import Footer from '../components/Footer.js';

export default function DocsPage() {
  return (<>
    <Head>
      <title>Documentation - Coinpassport</title>
    </Head>
    <div className="header-bg">
      <header>
        <h1><Link href="/">Coinpassport</Link></h1>
      </header>
      <h2>Documentation</h2>
    </div>
      <div className="docs">
        <TableOfContents />
        <section>
          <h3 id="how-to-verify">How to verify?</h3>
          <p>Before starting the verification process, here’s what you need:</p>

          <ul>
            <li>A valid passport. Not a photocopy or a picture of an ID document. Ensure that the ID document is not expired.</li>
            <li>A device with a camera, if possible, use a mobile device. Cameras on mobile devices typically take higher-quality photos than a webcam.</li>
          </ul>

          <p>The quality of the images captured affects success rates dramatically. Below are a few best practices to help ensure that your verification succeeds:</p>

          <ul>
            <li>Capture a clear image. Make sure that the images are not too dark or bright, and don&apos;t have a glare. Hold steady and allow your camera to focus to avoid blurry photos.</li>
            <li>Do not block any part of your ID document in the image. Ideally you can lay it flat to take the photo.</li>
            <li>Do not block any part of your face. Remove sunglasses, masks, or other accessories.</li>
            <li>Find a location with ambient lighting. Avoid spaces with strong overhead lights that cast a shadow on your face or ID document. Avoid sitting directly in front of a bright light which can wash out your face and add a glare to your ID document.</li>
          </ul>
          <h3 id="verification-methods">Can I get verified using a different method?</h3>
          <p>Coinpassport requires verifying using a passport and not other identity documents in order to ensure that each person can only verify one account. Other government identity documents are not accepted since we cannot link your identity between a document like a driver&apos;s license and a passport, potentially allowing one person to verify multiple accounts.</p>
          <h3 id="access-to-data">Who has access to my verification data?</h3>
          <p>Both Coinpassport and Stripe will have access to the information that you submit through the verification flow. We rely on Stripe to help store your verification data. Stripe uses access controls and security standards that are at least as stringent as those used to handle their own KYC and payments compliance data.</p>
          <p><a href="https://support.stripe.com/questions/common-questions-about-stripe-identity">Learn more</a> about how Stripe handles and stores your data.</p>
          <p>After becoming verified, your personal data will be redacted from Stripe. The only data that is stored is the document expiration date (rounded by 2 weeks for privacy) and a hash of the country and document number.</p>
          <h3 id="how-its-anonymous">How is it anonymous?</h3>
          <p>Fee payment and publishing the verification status are conducted with one account then you can switch to another account to mint the passport NFT. This passport NFT will expire at the end of the epoch.</p>
          <p>You can join every epoch and mint NFTs until your passport expires.</p>
          <h3 id="why-epochs">Why have epochs?</h3>
          <p>As part of its privacy scheme, every passport NFT is deactivated at the start of a new epoch. Each epoch is currently 8 weeks. After the change, each user must join the new group and mint a new passport NFT.</p>
          <ul>
            <li>Enable the deactivation of expired passports without linking your expiration date to your NFTs.</li>
            <li>Keeps ZK proof generation time shorter by only requiring the witness of each user active in the epoch instead of all time.</li>
            <li>Quicker restoration of anonymity in the event of a doxxing than the alternative of a single passport NFT active for the entire duration of your passport&apos;s lifetime.</li>
          </ul>
          <p>This small inconvenience of submitting a transaction each epoch to join the group and mint a new NFT offers privacy and usability benefits over a longer-duration passport NFT.</p>
          <p>Privacy tip: If joining an epoch early, when it only has a few members, wait until more people have joined the group before minting your passport NFT.</p>
          <h3 id="developers">For Developers</h3>
          <p>Coinpassport deploys an ERC721 contract with view functions <code>addressActive</code> and <code>tokenActive</code> to assist in developing applications.</p>
          <ul>
            <li>Holesky - <a target="_blank" rel="noopener" href="https://holesky.etherscan.io/address/0x7ad8f110ff586d5f8079cb2253ea057be847e5ce">0x7ad8&hellip;e5ce</a></li>
            <li>Mumbai - <a target="_blank" rel="noopener" href="https://mumbai.polygonscan.com/address/0xeded09fea28c8a21c69007019f31147df3a4180f">0xeded&hellip;180f</a></li>
          </ul>
          <h3 id="contact">Contact and Resources</h3>
          <p>Email: <a href="mailto:info@coinpassport.net">info@coinpassport.net</a></p>
          <p>Github: <a target="_blank" rel="noopener" href="https://github.com/coinpassport">@coinpassport</a></p>
          <p>Twitter: <a target="_blank" rel="noopener" href="https://twitter.com/coinpassport1">@coinpassport1</a></p>

        </section>
      </div>
      <Footer />
  </>);
}
