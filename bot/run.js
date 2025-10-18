#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building and starting WhatsBridge...\n');

const botDir = path.join(__dirname);
const distDir = path.join(botDir, 'dist');

// Build the TypeScript code
console.log('📦 Building TypeScript...');
const build = spawn('npx', ['tsc'], { 
  cwd: botDir,
  stdio: 'inherit',
  shell: true 
});

build.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Build failed!');
    process.exit(1);
  }

  console.log('✅ Build complete!\n');
  
  // Run the bot
  console.log('🤖 Starting bot...\n');
  const bot = spawn('node', ['dist/bot.js'], {
    cwd: botDir,
    stdio: 'inherit',
    shell: true
  });

  bot.on('close', (code) => {
    console.log(`\nBot process exited with code ${code}`);
    process.exit(code);
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    bot.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    bot.kill('SIGTERM');
  });
});
