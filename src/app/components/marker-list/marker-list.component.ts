import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkerService } from '../../../services/marker.service';
import { UserMarker } from '../../../../models/user-marker.model';

@Component({
  selector: 'app-marker-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marker-list.component.html',
  styleUrls: ['./marker-list.component.scss'],
})
export class MarkerListComponent {
  constructor(public markerService: MarkerService) {}

  delete(marker: UserMarker) {
    this.markerService.removeMarker(marker.id);
  }
}