'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const buySellSchema = z.object({ leagueId: z.string().uuid(), teamId: z.string().uuid() });

export async function buyTeamAction(formData: FormData) {
  const supabase = await createClient();
  const parsed = buySellSchema.parse(Object.fromEntries(formData.entries()));
  const { error } = await supabase.rpc('buy_team', { p_league_id: parsed.leagueId, p_team_id: parsed.teamId });
  if (error) throw new Error(error.message);
  revalidatePath('/market');
  revalidatePath('/dashboard');
}

export async function sellTeamAction(formData: FormData) {
  const supabase = await createClient();
  const parsed = buySellSchema.parse(Object.fromEntries(formData.entries()));
  const { error } = await supabase.rpc('sell_team', { p_league_id: parsed.leagueId, p_team_id: parsed.teamId });
  if (error) throw new Error(error.message);
  revalidatePath('/portfolio');
  revalidatePath('/dashboard');
}

const resultSchema = z.object({
  leagueId: z.string().uuid(),
  winningTeamId: z.string().uuid(),
  losingTeamId: z.string().uuid()
});

export async function recordGameResultAction(formData: FormData) {
  const supabase = await createClient();
  const parsed = resultSchema.parse(Object.fromEntries(formData.entries()));
  const { error } = await supabase.rpc('record_game_result', {
    p_league_id: parsed.leagueId,
    p_winning_team_id: parsed.winningTeamId,
    p_losing_team_id: parsed.losingTeamId
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function advanceRoundAction(formData: FormData) {
  const supabase = await createClient();
  const leagueId = z.string().uuid().parse(formData.get('leagueId'));
  const { error } = await supabase.rpc('advance_round', { p_league_id: leagueId });
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function toggleTradingAction(formData: FormData) {
  const supabase = await createClient();
  const leagueId = z.string().uuid().parse(formData.get('leagueId'));
  const tradingOpen = z.coerce.boolean().parse(formData.get('tradingOpen'));
  const { error } = await supabase.rpc('set_trading_window', { p_league_id: leagueId, p_open: tradingOpen });
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}
