import readline from 'readline';
import chalk from 'chalk';
import { BaileysClient } from '../core/BaileysClient';
import { ConfigManager } from '../config/ConfigManager';
import { MessageForwarder } from '../core/MessageForwarder';
import { PersistenceManager } from '../storage/PersistenceManager';
import { Logger } from '../utils/Logger';
import { BotStats } from '../types';

export class CLIController {
  private rl: readline.Interface;
  private client: BaileysClient;
  private config: ConfigManager;
  private forwarder: MessageForwarder;
  private persistence: PersistenceManager;
  private logger: Logger;
  private shouldExit: boolean = false;

  constructor(
    client: BaileysClient,
    config: ConfigManager,
    forwarder: MessageForwarder,
    persistence: PersistenceManager,
    logger: Logger
  ) {
    this.client = client;
    this.config = config;
    this.forwarder = forwarder;
    this.persistence = persistence;
    this.logger = logger;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('> '),
    });
  }

  start(): void {
    this.showHeader();
    this.showHelp();
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (trimmed) {
        await this.handleCommand(trimmed);
      }
      
      if (!this.shouldExit) {
        this.rl.prompt();
      }
    });

    this.rl.on('close', () => {
      console.log(chalk.yellow('\n👋 Goodbye!'));
      process.exit(0);
    });
  }

  private showHeader(): void {
    console.clear();
    console.log(chalk.bold.blue('╔════════════════════════════════════╗'));
    console.log(chalk.bold.blue('║      WhatsBridge v1.0              ║'));
    console.log(chalk.bold.blue('║  WhatsApp to WhatsApp Bridge Bot   ║'));
    console.log(chalk.bold.blue('╚════════════════════════════════════╝'));
    console.log();
  }

  private showHelp(): void {
    console.log(chalk.bold('Available Commands:'));
    console.log();
    
    const commands = [
      ['help', 'Show this help message'],
      ['groups', 'List all available groups'],
      ['readgroups', 'Show configured read groups'],
      ['sendgroups', 'Show configured send groups'],
      ['set-read <JID1,JID2>', 'Set read groups'],
      ['set-send <JID1,JID2>', 'Set send groups'],
      ['add-read <JID>', 'Add a read group'],
      ['add-send <JID>', 'Add a send group'],
      ['remove-read <JID>', 'Remove a read group'],
      ['remove-send <JID>', 'Remove a send group'],
      ['status', 'Show bot status'],
      ['pause', 'Pause forwarding'],
      ['resume', 'Resume forwarding'],
      ['set-delay <min> <max>', 'Set delay range (seconds)'],
      ['set-start <ISO_DATE>', 'Set start time filter'],
      ['queue', 'Show message queue'],
      ['tail-logs', 'Show recent log entries'],
      ['clear', 'Clear terminal'],
      ['stop', 'Stop the bot'],
    ];

    commands.forEach(([cmd, desc]) => {
      console.log(`  ${chalk.yellow(cmd.padEnd(30))} ${chalk.gray(desc)}`);
    });
    console.log();
  }

  private async handleCommand(input: string): Promise<void> {
    const [command, ...args] = input.split(' ');

    try {
      switch (command.toLowerCase()) {
        case 'help':
          this.showHelp();
          break;

        case 'groups':
          await this.listGroups();
          break;

        case 'readgroups':
          await this.showReadGroups();
          break;

        case 'sendgroups':
          await this.showSendGroups();
          break;

        case 'set-read':
          await this.setReadGroups(args.join(' '));
          break;

        case 'set-send':
          await this.setSendGroups(args.join(' '));
          break;

        case 'add-read':
          await this.addReadGroup(args[0]);
          break;

        case 'add-send':
          await this.addSendGroup(args[0]);
          break;

        case 'remove-read':
          await this.removeReadGroup(args[0]);
          break;

        case 'remove-send':
          await this.removeSendGroup(args[0]);
          break;

        case 'status':
          await this.showStatus();
          break;

        case 'pause':
          this.forwarder.pause();
          console.log(chalk.yellow('⏸️  Forwarding paused'));
          break;

        case 'resume':
          this.forwarder.resume();
          console.log(chalk.green('▶️  Forwarding resumed'));
          break;

        case 'set-delay':
          await this.setDelay(args[0], args[1]);
          break;

        case 'set-start':
          await this.setStartTime(args[0]);
          break;

        case 'queue':
          await this.showQueue();
          break;

        case 'tail-logs':
          console.log(chalk.gray('Use "tail -f bot/logs/bot-*.log" to view live logs'));
          break;

        case 'clear':
          console.clear();
          this.showHeader();
          break;

        case 'stop':
          await this.stop();
          break;

        default:
          console.log(chalk.red(`❌ Unknown command: ${command}`));
          console.log(chalk.gray('Type "help" for available commands'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Error:'), error);
    }
  }

  private async listGroups(): Promise<void> {
    const groups = this.client.getGroups();
    
    if (groups.length === 0) {
      console.log(chalk.yellow('No groups found'));
      return;
    }

    console.log(chalk.bold(`\n📱 Available Groups (${groups.length}):\n`));
    groups.forEach((group, idx) => {
      console.log(
        `${chalk.cyan(`[${idx + 1}]`)} ${chalk.white(group.name)} ${chalk.gray(`(${group.participantCount} members)`)}`
      );
      console.log(chalk.gray(`    ${group.id}`));
    });
    console.log();
  }

  private async showReadGroups(): Promise<void> {
    const readGroups = this.config.getReadGroups();
    
    if (readGroups.length === 0) {
      console.log(chalk.yellow('No read groups configured'));
      return;
    }

    console.log(chalk.bold('\n📥 Read Groups:\n'));
    readGroups.forEach(jid => {
      const name = this.client.getGroupName(jid);
      console.log(`  ${chalk.green('•')} ${chalk.white(name)}`);
      console.log(`    ${chalk.gray(jid)}`);
    });
    console.log();
  }

  private async showSendGroups(): Promise<void> {
    const sendGroups = this.config.getSendGroups();
    
    if (sendGroups.length === 0) {
      console.log(chalk.yellow('No send groups configured'));
      return;
    }

    console.log(chalk.bold('\n📤 Send Groups:\n'));
    sendGroups.forEach(jid => {
      const name = this.client.getGroupName(jid);
      console.log(`  ${chalk.green('•')} ${chalk.white(name)}`);
      console.log(`    ${chalk.gray(jid)}`);
    });
    console.log();
  }

  private async setReadGroups(jidsStr: string): Promise<void> {
    const jids = jidsStr.split(',').map(j => j.trim()).filter(j => j);
    await this.config.setReadGroups(jids);
    console.log(chalk.green(`✓ Read groups updated (${jids.length} groups)`));
  }

  private async setSendGroups(jidsStr: string): Promise<void> {
    const jids = jidsStr.split(',').map(j => j.trim()).filter(j => j);
    await this.config.setSendGroups(jids);
    console.log(chalk.green(`✓ Send groups updated (${jids.length} groups)`));
  }

  private async addReadGroup(jid: string): Promise<void> {
    if (!jid) {
      console.log(chalk.red('❌ Please provide a group JID'));
      return;
    }
    await this.config.addReadGroup(jid);
    const name = this.client.getGroupName(jid);
    console.log(chalk.green(`✓ Added read group: ${name}`));
  }

  private async addSendGroup(jid: string): Promise<void> {
    if (!jid) {
      console.log(chalk.red('❌ Please provide a group JID'));
      return;
    }
    await this.config.addSendGroup(jid);
    const name = this.client.getGroupName(jid);
    console.log(chalk.green(`✓ Added send group: ${name}`));
  }

  private async removeReadGroup(jid: string): Promise<void> {
    if (!jid) {
      console.log(chalk.red('❌ Please provide a group JID'));
      return;
    }
    await this.config.removeReadGroup(jid);
    console.log(chalk.green('✓ Removed read group'));
  }

  private async removeSendGroup(jid: string): Promise<void> {
    if (!jid) {
      console.log(chalk.red('❌ Please provide a group JID'));
      return;
    }
    await this.config.removeSendGroup(jid);
    console.log(chalk.green('✓ Removed send group'));
  }

  private async showStatus(): Promise<void> {
    const connected = this.client.isConnectedStatus();
    const paused = this.forwarder.isPausedStatus();
    const queueLength = this.forwarder.getQueueLength();
    const [minDelay, maxDelay] = this.config.getDelayRange();
    const messagesToday = this.persistence.getTodayCount();
    const totalForwarded = this.persistence.getForwardedCount();

    console.log();
    console.log(chalk.bold('┌─────────────────────────────────────────┐'));
    console.log(chalk.bold('│ WhatsBridge Status                      │'));
    console.log(chalk.bold('├─────────────────────────────────────────┤'));
    console.log(`│ Connection: ${connected ? chalk.green('✅ Connected') : chalk.red('❌ Disconnected')}`);
    console.log(`│ Status: ${paused ? chalk.yellow('⏸️  Paused') : chalk.green('🟢 Active')}`);
    console.log(`│ Read Groups: ${this.config.getReadGroups().length}`);
    console.log(`│ Send Groups: ${this.config.getSendGroups().length}`);
    console.log(`│ Queue: ${queueLength} messages`);
    console.log(`│ Delay Range: ${minDelay}-${maxDelay}s`);
    console.log(`│ Messages Today: ${messagesToday}`);
    console.log(`│ Total Forwarded: ${totalForwarded}`);
    console.log(chalk.bold('└─────────────────────────────────────────┘'));
    console.log();
  }

  private async setDelay(minStr: string, maxStr: string): Promise<void> {
    const min = parseInt(minStr);
    const max = parseInt(maxStr);

    if (isNaN(min) || isNaN(max) || min < 1 || max < min) {
      console.log(chalk.red('❌ Invalid delay range. Use: set-delay <min> <max>'));
      return;
    }

    await this.config.setDelayRange(min, max);
    console.log(chalk.green(`✓ Delay range updated to ${min}-${max} seconds`));
  }

  private async setStartTime(isoDate: string): Promise<void> {
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      await this.config.setStartAfter(date.toISOString());
      console.log(chalk.green(`✓ Start time set to ${date.toLocaleString()}`));
    } catch (error) {
      console.log(chalk.red('❌ Invalid date format. Use ISO 8601: 2025-10-16T12:00:00Z'));
    }
  }

  private async showQueue(): Promise<void> {
    const queue = this.forwarder.getQueue();

    if (queue.length === 0) {
      console.log(chalk.yellow('Queue is empty'));
      return;
    }

    console.log(chalk.bold(`\n📋 Message Queue (${queue.length}):\n`));
    queue.forEach((msg, idx) => {
      const timeUntil = Math.max(0, msg.scheduledFor.getTime() - Date.now());
      const seconds = Math.floor(timeUntil / 1000);
      
      console.log(`${chalk.cyan(`[${idx + 1}]`)} ${msg.content.substring(0, 50)}...`);
      console.log(`    ${chalk.gray(`Scheduled in ${seconds}s | To ${msg.toGroups.length} group(s)`)}`);
    });
    console.log();
  }

  private async stop(): Promise<void> {
    console.log(chalk.yellow('\n🛑 Shutting down gracefully...'));
    this.shouldExit = true;
    await this.client.disconnect();
    this.rl.close();
  }
}
