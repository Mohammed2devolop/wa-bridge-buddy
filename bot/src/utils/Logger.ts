import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export class Logger {
  private logDir: string;
  private logFile: string;

  constructor(logDir: string = './bot/logs') {
    this.logDir = logDir;
    this.logFile = this.getLogFileName();
  }

  async init(): Promise<void> {
    await fs.mkdir(this.logDir, { recursive: true });
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `bot-${date}.log`);
  }

  private timestamp(): string {
    return new Date().toTimeString().split(' ')[0];
  }

  async log(type: string, message: string, data?: any): Promise<void> {
    const ts = this.timestamp();
    const logLine = `[${ts}] ${type} | ${message}${data ? ' | ' + JSON.stringify(data) : ''}`;
    
    // Console output with colors
    this.consoleLog(type, ts, message, data);
    
    // File output
    try {
      await fs.appendFile(this.logFile, logLine + '\n', 'utf-8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  private consoleLog(type: string, ts: string, message: string, data?: any): void {
    const icon = this.getIcon(type);
    const color = this.getColor(type);
    
    console.log(
      chalk.gray(`[${ts}]`),
      color(`${icon} ${type.toUpperCase()}`),
      chalk.white('|'),
      message,
      data ? chalk.gray(JSON.stringify(data, null, 2)) : ''
    );
  }

  private getIcon(type: string): string {
    const icons: Record<string, string> = {
      'wa-read': '📥',
      'wa-send': '📤',
      'filter': '✅',
      'queue': '➕',
      'humanizer': '⌨️',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'success': '✓',
      'connect': '🔌',
      'disconnect': '🔴',
    };
    return icons[type.toLowerCase()] || '•';
  }

  private getColor(type: string): typeof chalk.blue {
    const colors: Record<string, typeof chalk.blue> = {
      'wa-read': chalk.blue,
      'wa-send': chalk.green,
      'filter': chalk.cyan,
      'queue': chalk.yellow,
      'humanizer': chalk.magenta,
      'error': chalk.red,
      'warning': chalk.yellow,
      'info': chalk.blue,
      'success': chalk.green,
      'connect': chalk.green,
      'disconnect': chalk.red,
    };
    return colors[type.toLowerCase()] || chalk.white;
  }

  info(message: string, data?: any): Promise<void> {
    return this.log('info', message, data);
  }

  success(message: string, data?: any): Promise<void> {
    return this.log('success', message, data);
  }

  warning(message: string, data?: any): Promise<void> {
    return this.log('warning', message, data);
  }

  error(message: string, data?: any): Promise<void> {
    return this.log('error', message, data);
  }

  waRead(group: string, msgId: string, length: number): Promise<void> {
    return this.log('wa-read', `Group=${group} MsgID=${msgId.slice(0, 10)}... Len=${length}`);
  }

  waSend(group: string, msgId: string): Promise<void> {
    return this.log('wa-send', `Group=${group} MsgID=${msgId.slice(0, 10)}... Success`);
  }

  filter(passed: boolean, reason?: string): Promise<void> {
    return this.log('filter', passed ? 'Passed all filters' : `Blocked: ${reason}`);
  }

  queue(delay: number): Promise<void> {
    return this.log('queue', `Added (delay=${delay}s)`);
  }

  typing(duration: number): Promise<void> {
    return this.log('humanizer', `Simulating typing ${duration}s`);
  }
}
