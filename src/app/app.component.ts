import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import * as L from 'leaflet';
import { ShopComponent } from './components/shop/shop.component';
import { GAME_CONFIG } from './config/game.config';
import { RadiusUpgrade } from './config/game.config';

// FIX: Leaflet default icon paths
const iconRetinaUrl =
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl =
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = iconDefault;

// Models
interface MapTile {
  lat: number; // Tile-Zentrum
  lng: number; // Tile-Zentrum
  explored: boolean;
  exploredAt?: Date;
  gridX: number;
  gridY: number;
}

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface GridCoordinate {
  gridX: number;
  gridY: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ShopComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private map!: L.Map;
  private playerMarker!: L.Marker;
  private radiusCircle!: L.Circle;
  private fogLayer!: L.Polygon;
  private watchId: number | null = null;

  private exploredTiles = new Map<string, MapTile>();
  private lastAcceptedLocation: Location | null = null;
  private lastExploredGridKey: string | null = null;

  // UI State
  currentLocation: Location | null = null;
  totalCoins = 0;
  totalTilesExplored = 0;
  currentRadius = GAME_CONFIG.BASE_RADIUS;
  currentRadiusLevel = 1;
  isLoading = true;
  errorMessage = '';
  lastExploredCount = 0;
  showCoinAnimation = false;

  // Shop State
  isShopOpen = false;
  allUpgrades = GAME_CONFIG.RADIUS_UPGRADES;

  ngOnInit() {
    this.loadProgress();
    this.updateGameState();
    this.startGPSTracking();

    interval(3000)
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
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found!');
      return;
    }

    this.map = L.map('map', {
      center: [53.0793, 8.8017],
      zoom: 16,
      zoomControl: true,
      touchZoom: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      minZoom: 10,
      maxZoom: 19,
      // preferCanvas: true,
    } as L.MapOptions);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    if (this.currentLocation) {
      this.map.setView(
        [this.currentLocation.lat, this.currentLocation.lng],
        16,
      );
      this.updatePlayerPosition(this.currentLocation);
    }

    this.drawFogOfWar();
  }

  private async startGPSTracking() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird nicht unterstützt');
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      this.updateLocation(position);
      this.isLoading = false;

      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.updateLocation(pos),
        (error) => {
          console.error('GPS error:', error);
          this.errorMessage = `GPS-Fehler: ${error.message}`;
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        },
      );
    } catch (error: any) {
      this.errorMessage = `GPS-Fehler: ${error.message}. Bitte GPS aktivieren.`;
      this.isLoading = false;
      console.error('GPS error:', error);
    }
  }

  private stopGPSTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private updateLocation(position: GeolocationPosition) {
    const newLocation: Location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    // Schlechte GPS-Genauigkeit ignorieren
    if (
      newLocation.accuracy &&
      newLocation.accuracy > GAME_CONFIG.MAX_ACCEPTED_ACCURACY
    ) {
      return;
    }

    // Kleine GPS-Sprünge ignorieren
    if (this.lastAcceptedLocation) {
      const movedDistance = this.calculateDistance(
        this.lastAcceptedLocation.lat,
        this.lastAcceptedLocation.lng,
        newLocation.lat,
        newLocation.lng,
      );

      if (movedDistance < GAME_CONFIG.MIN_GPS_MOVEMENT) {
        return;
      }
    }

    this.lastAcceptedLocation = newLocation;
    this.currentLocation = newLocation;

    if (this.map) {
      this.updatePlayerPosition(newLocation);
      this.exploreCurrentArea(newLocation);
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
        iconAnchor: [10, 10],
      });

      this.playerMarker = L.marker(latLng, {
        icon: playerIcon,
        zIndexOffset: 1000,
      }).addTo(this.map);
    }

    if (this.radiusCircle) {
      this.radiusCircle.setLatLng(latLng);
      this.radiusCircle.setRadius(this.currentRadius);
    } else {
      this.radiusCircle = L.circle(latLng, {
        radius: this.currentRadius,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(this.map);
    }

    const bounds = this.map.getBounds();
    if (!bounds.contains(latLng)) {
      this.map.setView(latLng, 16);
    }
  }

  private exploreCurrentArea(location: Location) {
    const currentGrid = this.latLngToGrid(location.lat, location.lng);
    const currentGridKey = this.getTileKey(
      currentGrid.gridX,
      currentGrid.gridY,
    );

    // Wenn wir immer noch im selben Grid stehen, nicht erneut komplett rechnen
    if (this.lastExploredGridKey === currentGridKey) {
      return;
    }

    const newTiles = this.exploreTiles(location.lat, location.lng);

    if (newTiles > 0) {
      this.lastExploredCount = newTiles;
      this.showCoinAnimation = true;
      this.totalCoins += newTiles * GAME_CONFIG.COINS_PER_TILE;
      this.totalTilesExplored = this.exploredTiles.size;
      this.updateGameState();
      this.saveProgress();
      this.drawFogOfWar();

      setTimeout(() => (this.showCoinAnimation = false), 2000);
    }

    this.lastExploredGridKey = currentGridKey;
  }

  /**
   * Stabile Grid-Koordinaten aus echter GPS-Position
   */
  private latLngToGrid(lat: number, lng: number): GridCoordinate {
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos(this.toRad(lat));

    const xMeters = lng * metersPerLng;
    const yMeters = lat * metersPerLat;

    const gridX = Math.floor(xMeters / GAME_CONFIG.TILE_SIZE);
    const gridY = Math.floor(yMeters / GAME_CONFIG.TILE_SIZE);

    return { gridX, gridY };
  }

  /**
   * Tile-Zentrum aus Grid berechnen
   */
  private gridToTileCenter(
    gridX: number,
    gridY: number,
    referenceLat: number,
  ): { lat: number; lng: number } {
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos(this.toRad(referenceLat));

    const centerXMeters = (gridX + 0.5) * GAME_CONFIG.TILE_SIZE;
    const centerYMeters = (gridY + 0.5) * GAME_CONFIG.TILE_SIZE;

    const lng = centerXMeters / metersPerLng;
    const lat = centerYMeters / metersPerLat;

    return { lat, lng };
  }

  private getTileKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  private exploreTiles(centerLat: number, centerLng: number): number {
    let newTilesCount = 0;
    const tilesInRadius = Math.ceil(this.currentRadius / GAME_CONFIG.TILE_SIZE);
    const centerGrid = this.latLngToGrid(centerLat, centerLng);

    for (let dx = -tilesInRadius; dx <= tilesInRadius; dx++) {
      for (let dy = -tilesInRadius; dy <= tilesInRadius; dy++) {
        const gridX = centerGrid.gridX + dx;
        const gridY = centerGrid.gridY + dy;
        const key = this.getTileKey(gridX, gridY);

        // Bereits entdeckt
        if (this.exploredTiles.has(key)) {
          continue;
        }

        const tileCenter = this.gridToTileCenter(gridX, gridY, centerLat);

        // Distanz sauber zum Tile-Zentrum berechnen
        const distance = this.calculateDistance(
          centerLat,
          centerLng,
          tileCenter.lat,
          tileCenter.lng,
        );

        if (distance <= this.currentRadius) {
          this.exploredTiles.set(key, {
            lat: tileCenter.lat,
            lng: tileCenter.lng,
            explored: true,
            exploredAt: new Date(),
            gridX,
            gridY,
          });
          newTilesCount++;
        }
      }
    }

    return newTilesCount;
  }

  /**
   * Fog of War:
   * Ganze Welt dunkel, erkundete Tiles = Löcher
   */
  private drawFogOfWar() {
    if (!this.map) return;

    if (this.fogLayer) {
      this.map.removeLayer(this.fogLayer);
    }

    const worldBounds: L.LatLngExpression[] = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
    ];

    const holes: L.LatLngExpression[][] = [];

    const tiles = Array.from(this.exploredTiles.values()).slice(
      -GAME_CONFIG.MAX_TILES_RENDER,
    );

    for (const tile of tiles) {
      const metersPerLat = 111320;
      const metersPerLng = 111320 * Math.cos(this.toRad(tile.lat));

      const tileSizeLat = GAME_CONFIG.TILE_SIZE / metersPerLat;
      const tileSizeLng = GAME_CONFIG.TILE_SIZE / metersPerLng;

      const overlap = 0.00001;
      const south = tile.lat - tileSizeLat / 2 - overlap;
      const north = tile.lat + tileSizeLat / 2 + overlap;
      const west = tile.lng - tileSizeLng / 2 - overlap;
      const east = tile.lng + tileSizeLng / 2 + overlap;

      holes.push([
        [south, west],
        [south, east],
        [north, east],
        [north, west],
      ]);
    }

    this.fogLayer = L.polygon([worldBounds, ...holes], {
      stroke: false,
      fillColor: '#050505',
      fillOpacity: GAME_CONFIG.FOG_OPACITY,
      interactive: false,
      smoothFactor: 0,
    }).addTo(this.map);

    this.fogLayer.bringToFront();

    if (this.radiusCircle) {
      this.radiusCircle.bringToFront();
    }
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

  private updateGameState() {
    this.currentRadius =
      GAME_CONFIG.RADIUS_UPGRADES.find(
        (u) => u.level === this.currentRadiusLevel,
      )?.radius || GAME_CONFIG.BASE_RADIUS;

    // Radius Circle auf der Karte aktualisieren
    if (this.radiusCircle) {
      this.radiusCircle.setRadius(this.currentRadius);
    }
  }

  // Shop Methods
  toggleShop() {
    this.isShopOpen = !this.isShopOpen;
  }

  closeShop() {
    this.isShopOpen = false;
  }

  onPurchaseUpgrade(upgrade: RadiusUpgrade) {
    if (this.totalCoins >= upgrade.cost) {
      this.totalCoins -= upgrade.cost;
      this.currentRadiusLevel = upgrade.level;
      this.updateGameState();
      this.saveProgress();

      if (this.radiusCircle && this.currentLocation) {
        this.radiusCircle.setRadius(this.currentRadius);
      }

      if (this.currentLocation) {
        this.lastExploredGridKey = null;
        this.exploreCurrentArea(this.currentLocation);
      }
    }
  }

  centerOnPlayer() {
    if (this.currentLocation && this.map) {
      this.map.setView(
        [this.currentLocation.lat, this.currentLocation.lng],
        17,
      );
    }
  }

  resetGame() {
    if (confirm('Möchtest du wirklich deinen gesamten Fortschritt löschen?')) {
      localStorage.removeItem('map_explorer_progress');
      this.exploredTiles.clear();
      this.totalCoins = 0;
      this.totalTilesExplored = 0;
      this.currentRadiusLevel = 1;
      this.lastExploredGridKey = null;
      this.updateGameState();

      if (this.currentLocation) {
        this.updatePlayerPosition(this.currentLocation);
      }

      this.drawFogOfWar();
    }
  }

  private saveProgress() {
    const data = {
      totalCoins: this.totalCoins,
      exploredTiles: Array.from(this.exploredTiles.entries()),
      currentRadiusLevel: this.currentRadiusLevel,
      totalTilesExplored: this.totalTilesExplored,
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
