import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-burger-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './burger-menu.component.html',
  styleUrls: ['./burger-menu.component.scss'],
})
export class BurgerMenuComponent {
  @Output() close = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() toggleSession = new EventEmitter<void>();
  @Output() openMarkers = new EventEmitter<void>();
}