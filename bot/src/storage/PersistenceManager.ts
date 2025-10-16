import fs from 'fs/promises';
import path from 'path';
import { ForwardedRecord } from '../types';

export class PersistenceManager {
  private dataDir: string;
  private forwardedFile: string;
  private forwardedMessages: Map<string, ForwardedRecord>;

  constructor(dataDir: string = './bot/data') {
    this.dataDir = dataDir;
    this.forwardedFile = path.join(dataDir, 'forwarded.json');
    this.forwardedMessages = new Map();
  }

  async init(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await this.loadForwarded();
  }

  private async loadForwarded(): Promise<void> {
    try {
      const data = await fs.readFile(this.forwardedFile, 'utf-8');
      const records: ForwardedRecord[] = JSON.parse(data);
      
      records.forEach(record => {
        const key = this.getMessageKey(record.messageId, record.fromGroup);
        this.forwardedMessages.set(key, record);
      });
      
      console.log(`✓ Loaded ${this.forwardedMessages.size} forwarded message records`);
    } catch (error) {
      console.log('⚠ No forwarded messages file found, starting fresh');
    }
  }

  private async saveForwarded(): Promise<void> {
    const records = Array.from(this.forwardedMessages.values());
    await fs.writeFile(
      this.forwardedFile,
      JSON.stringify(records, null, 2),
      'utf-8'
    );
  }

  private getMessageKey(messageId: string, fromGroup: string): string {
    return `${fromGroup}:${messageId}`;
  }

  async markAsForwarded(
    messageId: string,
    fromGroup: string,
    toGroups: string[]
  ): Promise<void> {
    const key = this.getMessageKey(messageId, fromGroup);
    const record: ForwardedRecord = {
      messageId,
      fromGroup,
      toGroups,
      timestamp: new Date().toISOString(),
    };
    
    this.forwardedMessages.set(key, record);
    await this.saveForwarded();
  }

  isForwarded(messageId: string, fromGroup: string): boolean {
    const key = this.getMessageKey(messageId, fromGroup);
    return this.forwardedMessages.has(key);
  }

  getForwardedCount(): number {
    return this.forwardedMessages.size;
  }

  getTodayCount(): number {
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    
    this.forwardedMessages.forEach(record => {
      if (record.timestamp.startsWith(today)) {
        count++;
      }
    });
    
    return count;
  }

  async cleanup(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoff = cutoffDate.toISOString();
    
    let removed = 0;
    this.forwardedMessages.forEach((record, key) => {
      if (record.timestamp < cutoff) {
        this.forwardedMessages.delete(key);
        removed++;
      }
    });
    
    if (removed > 0) {
      await this.saveForwarded();
      console.log(`✓ Cleaned up ${removed} old records`);
    }
  }
}
