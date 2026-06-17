'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitPrediction, type SubmitState } from '@/lib/predict/actions';
import TurnstileWidget from '@/components/TurnstileWidget';

export type PredictT = {
  submit: string;
  submitting: string;
  fillFirst: string;
  success: string;
  verifyFailed: string;
  tooLate: string;
  anonError: string;
};

function SubmitButton({
  label,
  submitting,
  canSubmit,
}: {
  label: string;
  submitting: string;
  canSubmit: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !canSubmit}
      className="rounded-full bg-sunset px-6 py-2.5 text-sm font-medium text-canvas transition-colors disabled:cursor-not-allowed disabled:bg-hairline disabled:text-mute"
    >
      {pending ? submitting : label}
    </button>
  );
}

function errorText(code: string, t: PredictT) {
  if (code === 'verify') return t.verifyFailed;
  if (code === 'late' || code === 'dup') return t.tooLate;
  if (code === 'anon') return t.anonError;
  return t.verifyFailed;
}

export default function PredictForm({
  matchId,
  locale,
  homeName,
  awayName,
  siteKey,
  t,
}: {
  matchId: string;
  locale: string;
  homeName: string;
  awayName: string;
  siteKey: string;
  t: PredictT;
}) {
  const [state, action] = useFormState<SubmitState, FormData>(submitPrediction, null);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const canSubmit = home !== '' && away !== '';

  if (state?.ok) {
    return <p className="rounded-card bg-sunset/15 px-4 py-3 text-center text-sm text-sunset">{t.success}</p>;
  }

  const inputCls =
    'h-12 w-16 rounded-card border border-hairline bg-canvas-soft text-center text-xl text-ink placeholder:text-mute';

  return (
    <form action={action} className="flex flex-col items-center gap-4">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="locale" value={locale} />
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-mute">{homeName}</span>
          <input
            type="number"
            name="home"
            min="0"
            max="20"
            required
            placeholder="–"
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className={inputCls}
          />
        </div>
        <span className="pt-5 text-mute">-</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-mute">{awayName}</span>
          <input
            type="number"
            name="away"
            min="0"
            max="20"
            required
            placeholder="–"
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <TurnstileWidget siteKey={siteKey} />
      <SubmitButton label={t.submit} submitting={t.submitting} canSubmit={canSubmit} />

      {!canSubmit && <p className="text-xs text-mute">{t.fillFirst}</p>}
      {state?.error && <p className="text-sm text-red-400">{errorText(state.error, t)}</p>}
    </form>
  );
}
