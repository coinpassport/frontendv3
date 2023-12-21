import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <menu>
        <li>&copy; 2023</li>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/docs">Docs</Link></li>
        <li><Link href="/privacy-policy">Privacy</Link></li>
      </menu>
    </footer>
  );
}
