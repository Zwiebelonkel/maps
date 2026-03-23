import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../../services/player.service';
import { OUTFITS, Outfit } from '../../config/player.config';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PlayerComponent {
  @Output() close = new EventEmitter<void>();

  outfits = OUTFITS;
  isOpen = true;
  isClosing = false;
  selectedOutfit: Outfit | null = null;

  constructor(public player: PlayerService) {
    this.selectedOutfit =
      OUTFITS.find((o) => o.id === player.equipped) ?? OUTFITS[0];
  }

  closeWithAnimation() {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.isOpen = false;
      this.close.emit();
    }, 320);
  }

  isUnlocked(id: string) {
    return this.player.unlocked.includes(id);
  }

  preview(outfit: Outfit) {
    this.selectedOutfit = outfit;
  }

  equip() {
    if (!this.selectedOutfit || !this.isUnlocked(this.selectedOutfit.id))
      return;
    this.player.equip(this.selectedOutfit.id);
  }
}
