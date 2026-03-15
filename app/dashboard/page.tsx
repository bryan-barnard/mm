import { getContextLeague } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const context = await getContextLeague();
  if (!context) return <p>Join or create a league to begin.</p>;

  const supabase = await createClient();
  const { data: teams } = await supabase
    .from('teams')
    .select('current_price, owner_user_id, alive')
    .eq('league_id', context.league.id)
    .eq('owner_user_id', context.userId)
    .eq('alive', true);

  const portfolioValue = (teams ?? []).reduce((acc, t) => acc + t.current_price, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{context.league.name}</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">Round: {context.league.current_round}</div>
        <div className="card">Trading: {context.league.trading_open ? 'Open' : 'Closed'}</div>
        <div className="card">Bank: ${context.balance}</div>
        <div className="card">Net Worth: ${context.balance + portfolioValue}</div>
      </div>
    </div>
  );
}
