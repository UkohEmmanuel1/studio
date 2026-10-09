import Link from "next/link";
export default function PrivacyPage() {
  return <main className="container" style={{padding:"50px 0",maxWidth:820}}><Link href="/">← PosterStudio</Link><h1>Privacy notice</h1><p><strong>Starter content — legal review required before launch.</strong></p><p>This development version stores design drafts in your browser’s local storage. It does not currently provide user accounts, cloud project storage, analytics, or payment processing.</p><p>If cloud features are added, this notice must be updated to explain the data collected, purposes, retention periods, service providers, and how users can exercise applicable privacy rights.</p></main>;
}
