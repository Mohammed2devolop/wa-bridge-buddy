export interface BotConfig {
  mappings: MappingConfig[];
  sleepMode: SleepModeConfig;
  admins?: string[];
}

export interface MappingConfig {
  readGroups: string[];
  sendGroups: string[];
  startAfter: string;
  filters: FilterConfig;
  humanizer: HumanizerConfig;
}

export interface FilterConfig {
  minLength?: number;
  maxLength?: number;
  ignoreLinks?: boolean;
  ignoreMedia?: boolean;
  keywords?: string[];
  blacklist?: string[];
}

export interface HumanizerConfig {
  minDelay: number;
  maxDelay: number;
  typingBase: number;
}

export interface SleepModeConfig {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

export interface QueuedMessage {
  id: string;
  fromGroup: string;
  toGroups: string[];
  content: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  caption?: string;
  scheduledFor: Date;
  typingDuration: number;
  attempts: number;
}

export interface ForwardedRecord {
  messageId: string;
  fromGroup: string;
  toGroups: string[];
  timestamp: string;
}

export interface BotStats {
  connected: boolean;
  status: 'active' | 'paused' | 'sleeping';
  readGroups: number;
  sendGroups: number;
  queueLength: number;
  messagesToday: number;
  totalForwarded: number;
  delayRange: [number, number];
}

export interface GroupInfo {
  id: string;
  name: string;
  participantCount: number;
}
