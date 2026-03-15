import { getContextLeague } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function ActivityPage() {
  const context = await getContextLeague();
  if (!context) return <p>No league selected.</p>;

  const supabase = await createClient();
  const { data: txns } = await supabase
    .from('transactions')
    .select('type, amount, round, metadata, created_at')
    .eq('league_id', context.league.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Activity Log</h1>
      {(txns ?? []).map((t, i) => (
        <div className="card" key={i}>{t.type} ${t.amount} {t.round} at {new Date(t.created_at).toLocaleString()}</div>
      ))}
    </div>
  );
}
