import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import HumanBoard from '@/components/HumanBoard';
import ScrollToMe from '@/components/ScrollToMe';
import { fetchHumanBoard } from '@/lib/leaderboard';
import { IconUser } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const m = (await getDictionary(params.locale)).meta;
  return {
    title: m.leaderboardTitle,
    description: m.leaderboardDesc,
    openGraph: { title: m.leaderboardTitle, description: m.leaderboardDesc },
    twitter: { title: m.leaderboardTitle, description: m.leaderboardDesc },
  };
}

export default async function LeaderboardPage({ params }: { params: { locale: Locale } }) {
  const dict = await getDictionary(params.locale);
  const t = dict.predict;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { rows, myRank } = await fetchHumanBoard(supabase, 100, user?.id ?? null);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:px-6">
      <h1 className="inline-flex items-center gap-2 text-2xl font-medium text-ink">
        <IconUser size={22} /> {t.humanBoard}
      </h1>
      <p className="mb-6 mt-1 text-sm text-mute">{t.humanTop100}</p>

      <HumanBoard
        rows={rows}
        myRank={myRank}
        t={{
          you: t.you,
          yourRank: t.yourRank,
          rankFmt: t.rankFmt,
          ptsUnit: t.ptsUnit,
          humanEmpty: t.humanEmpty,
        }}
      />

      <ScrollToMe targetId="me-row" />
    </main>
  );
}
