import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  WAMessage,
  GroupMetadata,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { Logger } from '../utils/Logger';
import { GroupInfo } from '../types';

export class BaileysClient {
  private sock: WASocket | null = null;
  private logger: Logger;
  private sessionPath: string;
  private isConnected: boolean = false;
  private groups: Map<string, GroupInfo> = new Map();
  private onMessageCallback?: (msg: WAMessage) => void;
  private onReadyCallback?: () => void;

  constructor(logger: Logger, sessionPath: string = './bot/sessions') {
    this.logger = logger;
    this.sessionPath = sessionPath;
  }

  async connect(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // We'll handle QR ourselves
    });

    // QR Code for initial connection
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n📱 Scan this QR code with WhatsApp:\n');
        qrcode.generate(qr, { small: true });
        console.log('\nOpen WhatsApp > Settings > Linked Devices > Link a Device\n');
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          await this.logger.warning('Connection closed, reconnecting...');
          setTimeout(() => this.connect(), 5000);
        } else {
          await this.logger.error('Logged out, please scan QR again');
          this.isConnected = false;
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        await this.logger.success('✅ Connected to WhatsApp!');
        await this.loadGroups();
        if (this.onReadyCallback) {
          this.onReadyCallback();
        }
      }
    });

    // Save credentials when updated
    this.sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          if (this.onMessageCallback && !msg.key.fromMe) {
            this.onMessageCallback(msg);
          }
        }
      }
    });
  }

  private async loadGroups(): Promise<void> {
    if (!this.sock) return;

    try {
      const groups = await this.sock.groupFetchAllParticipating();
      
      this.groups.clear();
      Object.values(groups).forEach((group: GroupMetadata) => {
        this.groups.set(group.id, {
          id: group.id,
          name: group.subject,
          participantCount: group.participants.length,
        });
      });

      await this.logger.info(`Loaded ${this.groups.size} groups`);
    } catch (error) {
      await this.logger.error('Failed to load groups', error);
    }
  }

  onMessage(callback: (msg: WAMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onReady(callback: () => void): void {
    this.onReadyCallback = callback;
  }

  async sendMessage(jid: string, content: string): Promise<string | null> {
    if (!this.sock || !this.isConnected) {
      throw new Error('Not connected to WhatsApp');
    }

    try {
      const sent = await this.sock.sendMessage(jid, { text: content });
      return sent?.key?.id || null;
    } catch (error) {
      await this.logger.error(`Failed to send message to ${jid}`, error);
      throw error;
    }
  }

  async sendTyping(jid: string, duration: number): Promise<void> {
    if (!this.sock || !this.isConnected) return;

    try {
      await this.sock.sendPresenceUpdate('composing', jid);
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      await this.sock.sendPresenceUpdate('paused', jid);
    } catch (error) {
      // Typing indicator is non-critical, just log
      await this.logger.warning('Failed to send typing indicator', error);
    }
  }

  getGroups(): GroupInfo[] {
    return Array.from(this.groups.values());
  }

  getGroup(jid: string): GroupInfo | undefined {
    return this.groups.get(jid);
  }

  getGroupName(jid: string): string {
    return this.groups.get(jid)?.name || jid;
  }

  isGroup(jid: string): boolean {
    return jid.endsWith('@g.us');
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.isConnected = false;
      await this.logger.info('Disconnected from WhatsApp');
    }
  }
}
