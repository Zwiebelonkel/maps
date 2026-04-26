import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SessionStats {
  startTime: Date;
  endTime?: Date;
  distanceMeters: number;
  stepCount: number;
  tilesExplored: number;
  routePoints: [number, number][];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _active = false;
  private session: SessionStats | null = null;
  private lastPoint: [number, number] | null = null;

  isActive$ = new BehaviorSubject<boolean>(false);
  stats$ = new BehaviorSubject<SessionStats | null>(null);

  get isActive() { return this._active; }
  get snapshot() { return this.session; }

  start() {
    this._active = true;
    this.session = {
      startTime: new Date(),
      distanceMeters: 0,
      stepCount: 0,
      tilesExplored: 0,
      routePoints: [],
    };
    this.lastPoint = null;
    this.isActive$.next(true);
    this.stats$.next(this.session);
  }

  stop(): SessionStats {
    this._active = false;
    if (this.session) {
      this.session.endTime = new Date();
    }
    this.isActive$.next(false);
    const result = { ...this.session! };
    return result;
  }

  addPoint(lat: number, lng: number) {
    if (!this._active || !this.session) return;

    this.session.routePoints.push([lat, lng]);

    if (this.lastPoint) {
      this.session.distanceMeters += this.calculateDistance(
        this.lastPoint[0], this.lastPoint[1], lat, lng
      );
      this.session.stepCount = Math.round(this.session.distanceMeters / 0.78);
    }

    this.lastPoint = [lat, lng];
    this.stats$.next({ ...this.session });
  }

  addTiles(count: number) {
    if (!this._active || !this.session) return;
    this.session.tilesExplored += count;
    this.stats$.next({ ...this.session });
  }

  formatDuration(start: Date, end?: Date): string {
    const ms = (end || new Date()).getTime() - start.getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h.toFixed(2)}h ${m.toFixed(2)}m`;
    if (m > 0) return `${m.toFixed(2)}m ${s.toFixed(2)}s`;
    return `${s.toFixed(2)}s`;
  }

  formatDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${meters.toFixed(2)} m`;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
