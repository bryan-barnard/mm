import { ROUND_ORDER, ROUND_PRICE_MULTIPLIERS, type Round } from './constants';

export type TeamState = {
  id: string;
  seed: number;
  currentPrice: number;
  payoutPerWin: number;
  alive: boolean;
  ownerUserId: string | null;
  wins: number;
};

export type LeagueState = {
  tradingOpen: boolean;
  currentRound: Round;
};

export function buyTeam(league: LeagueState, team: TeamState, buyerId: string, balance: number) {
  if (!league.tradingOpen) throw new Error('Trading is closed');
  if (!team.alive) throw new Error('Team is eliminated');
  if (team.ownerUserId) throw new Error('Team already owned');
  if (balance < team.currentPrice) throw new Error('Insufficient funds');

  return {
    updatedBalance: balance - team.currentPrice,
    updatedTeam: { ...team, ownerUserId: buyerId }
  };
}

export function sellTeam(league: LeagueState, team: TeamState, sellerId: string, balance: number) {
  if (!league.tradingOpen) throw new Error('Trading is closed');
  if (!team.alive) throw new Error('Team is eliminated');
  if (team.ownerUserId !== sellerId) throw new Error('Not owner');

  return {
    updatedBalance: balance + team.currentPrice,
    updatedTeam: { ...team, ownerUserId: null }
  };
}

export function recordResult(round: Round, winner: TeamState, loser: TeamState, ownerBalance?: number) {
  if (!winner.alive || !loser.alive) throw new Error('Both teams must be alive');

  const multiplier = ROUND_PRICE_MULTIPLIERS[round];
  const updatedWinner = {
    ...winner,
    wins: winner.wins + 1,
    currentPrice: Math.round(winner.currentPrice * multiplier)
  };
  const updatedLoser = {
    ...loser,
    alive: false,
    currentPrice: 0,
    ownerUserId: null
  };

  return {
    updatedWinner,
    updatedLoser,
    payout: winner.ownerUserId ? winner.payoutPerWin : 0,
    updatedOwnerBalance:
      winner.ownerUserId && ownerBalance !== undefined ? ownerBalance + winner.payoutPerWin : ownerBalance
  };
}

export function advanceRound(currentRound: Round): Round {
  const index = ROUND_ORDER.indexOf(currentRound);
  if (index === -1 || index === ROUND_ORDER.length - 1) {
    throw new Error('Cannot advance round');
  }
  return ROUND_ORDER[index + 1];
}
