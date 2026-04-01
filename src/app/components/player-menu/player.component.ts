import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { PlayerService } from '../../../services/player.service';
import { NotificationService } from '../../../services/notification.service';
import { OUTFITS, Outfit } from '../../config/player.config';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Output() close = new EventEmitter<void>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('modalRef') modalRef!: ElementRef;

  outfits = OUTFITS;
  isOpen = true;
  isClosing = false;
  selectedOutfit: Outfit | null = null;

  private startY = 0;
  private currentY = 0;
  private isDragging = false;
  private translateY = 0;

  constructor(
    public player: PlayerService,
    public notification: NotificationService,
    private sound: SoundService
  ) {
    this.selectedOutfit =
      OUTFITS.find((o) => o.id === player.equipped[0]) ?? OUTFITS[0];
  }

  // ---------- CLOSE ----------

  closeWithAnimation() {
    this.sound.play('button', 0.5);
    this.isClosing = true;

    setTimeout(() => {
      this.isClosing = false;
      this.isOpen = false;
      this.close.emit();
    }, 320);
  }

  // ---------- SWIPE SYSTEM ----------

  onTouchStart(e: TouchEvent) {
    if (!this.scrollContainer) return;

    const scrollTop = this.scrollContainer.nativeElement.scrollTop;

    // ❗ nur wenn ganz oben
    if (scrollTop > 0) return;

    this.startY = e.touches[0].clientY;
    this.currentY = this.startY;
    this.isDragging = true;
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;

    this.currentY = e.touches[0].clientY;
    let diff = this.currentY - this.startY;

    if (diff < 0) return;

    // 🔥 Resistance (fühlt sich besser an)
    diff = diff * 0.7;

    this.translateY = diff;

    const modal = this.modalRef.nativeElement;
    modal.style.transform = `translateY(${diff}px)`;
  }

  onTouchEnd() {
    if (!this.isDragging) return;

    const modal = this.modalRef.nativeElement;

    if (this.translateY > 120) {
      this.closeWithAnimation();
    } else {
      modal.style.transition = 'transform 0.2s ease';
      modal.style.transform = 'translateY(0)';
    }

    this.isDragging = false;
    this.translateY = 0;
  }

  // ---------- GAME LOGIC ----------

  isUnlocked(id: string) {
    return this.player.unlocked.includes(id);
  }

  getOutfit(id: string): Outfit | undefined {
    return OUTFITS.find((o) => o.id === id);
  }

  preview(outfit: Outfit) {
    this.sound.play('button', 0.3);
    this.selectedOutfit = outfit;
    this.notification.markAsSeen(outfit.id);
  }

  equip() {
    if (!this.selectedOutfit) return;
    this.sound.play('button', 0.5);
    this.player.equip(this.selectedOutfit.id);
  }

  unequip(id: string) {
    this.sound.play('button', 0.5);
    this.player.equip(id);
  }
}