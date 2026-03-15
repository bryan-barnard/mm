import { signIn } from '@/lib/actions/auth';

export default function SignInPage() {
  return (
    <form action={signIn} className="card mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-semibold">Sign In</h1>
      <input className="w-full rounded bg-slate-800 p-2" name="email" type="email" placeholder="Email" required />
      <input className="w-full rounded bg-slate-800 p-2" name="password" type="password" placeholder="Password" required />
      <button className="rounded bg-accent px-4 py-2">Sign in</button>
    </form>
  );
}
