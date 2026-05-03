import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GAME_CONFIG } from '../../config/game.config';

interface ConfigEntry {
  path: string;
  originalValue: string;
  value: string;
  valueType: 'number' | 'string' | 'boolean';
}

@Component({
  selector: 'app-server-admin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './server-admin-modal.component.html',
  styleUrls: ['./server-admin-modal.component.scss'],
})
export class ServerAdminModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() openDailyRewardModal = new EventEmitter<void>();

  readonly configTarget = GAME_CONFIG;
  entries: ConfigEntry[] = [];
  saveMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.refreshEntries();
      this.saveMessage = '';
    }
  }

  refreshEntries() {
    this.entries = this.flattenConfig(this.configTarget);
  }

  onClose() {
    this.close.emit();
  }

  saveAll() {
    let changedCount = 0;

    for (const entry of this.entries) {
      if (entry.value === entry.originalValue) {
        continue;
      }

      const parsedValue = this.parseValue(entry.value, entry.valueType);
      if (parsedValue === null) {
        this.saveMessage = `❌ Ungültiger Wert bei ${entry.path}`;
        return;
      }

      this.setValueByPath(this.configTarget, entry.path, parsedValue);
      entry.originalValue = entry.value;
      changedCount++;
    }

    this.saveMessage = changedCount
      ? `✅ ${changedCount} Config-Werte gespeichert`
      : 'ℹ️ Keine Änderungen erkannt';
  }

  private flattenConfig(source: unknown, prefix = ''): ConfigEntry[] {
    if (!source || typeof source !== 'object') {
      return [];
    }

    const entries: ConfigEntry[] = [];

    Object.entries(source as Record<string, unknown>).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayPath = `${path}.${index}`;

          if (item !== null && typeof item === 'object') {
            entries.push(...this.flattenConfig(item, arrayPath));
            return;
          }

          const primitiveEntry = this.toEntry(arrayPath, item);
          if (primitiveEntry) {
            entries.push(primitiveEntry);
          }
        });
        return;
      }

      if (value !== null && typeof value === 'object') {
        entries.push(...this.flattenConfig(value, path));
        return;
      }

      const primitiveEntry = this.toEntry(path, value);
      if (primitiveEntry) {
        entries.push(primitiveEntry);
      }
    });

    return entries;
  }

  private toEntry(path: string, value: unknown): ConfigEntry | null {
    if (typeof value === 'number') {
      return { path, value: String(value), originalValue: String(value), valueType: 'number' };
    }

    if (typeof value === 'string') {
      return { path, value, originalValue: value, valueType: 'string' };
    }

    if (typeof value === 'boolean') {
      const boolAsText = value ? 'true' : 'false';
      return { path, value: boolAsText, originalValue: boolAsText, valueType: 'boolean' };
    }

    return null;
  }

  private parseValue(input: string, type: ConfigEntry['valueType']): number | string | boolean | null {
    if (type === 'number') {
      const parsed = Number(input);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (type === 'boolean') {
      if (input.toLowerCase() === 'true') return true;
      if (input.toLowerCase() === 'false') return false;
      return null;
    }

    return input;
  }

  private setValueByPath(target: Record<string, unknown>, path: string, newValue: number | string | boolean) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    if (!lastKey) return;

    let current: unknown = target;
    for (const key of keys) {
      current = (current as Record<string, unknown>)[key];
    }

    (current as Record<string, unknown>)[lastKey] = newValue;
  }
}
