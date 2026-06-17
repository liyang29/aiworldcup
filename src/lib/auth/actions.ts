'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function getOrigin() {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export async function signInAnonymously() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInAnonymously();
  if (error) return { error: error.message };
  return { ok: true };
}

export async function signInWithGoogle(next: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${getOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (data?.url) redirect(data.url);
}

export async function signOut(next: string): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath(next);
}
