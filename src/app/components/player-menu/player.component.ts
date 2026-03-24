import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../../services/player.service';
import { OUTFITS, Outfit } from '../../config/player.config';
import { SoundService } from '../../../services/sound.service';

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

  constructor(
    public player: PlayerService,
    private sound: SoundService,
  ) {
    this.selectedOutfit =
      OUTFITS.find((o) => o.id === player.equipped[0]) ?? OUTFITS[0];
  }

  closeWithAnimation() {
    this.sound.play('button', 0.5);
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

  getOutfit(id: string): Outfit | undefined {
    return OUTFITS.find((o) => o.id === id);
  }

  preview(outfit: Outfit) {
    this.sound.play('button', 0.3);
    this.selectedOutfit = outfit;
  }

  equip() {
    if (!this.selectedOutfit || !this.isUnlocked(this.selectedOutfit.id))
      return;
    this.sound.play('button', 0.5);
    this.player.equip(this.selectedOutfit.id);
  }

  unequip(id: string) {
    if (this.player.equipped.length > 1) {
      this.sound.play('button', 0.5);
      this.player.equip(id);
    }
  }
}
