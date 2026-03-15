'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function signUp(formData: FormData) {
  const parsed = authSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed);
  if (error) throw new Error(error.message);
  redirect('/dashboard');
}

export async function signIn(formData: FormData) {
  const parsed = authSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed);
  if (error) throw new Error(error.message);
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
