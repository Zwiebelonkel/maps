import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DailyReward } from '../../../services/daily-login-reward.service';

@Component({
  selector: 'app-daily-login-reward-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-login-reward-modal.component.html',
  styleUrls: ['./daily-login-reward-modal.component.scss'],
})
export class DailyLoginRewardModalComponent {
  @Input() isOpen = false;
  @Input() reward: DailyReward | null = null;
  @Input() alreadyClaimedToday = false;
  @Input() rewards: DailyReward[] = [];
  @Input() claimedCount = 0;

  get rewardGridItems(): DailyRewardGridItem[] {
    return this.rewards.map((reward, index) => ({
      day: index + 1,
      reward,
      claimed: index < this.claimedCount,
      today: this.reward?.id === reward.id,
    }));
  }

  @Output() close = new EventEmitter<void>();
  @Output() claim = new EventEmitter<void>();
}

export interface DailyRewardGridItem {
  day: number;
  reward: DailyReward;
  claimed: boolean;
  today: boolean;
}
