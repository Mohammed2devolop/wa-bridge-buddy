import { HumanizerConfig, SleepModeConfig } from '../types';

export class Humanizer {
  private config: HumanizerConfig;
  private sleepMode: SleepModeConfig;

  constructor(config: HumanizerConfig, sleepMode: SleepModeConfig) {
    this.config = config;
    this.sleepMode = sleepMode;
  }

  updateConfig(config: HumanizerConfig): void {
    this.config = config;
  }

  calculateDelay(): number {
    const { minDelay, maxDelay } = this.config;
    
    // Base random delay
    let delay = this.randomBetween(minDelay, maxDelay);
    
    // 10% chance of extra-long delay (looks "busy")
    if (Math.random() < 0.1) {
      delay += this.randomBetween(180, 600); // Extra 3-10 minutes
    }
    
    return Math.floor(delay);
  }

  calculateTypingDuration(messageLength: number): number {
    const { typingBase } = this.config;
    
    // Base typing time + variable based on length
    const base = this.randomBetween(10, 30);
    const extra = Math.min(messageLength / 20, 20); // Up to 20 extra seconds
    
    return Math.floor(base + extra);
  }

  isInSleepMode(): boolean {
    if (!this.sleepMode.enabled) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const { startHour, endHour } = this.sleepMode;
    
    // Handle sleep period that crosses midnight
    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  getNextWakeTime(): Date {
    if (!this.sleepMode.enabled || !this.isInSleepMode()) {
      return new Date();
    }
    
    const now = new Date();
    const wakeTime = new Date(now);
    wakeTime.setHours(this.sleepMode.endHour, 0, 0, 0);
    
    // If end hour is before current hour, it's tomorrow
    if (this.sleepMode.endHour <= now.getHours()) {
      wakeTime.setDate(wakeTime.getDate() + 1);
    }
    
    return wakeTime;
  }

  async simulateTyping(duration: number, onProgress?: (progress: number) => void): Promise<void> {
    const steps = 10;
    const stepDuration = (duration * 1000) / steps;
    
    for (let i = 0; i <= steps; i++) {
      if (onProgress) {
        onProgress((i / steps) * 100);
      }
      if (i < steps) {
        await this.sleep(stepDuration);
      }
    }
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // Add slight variation to avoid patterns
  addJitter(value: number, percentage: number = 10): number {
    const jitter = value * (percentage / 100);
    return value + this.randomBetween(-jitter, jitter);
  }
}
