import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private soundsEnabled: boolean = true;

  constructor() {
    // Load sound preference from localStorage
    const savedPreference = localStorage.getItem('timer-sounds-enabled');
    if (savedPreference !== null) {
      this.soundsEnabled = savedPreference === 'true';
    }
  }

  /**
   * Play timer start sound
   */
  playStartSound(): void {
    if (!this.soundsEnabled) return;

    // Use a simple beep sound generated via Web Audio API
    this.playBeep(800, 150); // Higher pitch, short duration
  }

  /**
   * Play timer stop sound
   */
  playStopSound(): void {
    if (!this.soundsEnabled) return;

    // Use a simple beep sound generated via Web Audio API
    this.playBeep(400, 200); // Lower pitch, slightly longer duration
  }

  /**
   * Toggle sound notifications on/off
   */
  toggleSounds(): boolean {
    this.soundsEnabled = !this.soundsEnabled;
    localStorage.setItem('timer-sounds-enabled', String(this.soundsEnabled));
    return this.soundsEnabled;
  }

  /**
   * Get current sound preference
   */
  areSoundsEnabled(): boolean {
    return this.soundsEnabled;
  }

  /**
   * Enable sound notifications
   */
  enableSounds(): void {
    this.soundsEnabled = true;
    localStorage.setItem('timer-sounds-enabled', 'true');
  }

  /**
   * Disable sound notifications
   */
  disableSounds(): void {
    this.soundsEnabled = false;
    localStorage.setItem('timer-sounds-enabled', 'false');
  }

  /**
   * Play a beep sound using Web Audio API
   * @param frequency Frequency in Hz (default: 440)
   * @param duration Duration in milliseconds (default: 200)
   */
  private playBeep(frequency: number = 440, duration: number = 200): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Fade in and out to avoid clicking
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);

      // Clean up
      setTimeout(() => {
        audioContext.close();
      }, duration + 100);
    } catch (error) {
      console.error('Error playing beep sound:', error);
    }
  }
}
