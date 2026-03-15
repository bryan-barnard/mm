import { signUp } from '@/lib/actions/auth';

export default function SignUpPage() {
  return (
    <form action={signUp} className="card mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-semibold">Sign Up</h1>
      <input className="w-full rounded bg-slate-800 p-2" name="email" type="email" placeholder="Email" required />
      <input className="w-full rounded bg-slate-800 p-2" name="password" type="password" placeholder="Password" minLength={8} required />
      <button className="rounded bg-accent px-4 py-2">Create account</button>
    </form>
  );
}
