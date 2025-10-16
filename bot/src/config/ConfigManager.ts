import fs from 'fs/promises';
import path from 'path';
import { BotConfig, MappingConfig } from '../types';

const DEFAULT_CONFIG: BotConfig = {
  mappings: [],
  sleepMode: {
    enabled: true,
    startHour: 2,
    endHour: 5,
  },
  admins: [],
};

export class ConfigManager {
  private configPath: string;
  private config: BotConfig;

  constructor(configPath: string = './bot/config/config.json') {
    this.configPath = configPath;
    this.config = DEFAULT_CONFIG;
  }

  async load(): Promise<BotConfig> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(data);
      console.log('✓ Configuration loaded');
      return this.config;
    } catch (error) {
      console.log('⚠ No config found, creating default...');
      await this.save();
      return this.config;
    }
  }

  async save(): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      'utf-8'
    );
  }

  getConfig(): BotConfig {
    return this.config;
  }

  async setReadGroups(jids: string[]): Promise<void> {
    if (!this.config.mappings[0]) {
      this.config.mappings[0] = this.createDefaultMapping();
    }
    this.config.mappings[0].readGroups = jids;
    await this.save();
  }

  async setSendGroups(jids: string[]): Promise<void> {
    if (!this.config.mappings[0]) {
      this.config.mappings[0] = this.createDefaultMapping();
    }
    this.config.mappings[0].sendGroups = jids;
    await this.save();
  }

  async addReadGroup(jid: string): Promise<void> {
    if (!this.config.mappings[0]) {
      this.config.mappings[0] = this.createDefaultMapping();
    }
    if (!this.config.mappings[0].readGroups.includes(jid)) {
      this.config.mappings[0].readGroups.push(jid);
      await this.save();
    }
  }

  async addSendGroup(jid: string): Promise<void> {
    if (!this.config.mappings[0]) {
      this.config.mappings[0] = this.createDefaultMapping();
    }
    if (!this.config.mappings[0].sendGroups.includes(jid)) {
      this.config.mappings[0].sendGroups.push(jid);
      await this.save();
    }
  }

  async removeReadGroup(jid: string): Promise<void> {
    if (this.config.mappings[0]) {
      this.config.mappings[0].readGroups = 
        this.config.mappings[0].readGroups.filter(g => g !== jid);
      await this.save();
    }
  }

  async removeSendGroup(jid: string): Promise<void> {
    if (this.config.mappings[0]) {
      this.config.mappings[0].sendGroups = 
        this.config.mappings[0].sendGroups.filter(g => g !== jid);
      await this.save();
    }
  }

  async setDelayRange(min: number, max: number): Promise<void> {
    if (!this.config.mappings[0]) {
      this.config.mappings[0] = this.createDefaultMapping();
    }
    this.config.mappings[0].humanizer.minDelay = min;
    this.config.mappings[0].humanizer.maxDelay = max;
    await this.save();
  }

  async setStartAfter(isoDate: string): Promise<void> {
    if (!this.config.mappings[0]) {
      this.config.mappings[0] = this.createDefaultMapping();
    }
    this.config.mappings[0].startAfter = isoDate;
    await this.save();
  }

  getReadGroups(): string[] {
    return this.config.mappings[0]?.readGroups || [];
  }

  getSendGroups(): string[] {
    return this.config.mappings[0]?.sendGroups || [];
  }

  getDelayRange(): [number, number] {
    const humanizer = this.config.mappings[0]?.humanizer;
    return humanizer ? [humanizer.minDelay, humanizer.maxDelay] : [60, 300];
  }

  getStartAfter(): string {
    return this.config.mappings[0]?.startAfter || new Date().toISOString();
  }

  private createDefaultMapping(): MappingConfig {
    return {
      readGroups: [],
      sendGroups: [],
      startAfter: new Date().toISOString(),
      filters: {
        minLength: 10,
        ignoreLinks: false,
        ignoreMedia: false,
      },
      humanizer: {
        minDelay: 60,
        maxDelay: 300,
        typingBase: 15,
      },
    };
  }
}
