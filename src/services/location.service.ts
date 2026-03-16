// services/location.service.ts
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

@Injectable({
  providedIn: "root",
})
export class LocationService {
  private locationSubject = new BehaviorSubject<Location | null>(null);
  public location$: Observable<Location | null> =
    this.locationSubject.asObservable();

  private watchId: number | null = null;
  private isTracking = false;

  constructor() {}

  /**
   * Startet GPS-Tracking
   */
  startTracking(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Geolocation wird von diesem Browser nicht unterstützt"),
        );
        return;
      }

      if (this.isTracking) {
        resolve();
        return;
      }

      // Erste Position sofort abrufen
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.updateLocation(position);
          this.isTracking = true;

          // Kontinuierliches Tracking starten
          this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.updateLocation(pos),
            (error) => console.error("Location error:", error),
            {
              enableHighAccuracy: true,
              maximumAge: 5000,
              timeout: 10000,
            },
          );

          resolve();
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      );
    });
  }

  /**
   * Stoppt GPS-Tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  /**
   * Gibt die aktuelle Position zurück
   */
  getCurrentLocation(): Location | null {
    return this.locationSubject.value;
  }

  /**
   * Aktualisiert die Location
   */
  private updateLocation(position: GeolocationPosition): void {
    const location: Location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
    this.locationSubject.next(location);
  }

  /**
   * Prüft ob Tracking aktiv ist
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }
}
