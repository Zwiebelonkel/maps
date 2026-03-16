import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private locationSubject = new BehaviorSubject<Location | null>(null);
  public location$: Observable<Location | null> =
    this.locationSubject.asObservable();

  private watchId: number | null = null;
  private isTracking = false;
  private lastAcceptedLocation: Location | null = null;

  // Kleine GPS-Sprünge ignorieren
  private readonly MIN_DISTANCE_CHANGE = 5; // Meter

  constructor() {}

  startTracking(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error('Geolocation wird von diesem Browser nicht unterstützt'),
        );
        return;
      }

      if (this.isTracking) {
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.updateLocation(position);
          this.isTracking = true;

          this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.updateLocation(pos),
            (error) => console.error('Location error:', error),
            {
              enableHighAccuracy: true,
              maximumAge: 5000,
              timeout: 10000,
            },
          );

          resolve();
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      );
    });
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  getCurrentLocation(): Location | null {
    return this.locationSubject.value;
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }

  private updateLocation(position: GeolocationPosition): void {
    const location: Location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    // Schlechte Genauigkeit ignorieren
    if (location.accuracy && location.accuracy > 50) {
      return;
    }

    if (this.lastAcceptedLocation) {
      const distance = this.calculateDistance(
        this.lastAcceptedLocation.lat,
        this.lastAcceptedLocation.lng,
        location.lat,
        location.lng,
      );

      if (distance < this.MIN_DISTANCE_CHANGE) {
        return;
      }
    }

    this.lastAcceptedLocation = location;
    this.locationSubject.next(location);
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}