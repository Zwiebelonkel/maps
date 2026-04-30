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

type DailyQuestDefinition = Omit<
  DailyQuest,
  'progress' | 'completed' | 'rewardClaimed'
>;

@Injectable({ providedIn: 'root' })
export class DailyQuestService {
  private readonly STORAGE_KEY = 'daily_quests';

  private readonly QUEST_REWARD_COINS = 100;
  private readonly ALL_QUESTS_LOOTBOX_REWARD = 3;

  private readonly QUEST_DEFINITIONS: DailyQuestDefinition[] = [
    {
      id: 'daily_tiles_10',
      type: 'tiles',
      title: 'Erste Schritte',
      description: 'Lege 10 Kacheln frei',
      target: 10,
    },
    {
      id: 'daily_tiles_40',
      type: 'tiles',
      title: 'Kartograf',
      description: 'Lege 40 Kacheln frei',
      target: 40,
    },
    {
      id: 'daily_tiles_100',
      type: 'tiles',
      title: 'Gebietseroberer',
      description: 'Lege 100 Kacheln frei',
      target: 100,
    },

    {
      id: 'daily_clicks_75',
      type: 'clicks',
      title: 'Warmgeklickt',
      description: 'Klicke 75-mal auf die Karte',
      target: 75,
    },
    {
      id: 'daily_clicks_300',
      type: 'clicks',
      title: 'Finger-Fokus',
      description: 'Klicke 300-mal auf die Karte',
      target: 300,
    },
    {
      id: 'daily_clicks_750',
      type: 'clicks',
      title: 'Klickmaschine',
      description: 'Klicke 750-mal auf die Karte',
      target: 750,
    },

    {
      id: 'daily_lootbox_1',
      type: 'lootbox',
      title: 'Unboxing',
      description: 'Öffne 1 Lootbox',
      target: 1,
    }
  ];

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

      if (completed && !quest.completed) {
        newlyCompleted.push(updatedQuest);
      }

      return updatedQuest;
    });

    this.save();

    return {
      coinsGranted: 0,
      lootboxesGranted: 0,
      newlyCompleted,
      allCompleted: this.areAllQuestsCompleted(),
    };
  }

  claimQuestReward(questId: string): number {
    this.ensureToday();

    let coinsGranted = 0;

    this.state.quests = this.state.quests.map((quest) => {
      if (quest.id !== questId || !quest.completed || quest.rewardClaimed) {
        return quest;
      }

      coinsGranted = this.QUEST_REWARD_COINS;
      return {
        ...quest,
        rewardClaimed: true,
      };
    });

    if (coinsGranted > 0) {
      this.save();
    }

    return coinsGranted;
  }

  claimAllCompletedReward(): number {
    this.ensureToday();

    if (!this.areAllQuestsCompleted() || this.state.allCompletedRewardClaimed) {
      return 0;
    }

    this.state.allCompletedRewardClaimed = true;
    this.save();
    return this.ALL_QUESTS_LOOTBOX_REWARD;
  }

  hasClaimableRewards(): boolean {
    this.ensureToday();
    const hasClaimableQuest = this.state.quests.some(
      (quest) => quest.completed && !quest.rewardClaimed,
    );
    const hasClaimableDailyBonus =
      this.areAllQuestsCompleted() && !this.state.allCompletedRewardClaimed;

    return hasClaimableQuest || hasClaimableDailyBonus;
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
      return;
    }

    this.state = this.mergeWithCurrentQuestDefinitions(this.state);
  }

  private createFreshState(dayKey: string): DailyQuestState {
    return {
      dayKey,
      allCompletedRewardClaimed: false,
      quests: this.QUEST_DEFINITIONS.map((quest) => ({
        ...quest,
        progress: 0,
        completed: false,
        rewardClaimed: false,
      })),
    };
  }

  private mergeWithCurrentQuestDefinitions(
    loadedState: DailyQuestState
  ): DailyQuestState {
    const existingById = new Map(
      loadedState.quests.map((quest) => [quest.id, quest])
    );

    const quests: DailyQuest[] = this.QUEST_DEFINITIONS.map((definition) => {
      const existingQuest = existingById.get(definition.id);

      if (!existingQuest) {
        return {
          ...definition,
          progress: 0,
          completed: false,
          rewardClaimed: false,
        };
      }

      const progress = Math.min(
        definition.target,
        Math.max(0, existingQuest.progress ?? 0)
      );

      const completed = progress >= definition.target;

      return {
        ...definition,
        progress,
        completed,
        rewardClaimed: completed ? !!existingQuest.rewardClaimed : false,
      };
    });

    const allCompleted = quests.every((quest) => quest.completed);

    return {
      dayKey: loadedState.dayKey,
      quests,
      allCompletedRewardClaimed: allCompleted
        ? !!loadedState.allCompletedRewardClaimed
        : false,
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
        this.state = this.mergeWithCurrentQuestDefinitions({
          dayKey: parsed.dayKey,
          quests: parsed.quests,
          allCompletedRewardClaimed: !!parsed.allCompletedRewardClaimed,
        });
      }
    } catch {
      this.state = this.createFreshState(this.getDayKey());
    }

    this.ensureToday();
    this.save();
  }
}
