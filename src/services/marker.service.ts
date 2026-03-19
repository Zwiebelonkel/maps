// src/app/services/marker.service.ts

import { Injectable } from '@angular/core';
import { UserMarker } from '../../models/user-marker.model';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  private readonly STORAGE_KEY = 'user_markers';
  private markers: UserMarker[] = [];

  getAll(): UserMarker[] {
    return this.markers;
  }

  addMarker(marker: UserMarker) {
    this.markers.push(marker);
    this.save();
  }

  removeMarker(id: string) {
    this.markers = this.markers.filter(marker => marker.id !== id);
    this.save();
  }

  updateMarker(updatedMarker: UserMarker) {
    const index = this.markers.findIndex(marker => marker.id === updatedMarker.id);
    if (index !== -1) {
      this.markers[index] = updatedMarker;
      this.save();
    }
  }

  load() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;

    try {
      this.markers = JSON.parse(saved) as UserMarker[];
    } catch (error) {
      console.error('Fehler beim Laden der Marker:', error);
      this.markers = [];
    }
  }

  clear() {
    this.markers = [];
    this.save();
  }

  private save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.markers));
  }
}