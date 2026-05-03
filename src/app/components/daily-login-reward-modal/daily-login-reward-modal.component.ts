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

  @Output() close = new EventEmitter<void>();
  @Output() claim = new EventEmitter<void>();
}
