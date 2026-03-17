import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  isOpen = false;

  get maxRenderTiles() {
    return this.settings.snapshot.maxRenderTiles;
  }

  constructor(public settings: SettingsService) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  updateMaxRenderTiles(val: number) {
    this.settings.update({ maxRenderTiles: val });
  }

  reset() {
    this.settings.reset();
  }
}
