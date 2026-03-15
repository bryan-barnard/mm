import { getContextLeague } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function LeaderboardPage() {
  const context = await getContextLeague();
  if (!context) return <p>No league selected.</p>;
  const supabase = await createClient();

  const { data } = await supabase.rpc('league_leaderboard', { p_league_id: context.league.id });

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      {(data ?? []).map((row: any, index: number) => (
        <div className="card" key={row.user_id}>
          #{index + 1} {row.display_name} — Bank ${row.bank_balance} | Portfolio ${row.portfolio_value} | Net ${row.net_worth}
        </div>
      ))}
    </div>
  );
}
