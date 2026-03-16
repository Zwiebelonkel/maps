// app.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import { GameService } from '../services/game.service';
import { LocationService, Location } from '../services/location.service';
import { GAME_CONFIG, RadiusUpgrade } from '../../models/map.tile.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private map!: L.Map;
  private playerMarker!: L.Marker;
  private radiusCircle!: L.Circle;
  private exploredLayerGroup!: L.LayerGroup;

  // Player Position
  currentLocation: Location | null = null;

  // Game State
  totalCoins = 0;
  totalTilesExplored = 0;
  currentRadius = GAME_CONFIG.BASE_RADIUS;
  currentRadiusLevel = 1;
  nextUpgrade: RadiusUpgrade | null = null;

  // UI State
  isLoading = true;
  errorMessage = '';
  lastExploredCount = 0;
  showCoinAnimation = false;

  constructor(
    private gameService: GameService,
    private locationService: LocationService,
  ) {}

  async ngOnInit() {
    try {
      // Spielfortschritt abonnieren
      this.gameService.progress$
        .pipe(takeUntil(this.destroy$))
        .subscribe((progress) => {
          this.totalCoins = progress.totalCoins;
          this.totalTilesExplored = progress.totalTilesExplored;
          this.currentRadiusLevel = progress.currentRadiusLevel;
          this.currentRadius = this.gameService.getCurrentRadius();
          this.nextUpgrade = this.gameService.getNextUpgrade();

          // Redraw explored tiles
          if (this.map) {
            this.drawExploredTiles();
          }
        });

      // GPS-Tracking starten
      await this.locationService.startTracking();

      // Location Updates abonnieren
      this.locationService.location$
        .pipe(takeUntil(this.destroy$))
        .subscribe((location) => {
          if (location) {
            this.currentLocation = location;
            if (this.map) {
              this.updatePlayerPosition(location);
              this.exploreCurrentArea(location);
            }
          }
        });

      // Automatisches Erkunden alle 2 Sekunden
      interval(2000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.currentLocation) {
            this.exploreCurrentArea(this.currentLocation);
          }
        });

      this.isLoading = false;
    } catch (error: any) {
      this.errorMessage = `Fehler beim Zugriff auf GPS: ${error.message}`;
      this.isLoading = false;
    }
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.locationService.stopTracking();

    if (this.map) {
      this.map.remove();
    }
  }

  /**
   * Initialisiert die Leaflet Karte
   */
  private initMap() {
    // Karte initialisieren
    this.map = L.map('map', {
      center: [51.1657, 10.4515], // Deutschland Center
      zoom: 15,
      zoomControl: true,
    });

    // OpenStreetMap Tiles hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Layer Group für erkundete Kacheln
    this.exploredLayerGroup = L.layerGroup().addTo(this.map);

    // Player Marker (custom icon)
    const playerIcon = L.divIcon({
      className: 'player-marker',
      html: '<div class="player-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Wenn bereits eine Position vorhanden ist
    if (this.currentLocation) {
      this.playerMarker = L.marker(
        [this.currentLocation.lat, this.currentLocation.lng],
        { icon: playerIcon },
      ).addTo(this.map);

      this.map.setView(
        [this.currentLocation.lat, this.currentLocation.lng],
        16,
      );

      // Radius Circle
      this.radiusCircle = L.circle(
        [this.currentLocation.lat, this.currentLocation.lng],
        {
          radius: this.currentRadius,
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.15,
          weight: 2,
        },
      ).addTo(this.map);

      // Initial explore
      this.drawExploredTiles();
    }
  }

  /**
   * Aktualisiert die Spieler-Position auf der Karte
   */
  private updatePlayerPosition(location: Location) {
    const latLng = L.latLng(location.lat, location.lng);

    // Player Marker updaten oder erstellen
    if (this.playerMarker) {
      this.playerMarker.setLatLng(latLng);
    } else {
      const playerIcon = L.divIcon({
        className: 'player-marker',
        html: '<div class="player-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      this.playerMarker = L.marker(latLng, { icon: playerIcon }).addTo(
        this.map,
      );
    }

    // Radius Circle updaten oder erstellen
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

    // Karte zentrieren (nur wenn außerhalb des sichtbaren Bereichs)
    if (!this.map.getBounds().contains(latLng)) {
      this.map.setView(latLng, this.map.getZoom());
    }
  }

  /**
   * Erkundet den aktuellen Bereich
   */
  private exploreCurrentArea(location: Location) {
    const newTiles = this.gameService.exploreTiles(location.lat, location.lng);

    if (newTiles > 0) {
      this.lastExploredCount = newTiles;
      this.showCoinAnimation = true;
      setTimeout(() => (this.showCoinAnimation = false), 2000);
    }
  }

  /**
   * Zeichnet alle erkundeten Kacheln auf der Karte
   */
  private drawExploredTiles() {
    // Alle bisherigen Kacheln entfernen
    this.exploredLayerGroup.clearLayers();

    // Neue Kacheln zeichnen
    const tiles = this.gameService.getExploredTiles();
    const tileSize = GAME_CONFIG.TILE_SIZE;

    tiles.forEach((tile) => {
      // Umrechnung Meter zu Grad (ungefähr)
      const latOffset = tileSize / 110540;
      const lngOffset = tileSize / 111320;

      const bounds: L.LatLngBoundsExpression = [
        [tile.lat, tile.lng],
        [tile.lat + latOffset, tile.lng + lngOffset],
      ];

      const rectangle = L.rectangle(bounds, {
        color: '#00FF00',
        weight: 1,
        opacity: 0.3,
        fillColor: '#00FF00',
        fillOpacity: 0.1,
      });

      this.exploredLayerGroup.addLayer(rectangle);
    });
  }

  /**
   * Kauft das nächste Upgrade
   */
  buyUpgrade() {
    const success = this.gameService.purchaseUpgrade();
    if (success) {
      console.log('Upgrade gekauft!');
      // Update radius circle
      if (this.radiusCircle && this.currentLocation) {
        this.radiusCircle.setRadius(this.currentRadius);
      }
    } else {
      console.log('Nicht genug Coins oder max Level erreicht');
    }
  }

  /**
   * Zentriert die Karte auf die aktuelle Position
   */
  centerOnPlayer() {
    if (this.currentLocation && this.map) {
      this.map.setView(
        [this.currentLocation.lat, this.currentLocation.lng],
        16,
      );
    }
  }

  /**
   * Reset für Testing
   */
  resetGame() {
    if (confirm('Möchtest du wirklich deinen gesamten Fortschritt löschen?')) {
      this.gameService.resetProgress();
      this.exploredLayerGroup.clearLayers();
    }
  }
}
