import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import * as L from 'leaflet';
import { ShopComponent } from './components/shop/shop.component';
import { LootPopupComponent } from './components/loot-popup/loot-popup.component';
import { SettingsComponent } from './components/settings/settings.component';
import {
  GAME_CONFIG,
  RadiusUpgrade,
  ClickUpgrade,
  ShopItem,
} from './config/game.config';
import { UpgradeService } from '../services/upgrade.service';
import { LootService, LootResult } from '../services/loot.service';
import { SettingsService } from '../services/settings.service';
import { ProgressionService } from '../services/progression.service';

import { SessionService, SessionStats } from '../services/session.service';
import { SessionSummaryComponent } from './components/session-summary/session-summary.component';
import { BurgerMenuComponent } from './components/burger-menu/burger-menu.component';
import { MarkerListComponent } from './components/marker-list/marker-list.component';
import { PlayerComponent } from './components/player-menu/player.component';
import { LootboxComponent } from './components/lootbox/lootbox.component';
import { MarkerService } from '../services/marker.service';
import { PlayerService } from '../services/player.service';
import { SoundService } from '../services/sound.service';
import { UserMarker } from '../../models/user-marker.model';
import { OUTFITS } from './config/player.config';

import { InventoryComponent } from './components/inventory/inventory.component';
import { InventoryService } from '../services/inventory.service';


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

interface MapTile {
  lat: number;
  lng: number;
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
  imports: [
    CommonModule,
    ShopComponent,
    LootPopupComponent,
    SettingsComponent,
    SessionSummaryComponent,
    BurgerMenuComponent, // ✅ hinzufügen
    MarkerListComponent, // ✅ hinzufügen
    PlayerComponent,
    LootboxComponent,
    InventoryComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(LootPopupComponent) lootPopup!: LootPopupComponent;

  private destroy$ = new Subject<void>();
  private map!: L.Map;
  private playerMarker!: L.Marker;
  private leafletUserMarkers: L.Marker[] = [];
  private radiusCircle!: L.Circle;
  private fogLayer!: L.Polygon;
  private watchId: number | null = null;
  private lastTap = 0;

  private exploredTiles = new Map<string, MapTile>();
  private lastAcceptedLocation: Location | null = null;
  private lastExploredGridKey: string | null = null;

  // UI State
  currentLocation: Location | null = null;
  totalCoins = 0;
  totalTilesExplored = 0;
  isLoading = true;
  errorMessage = '';
  lastExploredCount = 0;
  showCoinAnimation = false;
  coinsPerTile = GAME_CONFIG.COINS_PER_TILE;
  flashActive = false;
  private tileLayer!: L.TileLayer;
  isMenuOpen = false;
  isMarkerListOpen = false;
  isLootboxOpen = false;

  // Shop / Bomb
  isShopOpen = false;
  isSettingsOpen = false;
  isPlayerOpen = false;
  isInventoryOpen = false;

  activeBombItem: ShopItem | null = null;

  // Session
  showSessionSummary = false;
  sessionSummaryStats: SessionStats | null = null;
  sessionMapImageUrl: string | null = null;
  private routePolyline: L.Polyline | null = null;

  get currentRadius() {
    return this.upgradeService.snapshot.currentRadius;
  }
  get currentRadiusLevel() {
    return this.upgradeService.snapshot.currentRadiusLevel;
  }
  get currentClickLevel() {
    return this.upgradeService.snapshot.currentClickLevel;
  }
  get coinsPerClick() {
    return this.upgradeService.snapshot.coinsPerClick;
  }

  constructor(
    private upgradeService: UpgradeService,
    private lootService: LootService,
    public settingsService: SettingsService,
    public sessionService: SessionService,
    private markerService: MarkerService,
    public playerService: PlayerService,
    public progressionService: ProgressionService,
    private soundService: SoundService,
    private inventoryService: InventoryService,
  ) {}

  // ── Vibration ───────────────────────────────────────────────

  private vibrate(pattern: number | number[]) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ── Flash ───────────────────────────────────────────────────

  private triggerFlash(rarity: string) {
    this.flashActive = true;
    if (rarity === 'epic') this.vibrate([100, 50, 200, 50, 300]);
    else if (rarity === 'rare') this.vibrate([80, 40, 120]);
    else this.vibrate(40);
    setTimeout(() => (this.flashActive = false), 200);
  }

  // Session starten/stoppen
  toggleSession() {
    if (this.sessionService.isActive) {
      this.stopSession();
    } else {
      this.startSession();
    }
  }

  private startSession() {
    this.sessionService.start();

    this.routePolyline = L.polyline([], {
      color: '#4da3ff',
      weight: 5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    } as any).addTo(this.map);

    // Start-Marker
    if (this.currentLocation) {
      L.circleMarker([this.currentLocation.lat, this.currentLocation.lng], {
        radius: 8,
        color: '#00e676',
        fillColor: '#00e676',
        fillOpacity: 1,
        weight: 2,
      }).addTo(this.map);
    }
  }

  focusMarker(marker: UserMarker) {
    this.isMarkerListOpen = false;

    if (!this.map) return;

    const target = L.latLng(marker.lat, marker.lng);

    this.map.flyTo(target, 19, {
      duration: 1.2,
    });

    const matchingMarker = this.leafletUserMarkers.find(
      (leafletMarker: any) => {
        const pos = leafletMarker.getLatLng();
        return pos.lat === marker.lat && pos.lng === marker.lng;
      },
    );

    if (matchingMarker) {
      setTimeout(() => {
        matchingMarker.openPopup();
      }, 1300);
    }
  }

  private stopSession() {
    const stats = this.sessionService.stop();
    this.sessionSummaryStats = stats;

    // Karte auf Route zoomen
    if (this.routePolyline) {
      const bounds = this.routePolyline.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    // Fog kurz ausblenden für Screenshot
    if (this.fogLayer) {
      this.map.removeLayer(this.fogLayer);
    }

    // Warten damit fitBounds und Render fertig sind
    setTimeout(() => {
      try {
        const mapContainer = document.getElementById('map');
        const canvas = mapContainer?.querySelector('canvas');
        if (canvas) {
          this.sessionMapImageUrl = canvas.toDataURL('image/png');
        } else {
          this.sessionMapImageUrl = null;
        }
      } catch (e) {
        this.sessionMapImageUrl = null;
      }

      // Fog wieder hinzufügen
      this.drawFogOfWar();

      // Popup zeigen
      this.showSessionSummary = true;

      // Polyline entfernen
      if (this.routePolyline) {
        this.map.removeLayer(this.routePolyline);
        this.routePolyline = null;
      }
    }, 500);
  }

  closeSessionSummary() {
    this.showSessionSummary = false;
    this.sessionSummaryStats = null;
    this.sessionMapImageUrl = null;
  }

  // ── Power Save ──────────────────────────────────────────────

  handleTap() {
    const now = Date.now();
    if (now - this.lastTap < 300) {
      this.settingsService.update({ powerSave: false });
    }
    this.lastTap = now;
  }

  // ── Lifecycle ───────────────────────────────────────────────

  ngOnInit() {
  this.markerService.load();
  this.loadProgress();
  this.updateGameState();
  this.startGPSTracking();

  interval(3000)
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      if (this.currentLocation)
        this.exploreCurrentArea(this.currentLocation);
    });

  // 🟣 AUTCLICKER
  interval(1000)
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      if (this.playerService.hasAutoClicker()) {
        this.handleAutoClick();
      }
    });
}

  ngAfterViewInit() {
    (window as any).deleteUserMarker = (id: string) => {
      this.markerService.removeMarker(id);
      this.renderAllUserMarkers();
    };

    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopGPSTracking();
    if (this.map) this.map.remove();
  }

  // ── Map ─────────────────────────────────────────────────────

  private initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    this.map = L.map('map', {
      center: [53.0793, 8.8017],
      zoom: 16,
      zoomControl: false,
      touchZoom: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      minZoom: 10,
      maxZoom: 25,
      preferCanvas: true,
    } as L.MapOptions);

    this.tileLayer = this.createTileLayer();
    this.tileLayer.addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.activeBombItem) {
        this.soundService.play('bomb');
        this.detonateBomb(e.latlng, this.activeBombItem);
        this.activeBombItem = null;
        document.getElementById('map')!.style.cursor = '';
        return;
      }

      if (this.isTileExplored(e.latlng.lat, e.latlng.lng)) {
        this.createUserMarker(e.latlng);
        return;
      }

      this.addClickCoins();
      this.showCoin(e.originalEvent as MouseEvent);
    });

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 200);

    if (this.currentLocation) {
      this.map.setView(
        [this.currentLocation.lat, this.currentLocation.lng],
        16,
      );
      this.updatePlayerPosition(this.currentLocation);
    }

    this.drawFogOfWar();
    this.renderAllUserMarkers();
  }

  private renderAllUserMarkers() {
    this.leafletUserMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.leafletUserMarkers = [];

    this.markerService.getAll().forEach((marker) => {
      this.renderUserMarker(marker);
    });
  }

  private isTileExplored(lat: number, lng: number): boolean {
    const grid = this.latLngToGrid(lat, lng);
    const key = this.getTileKey(grid.gridX, grid.gridY);
    return this.exploredTiles.has(key);
  }

  private createUserMarker(latlng: L.LatLng) {
    const name = prompt('Name für den Marker:');
    if (!name || !name.trim()) return;

    const description = prompt('Beschreibung für den Marker:') || '';

    const marker: UserMarker = {
      id: crypto.randomUUID(),
      lat: latlng.lat,
      lng: latlng.lng,
      name: name.trim(),
      description: description.trim(),
      createdAt: Date.now(),
    };

    this.markerService.addMarker(marker);
    this.renderAllUserMarkers();
  }

  private renderUserMarker(marker: UserMarker) {
    const leafletMarker = L.marker([marker.lat, marker.lng], {
      icon: L.divIcon({
        className: 'user-marker',
        html: '<div class="user-marker-pin">📍</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      }),
    }).addTo(this.map);

    leafletMarker.bindPopup(`
  <div class="marker-popup">
    <div class="popup-title">
      ${this.escapeHtml(marker.name)}
    </div>

    <div class="popup-desc">
      ${this.escapeHtml(marker.description || 'Keine Beschreibung')}
    </div>

    <div class="popup-actions">
      <button class="popup-btn delete"
        onclick="window.deleteUserMarker('${marker.id}')">
        Löschen
      </button>
    </div>
  </div>
`);

    this.leafletUserMarkers.push(leafletMarker);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private createTileLayer(): L.TileLayer {
    if (this.settingsService.snapshot.darkMap) {
      return L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap & CartoDB',
          subdomains: 'abcd',
          maxZoom: 25,
        },
      );
    } else {
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 25,
      });
    }
  }

  onDarkMapChanged(darkMap: boolean) {
    if (!this.map) return;
    this.map.removeLayer(this.tileLayer);
    this.tileLayer = this.createTileLayer();
    this.tileLayer.addTo(this.map);
    this.tileLayer.bringToBack();
  }

  // ── Bomb ────────────────────────────────────────────────────

  private detonateBomb(latlng: L.LatLng, item: ShopItem) {
    const radius = item.bombRadius || 50;
    this.vibrate([100, 50, 200, 50, 300]);

    // allowLoot = false → kein Loot bei Bomben
    const newTiles = this.exploreTiles(latlng.lat, latlng.lng, radius, false);

    const color =
      item.id === 'bomb_mega'
        ? '#ff4400'
        : item.id === 'bomb_medium'
          ? '#ff8800'
          : item.id === 'bomb_ultra'
            ? '#00e676'
            : '#ffd700';

    const explosion = L.circle(latlng, {
      radius,
      color,
      fillColor: color,
      fillOpacity: 0.4,
      weight: 3,
    }).addTo(this.map);
    setTimeout(() => this.map.removeLayer(explosion), 1000);

    if (newTiles > 0) {
      this.totalCoins +=
        newTiles *
        GAME_CONFIG.COINS_PER_TILE *
        this.playerService.getCoinMultiplier();
      this.totalTilesExplored = this.exploredTiles.size;
      this.lastExploredCount = newTiles;
      this.showCoinAnimation = true;
      setTimeout(() => (this.showCoinAnimation = false), 2000);
      this.updateGameState();
      this.saveProgress();
      this.drawFogOfWar();
    }
  }

  // ── GPS ─────────────────────────────────────────────────────

  private async startGPSTracking() {
    try {
      if (!navigator.geolocation)
        throw new Error('Geolocation wird nicht unterstützt');

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
          this.errorMessage = `GPS-Fehler: ${error.message}`;
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    } catch (error: any) {
      this.errorMessage = `GPS-Fehler: ${error.message}. Bitte GPS aktivieren.`;
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
    const newLocation: Location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    if (
      newLocation.accuracy &&
      newLocation.accuracy > GAME_CONFIG.MAX_ACCEPTED_ACCURACY
    )
      return;

    if (this.lastAcceptedLocation) {
      const moved = this.calculateDistance(
        this.lastAcceptedLocation.lat,
        this.lastAcceptedLocation.lng,
        newLocation.lat,
        newLocation.lng,
      );
      if (moved < GAME_CONFIG.MIN_GPS_MOVEMENT) return;
    }

    this.lastAcceptedLocation = newLocation;
    this.currentLocation = newLocation;

    // Session Punkt hinzufügen
    this.sessionService.addPoint(newLocation.lat, newLocation.lng);

    // Route auf Karte zeichnen
    if (this.routePolyline) {
      this.routePolyline.addLatLng(L.latLng(newLocation.lat, newLocation.lng));
    }

    if (this.map) {
      this.updatePlayerPosition(newLocation);
      this.exploreCurrentArea(newLocation);
    }
  }

  // ── Player ──────────────────────────────────────────────────

  private updatePlayerPosition(location: Location) {
    const latLng = L.latLng(location.lat, location.lng);
    const effectiveRadius =
      this.currentRadius * this.playerService.getRadiusMultiplier();

    if (this.playerMarker) {
      this.playerMarker.setLatLng(latLng);
    } else {
      const playerIcon = L.divIcon({
        className: 'player-marker',
        html: '<div class="player-dot"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      this.playerMarker = L.marker(latLng, {
        icon: playerIcon,
        zIndexOffset: 1000,
      }).addTo(this.map);
    }

    if (this.radiusCircle) {
      this.radiusCircle.setLatLng(latLng);
      this.radiusCircle.setRadius(effectiveRadius);
    } else {
      this.radiusCircle = L.circle(latLng, {
        radius: effectiveRadius,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(this.map);
    }

    const bounds = this.map.getBounds();
    if (!bounds.contains(latLng)) this.map.setView(latLng, 16);
  }
  // ── Exploration ─────────────────────────────────────────────

  private exploreCurrentArea(location: Location) {
    const currentGrid = this.latLngToGrid(location.lat, location.lng);
    const currentGridKey = this.getTileKey(
      currentGrid.gridX,
      currentGrid.gridY,
    );
    if (this.lastExploredGridKey === currentGridKey) return;

    // Radius-Multiplier vom Outfit anwenden
    const effectiveRadius =
      this.currentRadius * this.playerService.getRadiusMultiplier();
    const newTiles = this.exploreTiles(
      location.lat,
      location.lng,
      effectiveRadius,
    );

    if (newTiles > 0) {
      this.vibrate(40);
      this.lastExploredCount = newTiles;
      this.showCoinAnimation = true;
      this.totalCoins +=
        newTiles *
        GAME_CONFIG.COINS_PER_TILE *
        this.playerService.getCoinMultiplier();
      this.totalTilesExplored = this.exploredTiles.size;
      this.sessionService.addTiles(newTiles);
      const leveledUp = this.progressionService.addXP(
        newTiles *
          GAME_CONFIG.XP_PER_TILE *
          this.playerService.getXPMultiplier(),
      );
      if (leveledUp) this.onLevelUp();
      this.updateGameState();
      this.saveProgress();
      this.drawFogOfWar();
      setTimeout(() => (this.showCoinAnimation = false), 2000);
    }

    this.lastExploredGridKey = currentGridKey;
  }

  private latLngToGrid(lat: number, lng: number): GridCoordinate {
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos(this.toRad(lat));
    return {
      gridX: Math.floor((lng * metersPerLng) / GAME_CONFIG.TILE_SIZE),
      gridY: Math.floor((lat * metersPerLat) / GAME_CONFIG.TILE_SIZE),
    };
  }

  private gridToTileCenter(
    gridX: number,
    gridY: number,
  ): { lat: number; lng: number } {
    const metersPerLat = 111320;
    const lat = ((gridY + 0.5) * GAME_CONFIG.TILE_SIZE) / metersPerLat;
    const metersPerLng = 111320 * Math.cos(this.toRad(lat));
    const lng = ((gridX + 0.5) * GAME_CONFIG.TILE_SIZE) / metersPerLng;
    return { lat, lng };
  }

  private getTileKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  private exploreTiles(
    centerLat: number,
    centerLng: number,
    radiusOverride?: number,
    allowLoot = true,
  ): number {
    const radius = radiusOverride ?? this.currentRadius;
    let newTilesCount = 0;
    const tilesInRadius = Math.ceil(radius / GAME_CONFIG.TILE_SIZE);
    const centerGrid = this.latLngToGrid(centerLat, centerLng);

    for (let dx = -tilesInRadius; dx <= tilesInRadius; dx++) {
      for (let dy = -tilesInRadius; dy <= tilesInRadius; dy++) {
        const gridX = centerGrid.gridX + dx;
        const gridY = centerGrid.gridY + dy;
        const key = this.getTileKey(gridX, gridY);
        if (this.exploredTiles.has(key)) continue;

        const tileCenter = this.gridToTileCenter(gridX, gridY);
        const distance = this.calculateDistance(
          centerLat,
          centerLng,
          tileCenter.lat,
          tileCenter.lng,
        );

        if (distance <= radius) {
          this.exploredTiles.set(key, {
            lat: tileCenter.lat,
            lng: tileCenter.lng,
            explored: true,
            exploredAt: new Date(),
            gridX,
            gridY,
          });
          newTilesCount++;

          if (allowLoot) {
            const loot = this.lootService.rollLoot();
            if (loot) {
              this.applyLoot(loot);
              setTimeout(() => this.lootPopup?.show(loot), 100);
              this.triggerFlash(loot.rarity);
            }
          }
        }
      }
    }

    return newTilesCount;
  }

  // ── Loot ────────────────────────────────────────────────────

  private applyLoot(loot: LootResult) {
  switch (loot.type) {
    case 'coins':
      this.totalCoins +=
        (loot.amount || 0) * this.playerService.getCoinMultiplier();
      break;
    case 'bomb':
      if (loot.item) {
        this.inventoryService.add(loot.item); // ← ins Inventar
      }
      break;
    case 'outfit':
      if (loot.item) {
        this.playerService.unlock(loot.item.id);
      }
      break;
    case 'upgrade':
      const nextClickUpgrade = GAME_CONFIG.CLICK_UPGRADES.find(
        (u) => u.level === this.currentClickLevel + 1,
      );
      if (nextClickUpgrade) {
        this.upgradeService.applyClickUpgrade(nextClickUpgrade);
      }
      break;
    case 'trophy':
      break;
  }
}

  // ── Fog of War ──────────────────────────────────────────────

  private drawFogOfWar() {
    if (!this.map) return;
    if (this.fogLayer) this.map.removeLayer(this.fogLayer);

    const worldBounds: L.LatLngExpression[] = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
    ];
    const holes: L.LatLngExpression[][] = [];

    // maxRenderTiles aus Settings
    const maxTiles = this.settingsService.snapshot.maxRenderTiles;
    const tiles = Array.from(this.exploredTiles.values()).slice(-maxTiles);

    for (const tile of tiles) {
      const metersPerLat = 111320;
      const metersPerLng = 111320 * Math.cos(this.toRad(tile.lat));
      const tileSizeLat = GAME_CONFIG.TILE_SIZE / metersPerLat;
      const tileSizeLng = GAME_CONFIG.TILE_SIZE / metersPerLng;
      const overlap = 0;

      holes.push([
        [
          tile.lat - tileSizeLat / 2 - overlap,
          tile.lng - tileSizeLng / 2 - overlap,
        ],
        [
          tile.lat - tileSizeLat / 2 - overlap,
          tile.lng + tileSizeLng / 2 + overlap,
        ],
        [
          tile.lat + tileSizeLat / 2 + overlap,
          tile.lng + tileSizeLng / 2 + overlap,
        ],
        [
          tile.lat + tileSizeLat / 2 + overlap,
          tile.lng - tileSizeLng / 2 - overlap,
        ],
      ]);
    }

    this.fogLayer = L.polygon([worldBounds, ...holes], {
      stroke: false,
      fillColor: '#050505',
      fillOpacity: GAME_CONFIG.FOG_OPACITY,
      interactive: false,
      smoothFactor: 0,
      bubblingMouseEvents: false,
    } as any).addTo(this.map);

    this.fogLayer.bringToFront();
    if (this.radiusCircle) this.radiusCircle.bringToFront();
  }

  // ── Math ────────────────────────────────────────────────────

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
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(d: number) {
    return d * (Math.PI / 180);
  }

  private updateGameState() {
    const effectiveRadius =
      this.currentRadius * this.playerService.getRadiusMultiplier();
    if (this.radiusCircle) this.radiusCircle.setRadius(effectiveRadius);
  }
  // ── Shop ────────────────────────────────────────────────────

  toggleShop() {
    this.isShopOpen = !this.isShopOpen;
  }
  closeShop() {
    this.isShopOpen = false;
  }

  onPurchaseUpgrade(upgrade: RadiusUpgrade) {
    if (upgrade.level === -1) {
      this.totalCoins += 10_000_000;
      this.saveProgress();
      return;
    }
    if (this.totalCoins >= upgrade.cost) {
      this.soundService.play('purchase');
      this.vibrate([80, 60, 120]);
      this.totalCoins -= upgrade.cost;
      this.upgradeService.applyRadiusUpgrade(upgrade);
      this.updateGameState();
      this.saveProgress();
      if (this.currentLocation) {
        this.lastExploredGridKey = null;
        this.exploreCurrentArea(this.currentLocation);
      }
    }
  }

  onPurchaseClickUpgrade(upgrade: ClickUpgrade) {
    if (this.totalCoins >= upgrade.cost) {
      this.soundService.play('purchase');
      this.vibrate([60, 40, 60]);
      this.totalCoins -= upgrade.cost;
      this.upgradeService.applyClickUpgrade(upgrade);
      this.saveProgress();
    }
  }

  onPurchaseShopItem(item: ShopItem) {
  if (this.totalCoins >= item.cost) {
    this.soundService.play('purchase');
    this.vibrate(100);
    this.totalCoins -= item.cost;
    this.inventoryService.add(item); // ← ins Inventar
    this.saveProgress();
  }
}

onActivateBombFromInventory(item: ShopItem) {
  this.activeBombItem = item;
  document.getElementById('map')!.style.cursor =
    `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='28' font-size='28'>${item.icon}</text></svg>") 16 16, crosshair`;
}


  centerOnPlayer() {
    if (!this.currentLocation || !this.map) return;

    const lat = this.currentLocation.lat;
    const lng = this.currentLocation.lng;
    const radius = this.currentRadius;

    const bounds = L.latLng(lat, lng).toBounds(radius * 2);

    this.map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 19,
    });
  }

  onLevelUp() {
    this.vibrate([100, 50, 200, 50, 300]);
    this.soundService.play('levelup');
    this.lootPopup?.show({
      type: 'trophy',
      label: `🎉 Level ${this.progressionService.level} erreicht! +1 Lootbox`,
      rarity: 'epic',
    });
  }

  private addClickCoins() {
    const earned = this.coinsPerClick * this.playerService.getClickMultiplier();
    this.totalCoins = Math.round((this.totalCoins + earned) * 100) / 100;
    const leveledUp = this.progressionService.addXP(
      GAME_CONFIG.XP_PER_CLICK * this.playerService.getXPMultiplier(),
    );
    if (leveledUp) this.onLevelUp();
    this.saveProgress();
  }

  private showCoin(event: MouseEvent) {
    const earned = this.coinsPerClick * this.playerService.getClickMultiplier();
    const coin = document.createElement('div');
    coin.className = 'coin-effect';
    coin.textContent = `+${Math.round(earned * 100) / 100}🪙`;
    coin.style.left = event.clientX + 'px';
    coin.style.top = event.clientY + 'px';
    coin.style.position = 'fixed';
    document.body.appendChild(coin);
    setTimeout(() => coin.remove(), 900);
  }

  // ── Reset & Persistence ─────────────────────────────────────

  resetGame() {
    localStorage.removeItem('map_explorer_progress');
    localStorage.removeItem('player_data');
    localStorage.removeItem('progression');
    this.exploredTiles.clear();
    this.totalCoins = 0;
    this.totalTilesExplored = 0;
    this.lastExploredGridKey = null;
    this.upgradeService.reset();
    this.inventoryService.clear();
    this.markerService.clear();
    this.playerService.unlocked = ['default'];
    this.playerService.equip('default');
    this.progressionService.xp = 0;
    this.progressionService.level = 1;
    this.progressionService.lootboxes = 0;
    this.updateGameState();
    if (this.currentLocation) this.updatePlayerPosition(this.currentLocation);
    this.drawFogOfWar();
    this.renderAllUserMarkers();
  }

  public saveProgress() {
    localStorage.setItem(
      'map_explorer_progress',
      JSON.stringify({
        totalCoins: this.totalCoins,
        exploredTiles: Array.from(this.exploredTiles.entries()),
        totalTilesExplored: this.totalTilesExplored,
        ...this.upgradeService.serialize(),
      }),
    );
  }


//Cheats
  onUnlockAllOutfits() {
    OUTFITS.forEach((outfit) => this.playerService.unlock(outfit.id));
  }
  onGiveCoins(amount: number) {
  this.totalCoins += amount;
  this.saveGame();
}
  onResetCoins() {
  this.totalCoins = 0;
  this.saveGame();
}
  onGiveLootboxes(amount: number) {
  for (let i = 0; i < amount; i++) {
    this.progressionService.addLootbox();
  }
}

  private loadProgress() {
    const saved = localStorage.getItem('map_explorer_progress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.totalCoins = data.totalCoins || 0;
        this.exploredTiles = new Map(data.exploredTiles || []);
        this.totalTilesExplored = data.totalTilesExplored || 0;
        this.upgradeService.deserialize(data);
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }
  }
  refreshPlayerMarker() {
    if (this.currentLocation) {
      this.updatePlayerPosition(this.currentLocation);
    }
  }

  openLootbox() {
    if (!this.progressionService.useLootbox()) return;

    const locked = OUTFITS.filter(
      (o) => !this.playerService.unlocked.includes(o.id),
    );

    if (locked.length === 0) return;

    const random = locked[Math.floor(Math.random() * locked.length)];

    this.playerService.unlock(random.id);

    // optional direkt equippen
    this.playerService.equip(random.id);

    // 🔥 Feedback
    this.lootPopup?.show({
      type: 'outfit',
      label: `${random.icon} ${random.name} erhalten!`,
      rarity: random.rarity,
    });
  }

onPurchaseLootbox() {
  if (this.totalCoins >= 5000) {
    this.totalCoins -= 5000;
    this.progressionService.addLootbox();
    this.saveProgress();
  }
}

private handleAutoClick() {
  const earned =
    this.coinsPerClick * this.playerService.getClickMultiplier();

  this.totalCoins = Math.round((this.totalCoins + earned) * 100) / 100;

  const leveledUp = this.progressionService.addXP(
    GAME_CONFIG.XP_PER_CLICK * this.playerService.getXPMultiplier(),
  );

  if (leveledUp) this.onLevelUp();

  this.saveProgress();
}

  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      this.soundService.play('button', 0.5);
    }
  }
}
