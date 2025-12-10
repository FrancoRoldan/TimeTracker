import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean; // Cmd key on Mac
  callback: () => void;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService implements OnDestroy {
  private shortcuts: Map<string, ShortcutAction> = new Map();
  private destroy$ = new Subject<void>();
  private listener: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.initializeListener();
  }

  /**
   * Initialize global keyboard event listener
   */
  private initializeListener(): void {
    this.listener = (event: KeyboardEvent) => {
      const shortcutKey = this.generateShortcutKey(event);
      const action = this.shortcuts.get(shortcutKey);

      if (action) {
        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();

        // Execute callback
        action.callback();
      }
    };

    window.addEventListener('keydown', this.listener);
  }

  /**
   * Register a new keyboard shortcut
   * @param action ShortcutAction object with key and callback
   * @returns Unique identifier for this shortcut
   */
  registerShortcut(action: ShortcutAction): string {
    const shortcutKey = this.generateShortcutKeyFromAction(action);
    this.shortcuts.set(shortcutKey, action);
    return shortcutKey;
  }

  /**
   * Unregister a keyboard shortcut
   * @param shortcutKey Unique identifier returned by registerShortcut
   */
  unregisterShortcut(shortcutKey: string): void {
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Unregister all shortcuts
   */
  clearAllShortcuts(): void {
    this.shortcuts.clear();
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): ShortcutAction[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Generate a unique key from keyboard event
   */
  private generateShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');

    parts.push(event.key.toUpperCase());

    return parts.join('+');
  }

  /**
   * Generate a unique key from ShortcutAction
   */
  private generateShortcutKeyFromAction(action: ShortcutAction): string {
    const parts: string[] = [];

    if (action.ctrlKey) parts.push('Ctrl');
    if (action.shiftKey) parts.push('Shift');
    if (action.altKey) parts.push('Alt');
    if (action.metaKey) parts.push('Meta');

    parts.push(action.key.toUpperCase());

    return parts.join('+');
  }

  /**
   * Format shortcut for display (e.g., "Ctrl+Shift+S")
   */
  formatShortcut(action: ShortcutAction): string {
    const parts: string[] = [];

    // Use Cmd symbol on Mac, Ctrl on others
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (action.ctrlKey || action.metaKey) {
      parts.push(isMac ? '\u2318' : 'Ctrl'); // ⌘ on Mac
    }
    if (action.shiftKey) parts.push(isMac ? '\u21E7' : 'Shift'); // ⇧ on Mac
    if (action.altKey) parts.push(isMac ? '\u2325' : 'Alt'); // ⌥ on Mac

    parts.push(action.key.toUpperCase());

    return parts.join('+');
  }

  ngOnDestroy(): void {
    if (this.listener) {
      window.removeEventListener('keydown', this.listener);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
