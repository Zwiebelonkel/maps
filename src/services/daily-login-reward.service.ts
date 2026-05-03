import { Injectable } from '@angular/core';

export type DailyRewardType = 'coins' | 'lootbox' | 'bomb';

export interface DailyReward {
  id: string;
  label: string;
  icon: string;
  type: DailyRewardType;
  amount: number;
}

const STORAGE_KEY = 'daily_login_reward_v1';

@Injectable({ providedIn: 'root' })
export class DailyLoginRewardService {
  readonly rewards: DailyReward[] = [
    { id: 'day-1', label: '1 Lootbox', icon: '🎁', type: 'lootbox', amount: 1 },
    { id: 'day-2', label: 'Kleine Bombe', icon: '💣', type: 'bomb', amount: 1 },
    { id: 'day-3', label: '2.500 Coins', icon: '🪙', type: 'coins', amount: 2500 },
    { id: 'day-4', label: '2 Lootboxen', icon: '🎁', type: 'lootbox', amount: 2 },
    { id: 'day-5', label: '5.000 Coins', icon: '🪙', type: 'coins', amount: 5000 },
    { id: 'day-6', label: '2 Kleine Bomben', icon: '💣', type: 'bomb', amount: 2 },
    { id: 'day-7', label: '10.000 Coins', icon: '👑', type: 'coins', amount: 10000 },
  ];

  getRewardForToday(): DailyReward {
    const state = this.loadState();
    return this.rewards[state.cycleDay % this.rewards.length];
  }

  shouldAutoOpen(): boolean {
    const today = this.getTodayKey();
    return this.loadState().lastClaimedDate !== today;
  }

  claimTodayReward(): DailyReward | null {
    const today = this.getTodayKey();
    const state = this.loadState();

    if (state.lastClaimedDate === today) {
      return null;
    }

    const reward = this.rewards[state.cycleDay % this.rewards.length];
    this.saveState({
      lastClaimedDate: today,
      cycleDay: (state.cycleDay + 1) % this.rewards.length,
    });
    return reward;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private loadState(): { lastClaimedDate: string | null; cycleDay: number } {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastClaimedDate: null, cycleDay: 0 };

    try {
      const parsed = JSON.parse(raw);
      return {
        lastClaimedDate:
          typeof parsed.lastClaimedDate === 'string' ? parsed.lastClaimedDate : null,
        cycleDay: Number.isInteger(parsed.cycleDay) ? parsed.cycleDay : 0,
      };
    } catch {
      return { lastClaimedDate: null, cycleDay: 0 };
    }
  }

  private saveState(state: { lastClaimedDate: string; cycleDay: number }) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
