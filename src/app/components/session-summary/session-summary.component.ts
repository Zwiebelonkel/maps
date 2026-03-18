import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStats, SessionService } from '../../../services/session.service';

@Component({
  selector: 'app-session-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-summary.component.html',
  styleUrls: ['./session-summary.component.scss'],
})
export class SessionSummaryComponent {
  @Input() stats: SessionStats | null = null;
  @Input() mapImageUrl: string | null = null;
  @Output() close = new EventEmitter<void>();
  isClosing = false;

  constructor(public sessionService: SessionService) {}

  closeWithAnimation() {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.close.emit();
    }, 320);
  }
}
