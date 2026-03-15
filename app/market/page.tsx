import { buyTeamAction } from '@/lib/actions/league';
import { getContextLeague } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function MarketPage() {
  const context = await getContextLeague();
  if (!context) return <p>No league selected.</p>;

  const supabase = await createClient();
  const { data: teams } = await supabase
    .from('teams')
    .select('id,name,region,seed,current_price,payout_per_win,alive,owner_user_id')
    .eq('league_id', context.league.id)
    .eq('alive', true)
    .is('owner_user_id', null)
    .order('seed');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Market</h1>
      <div className="grid gap-3">
        {(teams ?? []).map((team) => (
          <div key={team.id} className="card flex items-center justify-between">
            <div>{team.name} ({team.region} #{team.seed}) - ${team.current_price} | payout ${team.payout_per_win}</div>
            <form action={buyTeamAction}>
              <input type="hidden" name="leagueId" value={context.league.id} />
              <input type="hidden" name="teamId" value={team.id} />
              <button disabled={!context.league.trading_open || context.balance < team.current_price} className="rounded bg-accent px-3 py-1 disabled:opacity-50">Buy</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
