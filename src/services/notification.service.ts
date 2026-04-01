import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private newOutfits = new Set<string>();

  // Neues Item registrieren
  addNewOutfit(id: string) {
    this.newOutfits.add(id);
    this.save();
  }

  // Prüfen ob Item neu ist
  isNewOutfit(id: string): boolean {
    return this.newOutfits.has(id);
  }

  // Entfernen (wenn gesehen)
  markAsSeen(id: string) {
    this.newOutfits.delete(id);
    this.save();
  }

  // Gibt es generell neue?
  hasAnyNewOutfits(): boolean {
    return this.newOutfits.size > 0;
  }

  // Persistenz
  private save() {
    localStorage.setItem(
      'new_outfits',
      JSON.stringify(Array.from(this.newOutfits))
    );
  }

  load() {
    const data = localStorage.getItem('new_outfits');
    if (data) {
      this.newOutfits = new Set(JSON.parse(data));
    }
  }
}