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
const TOTAL_REWARD_DAYS = 31;

@Injectable({ providedIn: 'root' })
export class DailyLoginRewardService {
  readonly rewards: DailyReward[] = Array.from({ length: TOTAL_REWARD_DAYS }, (_, index) => {
    const day = index + 1;

    if (day % 7 === 0) {
      const amount = Math.round((day / 7) * 10000);
      return { id: `day-${day}`, label: `${amount.toLocaleString('de-DE')} Coins`, icon: '👑', type: 'coins' as const, amount };
    }

    if (day % 5 === 0) {
      const amount = Math.max(1, Math.floor(day / 5)) * 5000;
      return { id: `day-${day}`, label: `${amount.toLocaleString('de-DE')} Coins`, icon: '🪙', type: 'coins' as const, amount };
    }

    if (day % 2 === 0) {
      const amount = Math.max(1, Math.floor(day / 8));
      return { id: `day-${day}`, label: `${amount} Kleine Bomb${amount > 1 ? 'en' : 'e'}`, icon: '💣', type: 'bomb' as const, amount };
    }

    const amount = Math.max(1, Math.floor(day / 6) + 1);
    return { id: `day-${day}`, label: `${amount} Lootbox${amount > 1 ? 'en' : ''}`, icon: '🎁', type: 'lootbox' as const, amount };
  });

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


  getProgress(): DailyRewardProgress {
    const state = this.loadState();
    return {
      claimedCount: state.cycleDay,
      currentDayIndex: state.cycleDay % this.rewards.length,
    };
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


export interface DailyRewardProgress {
  claimedCount: number;
  currentDayIndex: number;
}
