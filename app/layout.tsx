import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-800 bg-slate-900/70">
          <nav className="mx-auto flex max-w-6xl gap-4 p-4 text-sm">
            <Link href="/">Home</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/market">Market</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/activity">Activity</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
