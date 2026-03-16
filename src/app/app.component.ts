import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import * as L from 'leaflet';
import { ShopComponent } from './components/shop/shop.component';

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

export interface RadiusUpgrade {
  level: number;
  radius: number;
  cost: number;
  description: string;
}

// Game Config
const GAME_CONFIG = {
  TILE_SIZE: 10,
  COINS_PER_TILE: 5,
  BASE_RADIUS: 50,
  MAX_TILES_RENDER: 500,
  RADIUS_UPGRADES: [
    { level: 1, radius: 50, cost: 0, description: 'Beginner' },
    { level: 2, radius: 75, cost: 500, description: 'Explorer' },
    { level: 3, radius: 100, cost: 1500, description: 'Adventurer' },
    { level: 4, radius: 150, cost: 5000, description: 'Pathfinder' },
    { level: 5, radius: 200, cost: 15000, description: 'Master Explorer' },
    { level: 6, radius: 300, cost: 50000, description: 'Legend' },
  ] as RadiusUpgrade[],
};

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
  private exploredLayerGroup!: L.LayerGroup;
  private watchId: number | null = null;
  private exploredTiles = new Map<string, MapTile>();

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
      preferCanvas: true,
    } as L.MapOptions);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    this.exploredLayerGroup = L.layerGroup().addTo(this.map);

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
      this.drawExploredTiles();
    }
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
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(this.map);
    }

    const bounds = this.map.getBounds();
    if (!bounds.contains(latLng)) {
      this.map.setView(latLng, 16);
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

      setTimeout(() => (this.showCoinAnimation = false), 2000);
    }
  }

  private exploreTiles(centerLat: number, centerLng: number): number {
    let newTilesCount = 0;
    const tileSize = GAME_CONFIG.TILE_SIZE;
    const tilesInRadius = Math.ceil(this.currentRadius / tileSize);

    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

    const tileSizeLat = tileSize / metersPerDegreeLat;
    const tileSizeLng = tileSize / metersPerDegreeLng;

    for (let dx = -tilesInRadius; dx <= tilesInRadius; dx++) {
      for (let dy = -tilesInRadius; dy <= tilesInRadius; dy++) {
        const tileLat = centerLat + dy * tileSizeLat;
        const tileLng = centerLng + dx * tileSizeLng;

        const distance = this.calculateDistance(
          centerLat,
          centerLng,
          tileLat,
          tileLng,
        );

        if (distance <= this.currentRadius) {
          const key = `${tileLat.toFixed(6)},${tileLng.toFixed(6)}`;

          if (!this.exploredTiles.has(key)) {
            this.exploredTiles.set(key, {
              lat: tileLat,
              lng: tileLng,
              explored: true,
              exploredAt: new Date(),
            });
            newTilesCount++;
          }
        }
      }
    }

    return newTilesCount;
  }

  private drawExploredTiles() {
    if (!this.map) return;

    this.exploredLayerGroup.clearLayers();

    const tileSize = GAME_CONFIG.TILE_SIZE;
    const centerLat = this.currentLocation?.lat || 53.0793;

    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

    const tileSizeLat = tileSize / metersPerDegreeLat;
    const tileSizeLng = tileSize / metersPerDegreeLng;

    const tiles = Array.from(this.exploredTiles.values());
    const tilesToDraw = tiles.slice(-GAME_CONFIG.MAX_TILES_RENDER);

    tilesToDraw.forEach((tile) => {
      const bounds: L.LatLngBoundsExpression = [
        [tile.lat, tile.lng],
        [tile.lat + tileSizeLat, tile.lng + tileSizeLng],
      ];

      const rectangle = L.rectangle(bounds, {
        color: '#00FF00',
        weight: 1,
        opacity: 0.4,
        fillColor: '#00FF00',
        fillOpacity: 0.25,
        interactive: false,
      });

      this.exploredLayerGroup.addLayer(rectangle);
    });
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
  }

  // Shop Methods
  toggleShop() {
    this.isShopOpen = !this.isShopOpen;
    console.log('Shop toggled:', this.isShopOpen);
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

      // Optional: Close shop after purchase
      // this.closeShop();
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
      this.updateGameState();
      this.exploredLayerGroup.clearLayers();
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
