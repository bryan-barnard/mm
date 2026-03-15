import { advanceRoundAction, recordGameResultAction, toggleTradingAction } from '@/lib/actions/league';
import { getContextLeague } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const context = await getContextLeague();
  if (!context) return <p>No league selected.</p>;

  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', context.userId).single();
  if (profile?.role !== 'commissioner') return <p>Commissioner access required.</p>;

  const { data: teams } = await supabase.from('teams').select('id,name').eq('league_id', context.league.id).eq('alive', true);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Commissioner Admin</h1>
      <form className="card space-y-2" action={toggleTradingAction}>
        <h2 className="font-semibold">Trading Window</h2>
        <input type="hidden" name="leagueId" value={context.league.id} />
        <input type="hidden" name="tradingOpen" value={String(!context.league.trading_open)} />
        <button className="rounded bg-accent px-3 py-1">Set Trading {context.league.trading_open ? 'Closed' : 'Open'}</button>
      </form>
      <form className="card" action={advanceRoundAction}>
        <input type="hidden" name="leagueId" value={context.league.id} />
        <button className="rounded border border-slate-500 px-3 py-1">Advance Round</button>
      </form>
      <form className="card space-y-2" action={recordGameResultAction}>
        <h2 className="font-semibold">Record Game Result</h2>
        <input type="hidden" name="leagueId" value={context.league.id} />
        <select className="w-full rounded bg-slate-800 p-2" name="winningTeamId">{(teams ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select className="w-full rounded bg-slate-800 p-2" name="losingTeamId">{(teams ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button className="rounded bg-accent px-3 py-1">Submit Result</button>
      </form>
    </div>
  );
}
