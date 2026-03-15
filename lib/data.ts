import { createClient } from '@/lib/supabase/server';

export async function getContextLeague() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data: membership } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user.user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: league } = await supabase.from('leagues').select('*').eq('id', membership.league_id).single();
  const { data: balance } = await supabase
    .from('player_balances')
    .select('bank_balance')
    .eq('league_id', membership.league_id)
    .eq('user_id', user.user.id)
    .single();

  return { userId: user.user.id, league, balance: balance?.bank_balance ?? 0 };
}
