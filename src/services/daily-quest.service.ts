import { Injectable } from '@angular/core';

export type DailyQuestType = 'tiles' | 'clicks' | 'lootbox';

export interface DailyQuest {
  id: string;
  type: DailyQuestType;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

interface DailyQuestState {
  dayKey: string;
  quests: DailyQuest[];
  allCompletedRewardClaimed: boolean;
}

export interface QuestRewardResult {
  coinsGranted: number;
  lootboxesGranted: number;
  newlyCompleted: DailyQuest[];
  allCompleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class DailyQuestService {
  private readonly STORAGE_KEY = 'daily_quests';
  private readonly QUEST_REWARD_COINS = 100;
  private readonly ALL_QUESTS_LOOTBOX_REWARD = 3;

  private state: DailyQuestState = this.createFreshState(this.getDayKey());

  constructor() {
    this.load();
  }

  get snapshot(): DailyQuestState {
    this.ensureToday();
    return this.state;
  }

  addProgress(type: DailyQuestType, amount = 1): QuestRewardResult {
    this.ensureToday();

    if (amount <= 0) {
      return {
        coinsGranted: 0,
        lootboxesGranted: 0,
        newlyCompleted: [],
        allCompleted: this.areAllQuestsCompleted(),
      };
    }

    let coinsGranted = 0;
    const newlyCompleted: DailyQuest[] = [];

    this.state.quests = this.state.quests.map((quest) => {
      if (quest.type !== type || quest.completed) {
        return quest;
      }

      const progress = Math.min(quest.target, quest.progress + amount);
      const completed = progress >= quest.target;

      const updatedQuest: DailyQuest = {
        ...quest,
        progress,
        completed,
      };

      if (completed && !quest.rewardClaimed) {
        updatedQuest.rewardClaimed = true;
        coinsGranted += this.QUEST_REWARD_COINS;
        newlyCompleted.push(updatedQuest);
      }

      return updatedQuest;
    });

    let lootboxesGranted = 0;
    if (this.areAllQuestsCompleted() && !this.state.allCompletedRewardClaimed) {
      this.state.allCompletedRewardClaimed = true;
      lootboxesGranted = this.ALL_QUESTS_LOOTBOX_REWARD;
    }

    this.save();

    return {
      coinsGranted,
      lootboxesGranted,
      newlyCompleted,
      allCompleted: this.areAllQuestsCompleted(),
    };
  }

  resetForToday(): void {
    this.state = this.createFreshState(this.getDayKey());
    this.save();
  }

  private areAllQuestsCompleted(): boolean {
    return this.state.quests.every((quest) => quest.completed);
  }

  private ensureToday(): void {
    const today = this.getDayKey();
    if (this.state.dayKey !== today) {
      this.state = this.createFreshState(today);
      this.save();
    }
  }

  private createFreshState(dayKey: string): DailyQuestState {
    return {
      dayKey,
      allCompletedRewardClaimed: false,
      quests: [
        {
          id: 'daily_tiles_40',
          type: 'tiles',
          title: 'Kartograf',
          description: 'Lege 40 Kacheln frei',
          target: 40,
          progress: 0,
          completed: false,
          rewardClaimed: false,
        },
        {
          id: 'daily_clicks_300',
          type: 'clicks',
          title: 'Finger-Fokus',
          description: 'Klicke 300-mal auf die Karte',
          target: 300,
          progress: 0,
          completed: false,
          rewardClaimed: false,
        },
        {
          id: 'daily_lootbox_1',
          type: 'lootbox',
          title: 'Unboxing',
          description: 'Öffne 1 Lootbox',
          target: 1,
          progress: 0,
          completed: false,
          rewardClaimed: false,
        },
      ],
    };
  }

  private getDayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
  }

  private load(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      this.save();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as DailyQuestState;
      if (!parsed.dayKey || !Array.isArray(parsed.quests)) {
        this.state = this.createFreshState(this.getDayKey());
      } else {
        this.state = {
          dayKey: parsed.dayKey,
          quests: parsed.quests,
          allCompletedRewardClaimed: !!parsed.allCompletedRewardClaimed,
        };
      }
    } catch {
      this.state = this.createFreshState(this.getDayKey());
    }

    this.ensureToday();
  }
}
