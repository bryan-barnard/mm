import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">March Madness Stock Market Pool</h1>
      <p>Treat NCAA teams like stocks, buy and sell between rounds, and climb the leaderboard.</p>
      <div className="flex gap-3">
        <Link className="rounded bg-accent px-4 py-2 text-white" href="/auth/sign-up">Create account</Link>
        <Link className="rounded border border-slate-700 px-4 py-2" href="/auth/sign-in">Sign in</Link>
      </div>
    </section>
  );
}
