import { Component } from '@angular/core';
import { AscensionService } from '../../../services/ascension.service';

@Component({
  selector: 'app-ascension-panel',
  templateUrl: './ascension-panel.component.html',
  styleUrls: ['./ascension-panel.component.scss']
})
export class AscensionPanelComponent {
  isOpen = false;

  constructor(public ascension: AscensionService) {}

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  get progressPercent(): number {
    return (this.ascension.points / this.ascension.getPointsNeeded()) * 100;
  }
}