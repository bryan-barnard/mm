import { sellTeamAction } from '@/lib/actions/league';
import { getContextLeague } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function PortfolioPage() {
  const context = await getContextLeague();
  if (!context) return <p>No league selected.</p>;
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('id,name,region,seed,current_price,payout_per_win,wins,alive')
    .eq('league_id', context.league.id)
    .eq('owner_user_id', context.userId)
    .eq('alive', true);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Portfolio</h1>
      {(teams ?? []).map((team) => (
        <div key={team.id} className="card flex items-center justify-between">
          <div>{team.name} #{team.seed} ({team.region}) wins:{team.wins} value:${team.current_price}</div>
          <form action={sellTeamAction}>
            <input type="hidden" name="leagueId" value={context.league.id} />
            <input type="hidden" name="teamId" value={team.id} />
            <button disabled={!context.league.trading_open} className="rounded border border-slate-500 px-3 py-1 disabled:opacity-50">Sell</button>
          </form>
        </div>
      ))}
    </div>
  );
}
