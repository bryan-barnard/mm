'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');

  return (
    <form
      className="card mx-auto max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = String(form.get('email'));
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        setMessage(error ? error.message : 'If this account exists, reset email has been sent.');
      }}
    >
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <input className="w-full rounded bg-slate-800 p-2" name="email" type="email" required placeholder="Email" />
      <button className="rounded bg-accent px-4 py-2">Send reset link</button>
      {message && <p className="text-sm text-slate-300">{message}</p>}
    </form>
  );
}
