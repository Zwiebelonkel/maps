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
  private hideTimeout: any;

  show(loot: LootResult) {
    clearTimeout(this.hideTimeout);
    this.loot = loot;
    this.visible = true;
    this.hideTimeout = setTimeout(() => (this.visible = false), 2500);
  }
}
