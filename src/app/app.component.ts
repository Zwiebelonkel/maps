import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import * as L from 'leaflet';

// Models
interface MapTile {
  lat: number;
  lng: number;
  explored: boolean;
  exploredAt?: Date;
}

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface RadiusUpgrade {
  level: number;
  radius: number;
  cost: number;
  description: string;
}

// Game Config - KLEINERE KACHELN (10m statt 25m)
const GAME_CONFIG = {
  TILE_SIZE: 10,           // 10 Meter pro Kachel - jetzt sieht man den Weg!
  COINS_PER_TILE: 5,       // Weniger Coins weil mehr Kacheln
  BASE_RADIUS: 50,
  RADIUS_UPGRADES: [
    { level: 1, radius: 50, cost: 0, description: 'Start' },
    { level: 2, radius: 75, cost: 500, description: 'Explorer' },
    { level: 3, radius: 100, cost: 1500, description: 'Adventurer' },
    { level: 4, radius: 150, cost: 5000, description: 'Pathfinder' },
    { level: 5, radius: 200, cost: 15000, description: 'Master Explorer' },
    { level: 6, radius: 300, cost: 50000, description: 'Legend' }
  ] as RadiusUpgrade[]
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private map!: L.Map;
  private playerMarker!: L.Marker;
  private radiusCircle!: L.Circle;
  private exploredLayerGroup!: L.LayerGroup;
  private watchId: number | null = null;
  private exploredTiles = new Map<string, MapTile>();

  // UI State
  currentLocation: Location | null = null;
  totalCoins = 0;
  totalTilesExplored = 0;
  currentRadius = GAME_CONFIG.BASE_RADIUS;
  currentRadiusLevel = 1;
  nextUpgrade: RadiusUpgrade | null = null;
  isLoading = true;
  errorMessage = '';
  lastExploredCount = 0;
  showCoinAnimation = false;

  ngOnInit() {
    this.loadProgress();
    this.updateGameState();
    this.startGPSTracking();
    
    // Auto-explore every 2 seconds
    interval(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.currentLocation) {
          this.exploreCurrentArea(this.currentLocation);
        }
      });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopGPSTracking();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    // Leaflet Map mit TOUCH SUPPORT
    this.map = L.map('map', {
      center: [51.1657, 10.4515],
      zoom: 15,
      zoomControl: true,
      
      // MOBILE TOUCH OPTIMIERUNGEN
      tap: true,                    // Touch-Events aktivieren
      touchZoom: true,              // Pinch-to-Zoom
      dragging: true,               // Touch-Dragging
      scrollWheelZoom: true,        // Scroll-Zoom
      doubleClickZoom: true,        // Doppelklick-Zoom
      boxZoom: true,                // Box-Zoom
      keyboard: true,               // Keyboard Navigation
      
      // Touch-Verzögerung reduzieren
      tapTolerance: 15,             // Pixel-Toleranz für Tap
      
      // Inertia für smoothes Scrollen
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 1500,
      
      // Zoom-Grenzen
      minZoom: 10,
      maxZoom: 19
    });

    // OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Layer Group für Kacheln
    this.exploredLayerGroup = L.layerGroup().addTo(this.map);

    // Fix für Mobile: Map invalidate nach kurzer Verzögerung
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    if (this.currentLocation) {
      this.updatePlayerPosition(this.currentLocation);
      this.drawExploredTiles();
    }
  }

  private async startGPSTracking() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird nicht unterstützt');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      this.updateLocation(position);
      this.isLoading = false;

      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.updateLocation(pos),
        (error) => console.error('GPS error:', error),
        { 
          enableHighAccuracy: true, 
          maximumAge: 5000, 
          timeout: 10000 
        }
      );
    } catch (error: any) {
      this.errorMessage = `GPS-Fehler: ${error.message}`;
      this.isLoading = false;
    }
  }

  private stopGPSTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private updateLocation(position: GeolocationPosition) {
    this.currentLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    if (this.map) {
      this.updatePlayerPosition(this.currentLocation);
      this.exploreCurrentArea(this.currentLocation);
    }
  }

  private updatePlayerPosition(location: Location) {
    const latLng = L.latLng(location.lat, location.lng);

    if (this.playerMarker) {
      this.playerMarker.setLatLng(latLng);
    } else {
      const playerIcon = L.divIcon({
        className: 'player-marker',
        html: '<div class="player-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      this.playerMarker = L.marker(latLng, { icon: playerIcon }).addTo(this.map);
    }

    if (this.radiusCircle) {
      this.radiusCircle.setLatLng(latLng);
      this.radiusCircle.setRadius(this.currentRadius);
    } else {
      this.radiusCircle = L.circle(latLng, {
        radius: this.currentRadius,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(this.map);
    }

    // Zentriere nur beim ersten Mal
    if (!this.map.getBounds().contains(latLng)) {
      this.map.setView(latLng, this.map.getZoom());
    }
  }

  private exploreCurrentArea(location: Location) {
    const newTiles = this.exploreTiles(location.lat, location.lng);
    
    if (newTiles > 0) {
      this.lastExploredCount = newTiles;
      this.showCoinAnimation = true;
      this.totalCoins += newTiles * GAME_CONFIG.COINS_PER_TILE;
      this.totalTilesExplored = this.exploredTiles.size;
      this.updateGameState();
      this.saveProgress();
      this.drawExploredTiles();
      
      setTimeout(() => this.showCoinAnimation = false, 2000);
    }
  }

  private exploreTiles(centerLat: number, centerLng: number): number {
    let newTilesCount = 0;
    const tilesInRadius = Math.ceil(this.currentRadius / GAME_CONFIG.TILE_SIZE);
    const centerGrid = this.latLngToGrid(centerLat, centerLng);

    for (let x = -tilesInRadius; x <= tilesInRadius; x++) {
      for (let y = -tilesInRadius; y <= tilesInRadius; y++) {
        const gridX = centerGrid.gridX + x;
        const gridY = centerGrid.gridY + y;
        const key = `${gridX},${gridY}`;

        // Konvertiere Grid zurück zu Lat/Lng
        const tileLatLng = this.gridToLatLng(gridX, gridY, centerLat);
        const distance = this.calculateDistance(centerLat, centerLng, tileLatLng.lat, tileLatLng.lng);

        if (distance <= this.currentRadius && !this.exploredTiles.has(key)) {
          this.exploredTiles.set(key, {
            lat: tileLatLng.lat,
            lng: tileLatLng.lng,
            explored: true,
            exploredAt: new Date()
          });
          newTilesCount++;
        }
      }
    }

    return newTilesCount;
  }

  private drawExploredTiles() {
    if (!this.map) return;
    
    this.exploredLayerGroup.clearLayers();
    const tileSize = GAME_CONFIG.TILE_SIZE;
    
    // Berechne Offsets basierend auf aktueller Position
    const centerLat = this.currentLocation?.lat || 51.1657;
    const latDegreeInMeters = 111320;
    const lngDegreeInMeters = 111320 * Math.cos(centerLat * Math.PI / 180);
    
    const latOffset = tileSize / latDegreeInMeters;
    const lngOffset = tileSize / lngDegreeInMeters;
    
    this.exploredTiles.forEach(tile => {
      const bounds: L.LatLngBoundsExpression = [
        [tile.lat, tile.lng],
        [tile.lat + latOffset, tile.lng + lngOffset]
      ];

      const rectangle = L.rectangle(bounds, {
        color: '#00FF00',
        weight: 1,
        opacity: 0.5,
        fillColor: '#00FF00',
        fillOpacity: 0.3,
        // WICHTIG: Interactive false - verhindert dass Kacheln Touch blockieren
        interactive: false
      });

      this.exploredLayerGroup.addLayer(rectangle);
    });
  }

  /**
   * Konvertiert GPS-Koordinaten zu Grid-Koordinaten
   * KORRIGIERTE VERSION - berücksichtigt Breitengrad-Kompression
   */
  private latLngToGrid(lat: number, lng: number): { gridX: number; gridY: number } {
    const latDegreeInMeters = 111320;
    const lngDegreeInMeters = 111320 * Math.cos(lat * Math.PI / 180);
    
    return {
      gridX: Math.floor(lng * lngDegreeInMeters / GAME_CONFIG.TILE_SIZE),
      gridY: Math.floor(lat * latDegreeInMeters / GAME_CONFIG.TILE_SIZE)
    };
  }

  /**
   * Konvertiert Grid-Koordinaten zurück zu GPS
   * NEUE FUNKTION - für korrekte Kachel-Positionierung
   */
  private gridToLatLng(gridX: number, gridY: number, refLat: number): { lat: number; lng: number } {
    const latDegreeInMeters = 111320;
    const lngDegreeInMeters = 111320 * Math.cos(refLat * Math.PI / 180);
    
    return {
      lat: gridY * GAME_CONFIG.TILE_SIZE / latDegreeInMeters,
      lng: gridX * GAME_CONFIG.TILE_SIZE / lngDegreeInMeters
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private updateGameState() {
    this.currentRadius = GAME_CONFIG.RADIUS_UPGRADES.find(u => u.level === this.currentRadiusLevel)?.radius || GAME_CONFIG.BASE_RADIUS;
    this.nextUpgrade = GAME_CONFIG.RADIUS_UPGRADES.find(u => u.level === this.currentRadiusLevel + 1) || null;
  }

  buyUpgrade() {
    if (this.nextUpgrade && this.totalCoins >= this.nextUpgrade.cost) {
      this.totalCoins -= this.nextUpgrade.cost;
      this.currentRadiusLevel = this.nextUpgrade.level;
      this.updateGameState();
      this.saveProgress();
      
      if (this.radiusCircle && this.currentLocation) {
        this.radiusCircle.setRadius(this.currentRadius);
      }
    }
  }

  centerOnPlayer() {
    if (this.currentLocation && this.map) {
      this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 18);
    }
  }

  resetGame() {
    if (confirm('Möchtest du wirklich deinen gesamten Fortschritt löschen?')) {
      localStorage.removeItem('map_explorer_progress');
      this.exploredTiles.clear();
      this.totalCoins = 0;
      this.totalTilesExplored = 0;
      this.currentRadiusLevel = 1;
      this.updateGameState();
      this.exploredLayerGroup.clearLayers();
    }
  }

  private saveProgress() {
    const data = {
      totalCoins: this.totalCoins,
      exploredTiles: Array.from(this.exploredTiles.entries()),
      currentRadiusLevel: this.currentRadiusLevel,
      totalTilesExplored: this.totalTilesExplored
    };
    localStorage.setItem('map_explorer_progress', JSON.stringify(data));
  }

  private loadProgress() {
    const saved = localStorage.getItem('map_explorer_progress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.totalCoins = data.totalCoins || 0;
        this.exploredTiles = new Map(data.exploredTiles || []);
        this.currentRadiusLevel = data.currentRadiusLevel || 1;
        this.totalTilesExplored = data.totalTilesExplored || 0;
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }
  }
}
