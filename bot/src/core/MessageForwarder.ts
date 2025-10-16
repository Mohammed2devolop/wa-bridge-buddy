import { BaileysClient } from './BaileysClient';
import { ConfigManager } from '../config/ConfigManager';
import { PersistenceManager } from '../storage/PersistenceManager';
import { Humanizer } from './Humanizer';
import { Logger } from '../utils/Logger';
import { ProcessedMessage } from './MessageListener';
import { QueuedMessage } from '../types';

export class MessageForwarder {
  private client: BaileysClient;
  private config: ConfigManager;
  private persistence: PersistenceManager;
  private humanizer: Humanizer;
  private logger: Logger;
  private queue: QueuedMessage[] = [];
  private isProcessing: boolean = false;
  private isPaused: boolean = false;

  constructor(
    client: BaileysClient,
    config: ConfigManager,
    persistence: PersistenceManager,
    humanizer: Humanizer,
    logger: Logger
  ) {
    this.client = client;
    this.config = config;
    this.persistence = persistence;
    this.humanizer = humanizer;
    this.logger = logger;
  }

  async enqueue(message: ProcessedMessage): Promise<void> {
    const sendGroups = this.config.getSendGroups();
    if (sendGroups.length === 0) {
      await this.logger.warning('No send groups configured, skipping');
      return;
    }

    const delay = this.humanizer.calculateDelay();
    const typingDuration = this.humanizer.calculateTypingDuration(message.content.length);
    const scheduledFor = new Date(Date.now() + delay * 1000);

    const queuedMessage: QueuedMessage = {
      id: message.id,
      fromGroup: message.fromGroup,
      toGroups: sendGroups,
      content: message.content,
      mediaType: message.mediaType,
      mediaUrl: message.mediaUrl,
      caption: message.caption,
      scheduledFor,
      typingDuration,
      attempts: 0,
    };

    this.queue.push(queuedMessage);
    await this.logger.queue(delay);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const message = this.queue[0];
      const now = new Date();

      // Wait until scheduled time
      if (message.scheduledFor > now) {
        const waitMs = message.scheduledFor.getTime() - now.getTime();
        await this.sleep(Math.min(waitMs, 10000)); // Check every 10s
        continue;
      }

      // Check if paused
      if (this.isPaused) {
        await this.sleep(5000); // Check every 5s
        continue;
      }

      // Check sleep mode
      if (this.humanizer.isInSleepMode()) {
        const wakeTime = this.humanizer.getNextWakeTime();
        await this.logger.info(`😴 Sleep mode active until ${wakeTime.toLocaleTimeString()}`);
        await this.sleep(60000); // Check every minute
        continue;
      }

      // Process message
      this.queue.shift(); // Remove from queue
      await this.forwardMessage(message);
    }

    this.isProcessing = false;
  }

  private async forwardMessage(message: QueuedMessage): Promise<void> {
    try {
      for (const toGroup of message.toGroups) {
        const groupName = this.client.getGroupName(toGroup);

        // Simulate typing
        await this.logger.typing(message.typingDuration);
        await this.client.sendTyping(toGroup, message.typingDuration);

        // Send message
        const sentId = await this.client.sendMessage(toGroup, message.content);
        
        if (sentId) {
          await this.logger.waSend(groupName, sentId);
        }

        // Small delay between multiple destinations
        if (message.toGroups.length > 1) {
          await this.sleep(this.humanizer.calculateDelay() * 1000);
        }
      }

      // Mark as forwarded
      await this.persistence.markAsForwarded(
        message.id,
        message.fromGroup,
        message.toGroups
      );
    } catch (error) {
      await this.logger.error('Failed to forward message', error);

      // Retry logic
      if (message.attempts < 3) {
        message.attempts++;
        message.scheduledFor = new Date(Date.now() + 60000); // Retry in 1 minute
        this.queue.push(message);
        await this.logger.warning(`Retrying (attempt ${message.attempts}/3)`);
      }
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    if (this.queue.length > 0 && !this.isProcessing) {
      this.processQueue();
    }
  }

  isPausedStatus(): boolean {
    return this.isPaused;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
