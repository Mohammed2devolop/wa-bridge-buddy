#!/usr/bin/env node

import { BaileysClient } from './core/BaileysClient';
import { ConfigManager } from './config/ConfigManager';
import { MessageListener } from './core/MessageListener';
import { MessageForwarder } from './core/MessageForwarder';
import { PersistenceManager } from './storage/PersistenceManager';
import { Humanizer } from './core/Humanizer';
import { Logger } from './utils/Logger';
import { CLIController } from './cli/CLIController';

async function main() {
  console.log('🚀 Starting WhatsBridge...\n');

  // Initialize components
  const logger = new Logger();
  await logger.init();

  const config = new ConfigManager();
  await config.load();

  const persistence = new PersistenceManager();
  await persistence.init();

  const botConfig = config.getConfig();
  const humanizerConfig = botConfig.mappings[0]?.humanizer || {
    minDelay: 60,
    maxDelay: 300,
    typingBase: 15,
  };
  const humanizer = new Humanizer(humanizerConfig, botConfig.sleepMode);

  const client = new BaileysClient(logger);
  const forwarder = new MessageForwarder(client, config, persistence, humanizer, logger);
  const listener = new MessageListener(client, config, persistence, logger);

  // Connect message flow
  listener.onNewMessage(async (message) => {
    await forwarder.enqueue(message);
  });

  // Start WhatsApp connection
  await logger.info('Connecting to WhatsApp...');
  await client.connect();

  // Wait for connection
  await new Promise<void>((resolve) => {
    client.onReady(() => {
      listener.start();
      resolve();
    });
  });

  // Start CLI
  const cli = new CLIController(client, config, forwarder, persistence, logger);
  cli.start();

  // Cleanup old records daily
  setInterval(async () => {
    await persistence.cleanup(30);
  }, 24 * 60 * 60 * 1000);

  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received SIGINT, shutting down...');
    await client.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Received SIGTERM, shutting down...');
    await client.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
