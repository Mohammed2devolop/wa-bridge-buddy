# WhatsBridge - WhatsApp to WhatsApp Bridge Bot

A human-like WhatsApp message bridge that forwards messages from source groups to destination groups with realistic delays and typing simulation.

## 🚀 Features

- ✅ **Baileys WhatsApp Web Integration** - Connects via official WhatsApp Web protocol
- ✅ **Interactive CLI Control** - Full terminal interface to manage everything
- ✅ **Human-like Behavior** - Random delays (60s-5min), typing simulation, sleep mode
- ✅ **Message Filtering** - Date filters, length filters, link filtering
- ✅ **Deduplication** - Never sends the same message twice
- ✅ **Persistent Sessions** - Reconnects automatically, saves state
- ✅ **Comprehensive Logging** - All actions logged with timestamps
- ✅ **Queue Management** - Smart queuing with humanization

## 📋 Requirements

- Node.js 18+ or Bun
- A phone number for WhatsApp (will be used for bot connection)
- Terminal access

## 🛠️ Installation

1. **Clone this repository**
```bash
git clone <your-repo-url>
cd whatsbridge
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Build the project**
```bash
npm run build
# or
bun run build
```

## 🎯 Usage

### First Time Setup

1. **Start the bot**
```bash
npm run bot
# or
bun run bot
```

2. **Scan QR Code**
- A QR code will appear in your terminal
- Open WhatsApp on your phone > Settings > Linked Devices > Link a Device
- Scan the QR code

3. **Configure Groups**
- Once connected, use the CLI to set up your bridge

### CLI Commands

| Command | Description |
|---------|-------------|
| `help` | Show all commands |
| `groups` | List all groups with names and JIDs |
| `readgroups` | Show currently configured read groups |
| `sendgroups` | Show currently configured send groups |
| `set-read <JID1,JID2>` | Set which groups to read from |
| `set-send <JID1,JID2>` | Set which groups to send to |
| `add-read <JID>` | Add a read group |
| `add-send <JID>` | Add a send group |
| `remove-read <JID>` | Remove a read group |
| `remove-send <JID>` | Remove a send group |
| `status` | Show connection status and stats |
| `pause` | Pause forwarding (still listens) |
| `resume` | Resume forwarding |
| `set-delay <min> <max>` | Update delay range (seconds) |
| `set-start <ISO_DATE>` | Only forward messages after this date |
| `queue` | Show pending messages |
| `tail-logs` | Live view of logs |
| `clear` | Clear terminal |
| `stop` | Graceful shutdown |

### Example Session

```bash
> groups
[1] Study Group A - 1203630AAAAAA@g.us
[2] Friends Group B - 1203630BBBBBB@g.us
[3] Work Updates - 1203630CCCCCC@g.us

> set-read 1203630AAAAAA@g.us
✓ Read groups updated

> set-send 1203630BBBBBB@g.us
✓ Send groups updated

> set-start 2025-10-16T00:00:00Z
✓ Start time updated

> status
┌─────────────────────────────────────┐
│ WhatsBridge Status                  │
├─────────────────────────────────────┤
│ Connection: ✅ Connected            │
│ Status: 🟢 Active                   │
│ Read Groups: 1                      │
│ Send Groups: 1                      │
│ Queue: 0 messages                   │
│ Delay Range: 60-300s               │
│ Messages Today: 0                   │
└─────────────────────────────────────┘

> tail-logs
[14:32:10] 📥 WA-READ | Group=Study Group A | Len=58
[14:32:11] ✅ FILTER | Passed all filters
[14:32:15] ➕ QUEUE | Added (delay=247s)
[14:36:22] ⌨️  TYPING | Simulating 18s
[14:36:40] 📤 WA-SEND | Group=Friends Group B | Success
```

## ⚙️ Configuration

The bot uses `bot/config/config.json` for persistence:

```json
{
  "mappings": [
    {
      "readGroups": ["1203630AAAAAA@g.us"],
      "sendGroups": ["1203630BBBBBB@g.us"],
      "startAfter": "2025-10-16T00:00:00Z",
      "filters": {
        "minLength": 10,
        "ignoreLinks": true
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

## 🤖 Humanization Features

### Random Delays
- Each message gets a random delay between 60-300 seconds (configurable)
- Occasionally adds extra-long delays to simulate being "busy"

### Typing Simulation
- Simulates typing before sending
- Duration based on message length (10-30 seconds)

### Sleep Mode
- No messages sent between 2 AM - 5 AM (configurable)
- Queued messages wait until after sleep mode

### Natural Patterns
- Varies delay times
- Random typing durations
- Sporadic longer pauses

## 📁 Project Structure

```
bot/
├── src/
│   ├── bot.ts                    # Main entry point
│   ├── config/
│   │   ├── ConfigManager.ts      # Config handling
│   │   └── config.json           # Settings
│   ├── core/
│   │   ├── BaileysClient.ts      # WhatsApp connection
│   │   ├── MessageListener.ts    # Incoming messages
│   │   ├── MessageForwarder.ts   # Outgoing messages
│   │   └── Humanizer.ts          # Delay & typing logic
│   ├── cli/
│   │   └── CLIController.ts      # Terminal interface
│   ├── storage/
│   │   └── PersistenceManager.ts # Data persistence
│   └── utils/
│       └── Logger.ts             # Logging system
├── sessions/                      # WhatsApp auth (auto-created)
├── data/                         # Message tracking (auto-created)
├── logs/                         # Log files (auto-created)
└── config.json                   # Your settings
```

## 🔒 Security Notes

- **sessions/** folder contains your WhatsApp authentication - keep it private
- Never share your session files
- Use at your own risk - this uses unofficial WhatsApp Web API
- WhatsApp may ban accounts using automation

## 🐛 Troubleshooting

### QR Code not appearing
- Make sure terminal supports QR code display
- Try a different terminal emulator

### Connection keeps dropping
- Check internet connection
- WhatsApp Web may be logged out on phone
- Delete `sessions/` and reconnect

### Messages not forwarding
- Check `status` to see if groups are configured
- Verify `startAfter` date is in the past
- Check logs with `tail-logs`

### Bot stuck/frozen
- Press Ctrl+C to stop
- Restart with `npm run bot`

## 📝 Logs

All actions are logged to:
- Console (with colors)
- `logs/bot-YYYY-MM-DD.log` (daily files)

## 🔧 Advanced Usage

### Multiple Mappings
Edit `config.json` to add multiple read→send group pairs:

```json
{
  "mappings": [
    {
      "readGroups": ["GROUP_A@g.us"],
      "sendGroups": ["GROUP_B@g.us"],
      "startAfter": "2025-10-16T00:00:00Z"
    },
    {
      "readGroups": ["GROUP_C@g.us"],
      "sendGroups": ["GROUP_D@g.us", "GROUP_E@g.us"],
      "startAfter": "2025-10-15T00:00:00Z"
    }
  ]
}
```

### Custom Filters
Adjust in config.json:

```json
"filters": {
  "minLength": 5,           // Minimum message length
  "maxLength": 1000,        // Maximum message length
  "ignoreLinks": true,      // Skip messages with URLs
  "ignoreMedia": false,     // Skip media messages
  "keywords": ["urgent"],   // Only forward if contains these
  "blacklist": ["spam"]     // Skip if contains these
}
```

## 📜 License

MIT License - Use at your own risk

## ⚠️ Disclaimer

This bot uses unofficial WhatsApp Web API through Baileys. Use responsibly and at your own risk. The developers are not responsible for any account bans or issues arising from using this bot.

## 🤝 Contributing

Issues and pull requests welcome!

---

**Built with ❤️ using Baileys and TypeScript**
