import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyQuest } from '../../../services/daily-quest.service';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-daily-quests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-quests.component.html',
  styleUrls: ['./daily-quests.component.scss'],
})
export class DailyQuestsComponent {
  @Input() quests: DailyQuest[] = [];
  @Input() allCompletedRewardClaimed = false;
  @Output() close = new EventEmitter<void>();

  isOpen = false;
  isClosing = false;

  private touchStartY = 0;
  private touchCurrentY = 0;
  private isDraggingHeader = false;

  constructor(private sound: SoundService) {}

  ngOnInit() {
    setTimeout(() => (this.isOpen = true), 10);
  }

  closeWithAnimation() {
    if (this.isClosing) return;

    this.sound.play('button', 0.5);
    this.isClosing = true;

    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.close.emit();
    }, 320);
  }

  onHeaderTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentY = this.touchStartY;
    this.isDraggingHeader = true;
  }

  onHeaderTouchMove(e: TouchEvent) {
    if (!this.isDraggingHeader) return;
    this.touchCurrentY = e.touches[0].clientY;
  }

  onHeaderTouchEnd() {
    if (!this.isDraggingHeader) return;

    const diff = this.touchCurrentY - this.touchStartY;
    if (diff > 80) this.closeWithAnimation();

    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDraggingHeader = false;
  }

  progressPercentage(quest: DailyQuest): number {
    if (quest.target <= 0) return 0;
    return (Math.min(quest.progress, quest.target) / quest.target) * 100;
  }
}
