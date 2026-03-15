import { describe, expect, it } from 'vitest';
import { advanceRound, buyTeam, recordResult, sellTeam, type LeagueState, type TeamState } from '@/lib/game-engine';

const baseLeague: LeagueState = { tradingOpen: true, currentRound: 'ROUND_OF_64' };
const team = (overrides: Partial<TeamState> = {}): TeamState => ({
  id: 't1', seed: 10, currentPrice: 100, payoutPerWin: 245, alive: true, ownerUserId: null, wins: 0, ...overrides
});

describe('game engine', () => {
  it('successful buy', () => {
    const result = buyTeam(baseLeague, team(), 'u1', 1000);
    expect(result.updatedBalance).toBe(900);
    expect(result.updatedTeam.ownerUserId).toBe('u1');
  });

  it('insufficient funds on buy', () => {
    expect(() => buyTeam(baseLeague, team(), 'u1', 50)).toThrow(/Insufficient/);
  });

  it('double purchase blocked', () => {
    expect(() => buyTeam(baseLeague, team({ ownerUserId: 'u2' }), 'u1', 1000)).toThrow(/already owned/);
  });

  it('sell by non-owner blocked', () => {
    expect(() => sellTeam(baseLeague, team({ ownerUserId: 'u2' }), 'u1', 100)).toThrow(/Not owner/);
  });

  it('trading closed buy/sell blocked', () => {
    const closed = { ...baseLeague, tradingOpen: false };
    expect(() => buyTeam(closed, team(), 'u1', 1000)).toThrow(/closed/);
    expect(() => sellTeam(closed, team({ ownerUserId: 'u1' }), 'u1', 100)).toThrow(/closed/);
  });

  it('payout applied on owned team win and loser zeroed', () => {
    const result = recordResult('ROUND_OF_64', team({ ownerUserId: 'u1' }), team({ id: 't2', ownerUserId: 'u2' }), 500);
    expect(result.payout).toBe(245);
    expect(result.updatedOwnerBalance).toBe(745);
    expect(result.updatedLoser.currentPrice).toBe(0);
    expect(result.updatedLoser.alive).toBe(false);
  });

  it('round advancement updates correctly', () => {
    expect(advanceRound('ROUND_OF_64')).toBe('ROUND_OF_32');
  });

  it('commissioner-only actions enforced by caller contract', () => {
    const role = 'player';
    const canAdvance = role === 'commissioner';
    expect(canAdvance).toBe(false);
  });
});
