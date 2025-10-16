# WhatsBridge Setup Instructions

## 🎯 Quick Start Guide

### Step 1: Download the Code

Click the **GitHub** button in the top right of Lovable to push this code to your GitHub repository, then clone it:

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### Step 2: Navigate to Bot Directory

```bash
cd bot
```

### Step 3: Install Dependencies

```bash
npm install
```

Required packages that will be installed:
- `@whiskeysockets/baileys` - WhatsApp Web API
- `chalk` - Terminal colors
- `qrcode-terminal` - QR code display
- `pino` - Logging
- TypeScript and related tools

### Step 4: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Step 5: Run the Bot

```bash
npm start
# or
npm run bot
```

### Step 6: Scan QR Code

1. When the bot starts, a QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code displayed in your terminal

### Step 7: Configure Groups

Once connected, use the CLI commands:

```bash
# List all your groups
> groups

# Copy the JID of the group you want to read from
> add-read 1203630AAAAAA@g.us

# Copy the JID of the group you want to send to
> add-send 1203630BBBBBB@g.us

# Check status
> status

# View queue
> queue
```

## 📋 Available NPM Scripts

Add these to your `package.json` in the `bot/` directory:

```json
{
  "name": "whatsbridge",
  "version": "1.0.0",
  "description": "WhatsApp to WhatsApp bridge bot",
  "main": "dist/bot.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/bot.js",
    "bot": "npm run build && npm start",
    "dev": "ts-node src/bot.ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "latest",
    "chalk": "^4.1.2",
    "qrcode-terminal": "latest",
    "pino": "latest",
    "enquirer": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
```

## 🔧 Configuration

The bot uses `bot/config/config.json`. You can edit this file directly or use CLI commands.

### Example Configuration

```json
{
  "mappings": [
    {
      "readGroups": ["1203630AAAAAA@g.us"],
      "sendGroups": ["1203630BBBBBB@g.us"],
      "startAfter": "2025-10-16T00:00:00Z",
      "filters": {
        "minLength": 10,
        "ignoreLinks": false
      },
      "humanizer": {
        "minDelay": 60,
        "maxDelay": 300,
        "typingBase": 15
      }
    }
  ],
  "sleepMode": {
    "enabled": true,
    "startHour": 2,
    "endHour": 5
  }
}
```

## 🚀 Running in Production

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start bot with PM2
cd bot
npm run build
pm2 start dist/bot.js --name whatsbridge

# View logs
pm2 logs whatsbridge

# Restart
pm2 restart whatsbridge

# Stop
pm2 stop whatsbridge
```

### Using Screen (Linux)

```bash
# Start a screen session
screen -S whatsbridge

# Run the bot
cd bot
npm run bot

# Detach: Press Ctrl+A then D
# Reattach: screen -r whatsbridge
```

### Using systemd (Linux Service)

Create `/etc/systemd/system/whatsbridge.service`:

```ini
[Unit]
Description=WhatsBridge Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/repo/bot
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable whatsbridge
sudo systemctl start whatsbridge
sudo systemctl status whatsbridge
```

## 🐛 Troubleshooting

### QR Code Not Showing

- Make sure your terminal supports unicode characters
- Try a different terminal (iTerm2, Windows Terminal, etc.)
- Use `npm run dev` for better debugging

### Connection Drops

- Check your internet connection
- WhatsApp Web might be logged out on phone
- Delete `sessions/` folder and reconnect

### Messages Not Forwarding

1. Check connection: `status`
2. Verify groups are configured: `readgroups` and `sendgroups`
3. Check queue: `queue`
4. View logs: `tail -f logs/bot-*.log`
5. Check startAfter date is in the past

### Build Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## 📁 Project Structure

```
bot/
├── src/
│   ├── bot.ts              # Main entry point
│   ├── types.ts            # TypeScript types
│   ├── config/
│   │   └── ConfigManager.ts
│   ├── core/
│   │   ├── BaileysClient.ts
│   │   ├── MessageListener.ts
│   │   ├── MessageForwarder.ts
│   │   └── Humanizer.ts
│   ├── cli/
│   │   └── CLIController.ts
│   ├── storage/
│   │   └── PersistenceManager.ts
│   └── utils/
│       └── Logger.ts
├── config/
│   └── config.json         # Bot configuration
├── sessions/               # WhatsApp auth (created automatically)
├── data/                  # Forwarded messages DB (created automatically)
├── logs/                  # Log files (created automatically)
├── dist/                  # Compiled JavaScript (created by build)
├── package.json
└── tsconfig.json
```

## 🔒 Security Notes

1. **Never commit `sessions/` folder** - Contains your WhatsApp authentication
2. **Keep `config.json` private** - May contain sensitive group IDs
3. **Use at your own risk** - This uses unofficial WhatsApp API
4. **Account bans** - WhatsApp may ban accounts that use automation

## ⚠️ Important Warnings

- This bot uses unofficial WhatsApp Web API through Baileys
- WhatsApp may ban accounts that use automation tools
- Use responsibly and at your own risk
- Don't use with your main WhatsApp account
- Consider using a separate number for the bot

## 📚 Additional Resources

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Web Protocol](https://github.com/sigalor/whatsapp-web-reveng)

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `tail -f bot/logs/bot-*.log`
2. Use `status` command in CLI
3. Try `clear` and restart
4. Delete `sessions/` and reconnect
5. Check GitHub issues for similar problems

## 🎉 You're All Set!

Your WhatsApp bridge bot is ready to use. Happy bridging! 🌉
