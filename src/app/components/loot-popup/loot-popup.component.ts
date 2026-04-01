import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LootResult } from '../../../services/loot.service';

@Component({
  selector: 'app-loot-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loot-popup.component.html',
  styleUrls: ['./loot-popup.component.scss'],
})
export class LootPopupComponent {
  loot: LootResult | null = null;
  visible = false;
  isClosing = false;

  private hideTimeout: any;

  show(loot: LootResult) {
    clearTimeout(this.hideTimeout);

    this.loot = loot;
    this.visible = true;
    this.isClosing = false;

    this.hideTimeout = setTimeout(() => {
      this.isClosing = true;

      setTimeout(() => {
        this.visible = false;
        this.isClosing = false;
      }, 180); // Dauer der Exit Animation
    }, 2300);
  }
}