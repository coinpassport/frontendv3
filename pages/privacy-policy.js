import Head from 'next/head';
import Link from 'next/link';

import TableOfContents from '../components/TableOfContents.js';
import Footer from '../components/Footer.js';

export default function PrivacyPage() {
  return (<>
    <Head>
      <title>Privacy Policy - Coinpassport</title>
    </Head>
    <div className="header-bg">
      <header>
        <h1><Link href="/">Coinpassport</Link></h1>
      </header>
      <h2>Privacy Policy</h2>
    </div>
      <div className="docs">
        <TableOfContents />
        <section>
          <h3 id="stripe-id">Stripe Identity</h3>
          <p>We use Stripe Identity for identity verification. Stripe collects identity document images, facial images, ID numbers and addresses as well as advanced fraud signals and information about the devices that connect to its services. Stripe shares this information with us and also uses this information to operate and improve the services it provides, including for fraud detection. You may also choose to allow Stripe to use your data to improve Stripe’s biometric verification technology. You can learn more about <a href="https://support.stripe.com/questions/common-questions-about-stripe-identity">Stripe Identity</a> and read their <a href="https://stripe.com/privacy">privacy policy</a>.</p>
          <h3 id="data-retention">Data Retention</h3>
          <p>Your data is redacted from Stripe immediately upon successful verification.</p>
          <p>Coinpassport only stores your passport&apos;s expiration date (rounded to 2 weeks for privacy) and a hash of your country and document number.</p>
          <p>Coinpassport never stores any private data about your verification. We log no identifying information about our users.</p>
          <p>This site does not use cookies.</p>

        </section>
      </div>
      <Footer />
  </>);
}

