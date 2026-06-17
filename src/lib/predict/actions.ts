'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type SubmitState = { ok?: boolean; error?: string } | null;

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function submitPrediction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const matchId = String(formData.get('matchId') ?? '');
  const home = Number(formData.get('home'));
  const away = Number(formData.get('away'));
  const token = String(formData.get('cf-turnstile-response') ?? '');
  const locale = String(formData.get('locale') ?? 'en');

  if (!matchId || !Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return { error: 'invalid' };
  }

  if (!(await verifyTurnstile(token))) return { error: 'verify' };

  const supabase = createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登录 → 静默匿名登录
  if (!user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return { error: 'anon' };
    ({
      data: { user },
    } = await supabase.auth.getUser());
  }
  if (!user) return { error: 'anon' };

  const { error } = await supabase.from('user_predictions').insert({
    user_id: user.id,
    match_id: matchId,
    pred_home: home,
    pred_away: away,
    locked_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === '23505') return { error: 'dup' }; // 已预测
    if (/locked_at|kickoff|开赛/.test(error.message)) return { error: 'late' };
    return { error: error.message };
  }

  revalidatePath(`/${locale}/predict`);
  return { ok: true };
}
