import { WAMessage, proto } from '@whiskeysockets/baileys';
import { BaileysClient } from './BaileysClient';
import { ConfigManager } from '../config/ConfigManager';
import { PersistenceManager } from '../storage/PersistenceManager';
import { Logger } from '../utils/Logger';
import { FilterConfig } from '../types';

export class MessageListener {
  private client: BaileysClient;
  private config: ConfigManager;
  private persistence: PersistenceManager;
  private logger: Logger;
  private onNewMessageCallback?: (message: ProcessedMessage) => void;

  constructor(
    client: BaileysClient,
    config: ConfigManager,
    persistence: PersistenceManager,
    logger: Logger
  ) {
    this.client = client;
    this.config = config;
    this.persistence = persistence;
    this.logger = logger;
  }

  start(): void {
    this.client.onMessage(async (msg) => {
      await this.handleMessage(msg);
    });
  }

  onNewMessage(callback: (message: ProcessedMessage) => void): void {
    this.onNewMessageCallback = callback;
  }

  private async handleMessage(msg: WAMessage): Promise<void> {
    try {
      const fromJid = msg.key.remoteJid;
      const messageId = msg.key.id;

      if (!fromJid || !messageId) return;

      // Check if from a read group
      const readGroups = this.config.getReadGroups();
      if (!readGroups.includes(fromJid)) return;

      const groupName = this.client.getGroupName(fromJid);
      
      // Extract message content
      const content = this.extractMessageContent(msg);
      if (!content) return;

      await this.logger.waRead(groupName, messageId, content.text?.length || 0);

      // Check if already forwarded
      if (this.persistence.isForwarded(messageId, fromJid)) {
        await this.logger.info('Message already forwarded, skipping');
        return;
      }

      // Apply filters
      const filters = this.config.getConfig().mappings[0]?.filters;
      const filterResult = this.applyFilters(content, filters);
      
      if (!filterResult.passed) {
        await this.logger.filter(false, filterResult.reason);
        return;
      }

      await this.logger.filter(true);

      // Check timestamp filter
      const startAfter = new Date(this.config.getStartAfter());
      const msgTimestamp = new Date((msg.messageTimestamp as number) * 1000);
      
      if (msgTimestamp < startAfter) {
        await this.logger.filter(false, 'Message before startAfter date');
        return;
      }

      // Forward to callback
      if (this.onNewMessageCallback) {
        const processedMsg: ProcessedMessage = {
          id: messageId,
          fromGroup: fromJid,
          content: content.text || '',
          mediaType: content.mediaType,
          mediaUrl: content.mediaUrl,
          caption: content.caption,
          timestamp: msgTimestamp,
        };

        this.onNewMessageCallback(processedMsg);
      }
    } catch (error) {
      await this.logger.error('Error handling message', error);
    }
  }

  private extractMessageContent(msg: WAMessage): MessageContent | null {
    const message = msg.message;
    if (!message) return null;

    let content: MessageContent = {};

    // Text message
    if (message.conversation) {
      content.text = message.conversation;
    } else if (message.extendedTextMessage?.text) {
      content.text = message.extendedTextMessage.text;
    }
    // Image
    else if (message.imageMessage) {
      content.mediaType = 'image';
      content.caption = message.imageMessage.caption;
      content.text = content.caption || '[Image]';
    }
    // Video
    else if (message.videoMessage) {
      content.mediaType = 'video';
      content.caption = message.videoMessage.caption;
      content.text = content.caption || '[Video]';
    }
    // Audio
    else if (message.audioMessage) {
      content.mediaType = 'audio';
      content.text = '[Audio]';
    }
    // Document
    else if (message.documentMessage) {
      content.mediaType = 'document';
      content.caption = message.documentMessage.caption;
      content.text = content.caption || '[Document]';
    }

    return content.text ? content : null;
  }

  private applyFilters(
    content: MessageContent,
    filters?: FilterConfig
  ): { passed: boolean; reason?: string } {
    if (!filters) return { passed: true };

    const text = content.text || '';

    // Min length
    if (filters.minLength && text.length < filters.minLength) {
      return { passed: false, reason: `Too short (${text.length} < ${filters.minLength})` };
    }

    // Max length
    if (filters.maxLength && text.length > filters.maxLength) {
      return { passed: false, reason: `Too long (${text.length} > ${filters.maxLength})` };
    }

    // Ignore links
    if (filters.ignoreLinks && this.containsLink(text)) {
      return { passed: false, reason: 'Contains link' };
    }

    // Ignore media
    if (filters.ignoreMedia && content.mediaType) {
      return { passed: false, reason: 'Is media message' };
    }

    // Keywords (must contain at least one)
    if (filters.keywords && filters.keywords.length > 0) {
      const hasKeyword = filters.keywords.some(kw =>
        text.toLowerCase().includes(kw.toLowerCase())
      );
      if (!hasKeyword) {
        return { passed: false, reason: 'Missing required keywords' };
      }
    }

    // Blacklist (must not contain any)
    if (filters.blacklist && filters.blacklist.length > 0) {
      const hasBlacklisted = filters.blacklist.some(bl =>
        text.toLowerCase().includes(bl.toLowerCase())
      );
      if (hasBlacklisted) {
        return { passed: false, reason: 'Contains blacklisted word' };
      }
    }

    return { passed: true };
  }

  private containsLink(text: string): boolean {
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    return urlPattern.test(text);
  }
}

interface MessageContent {
  text?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  caption?: string;
}

export interface ProcessedMessage {
  id: string;
  fromGroup: string;
  content: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  caption?: string;
  timestamp: Date;
}
