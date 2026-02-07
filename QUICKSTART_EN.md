# 🎮 CROWDSTORY - Quick Start Guide

## 📋 Project Overview
**CROWDSTORY** is an interactive sci-fi storytelling game where 3-8 players vote to choose story directions while AI generates the continuation.

---

## 🚀 Installation (One-Time Setup)

### Step 1: Install Dependencies
Open **one** terminal and run:
```bash
cd /Users/siqijiang/aigame
npm install
cd frontend && npm install && cd ..
```

---

## 💻 How to Run (Do This Every Time)

### Option A: One-Click Launch (Recommended)
```bash
./start.sh
```

Then open in your browser: **http://localhost:5173**

### Option B: Manual Two Terminals (Traditional)
**Terminal 1 - Start Backend Server:**
```bash
cd /Users/siqijiang/aigame
node server.js
```

You'll see this message on success:
```
🚀 Server running on http://localhost:3000
📡 Party system ready!
🎨 Story engine: Gemini API
```

**Terminal 2 - Start Frontend Web Server:**
```bash
cd /Users/siqijiang/aigame/frontend
npx vite --port 5173
```

You'll see this message on success:
```
  ➜  Local:   http://localhost:5173/
```

---

## 🎯 How to Play

### Step 1: Open Website
Visit in your browser: **http://localhost:5173**

### Step 2: Host Creates a Party
- Enter your name
- Click "CREATE PARTY"
- Remember the room code (e.g., `ABC123`)

### Step 3: Other Players Join
- Other players visit the same URL (http://localhost:5173)
- Click "JOIN PARTY"
- Enter the room code
- Enter their name
- Click "JOIN"

### Step 4: Host Starts the Game
- Once all players have joined, host clicks "START GAME"

### Step 5: Play the Game
Each round:
1. Read the AI-generated story
2. Vote for option A, B, or C
3. Watch real-time vote counts and timer
4. Game auto-advances after 30 seconds (or host can click "NEXT ROUND")
5. **Game ends after 5 rounds**

---

## 💡 Game Features

✨ **AI Story Generation**
- Uses Google Gemini API to generate unique stories
- Auto-fallback to preset stories if API is unavailable
- Stories evolve based on player choices

🎯 **Real-Time Voting**
- All players' votes are displayed live
- Winning choice influences the next round's story

⏱️ **Auto Timer**
- 30-second countdown per round
- Auto-advances when time runs out
- Host can also advance manually

👥 **Supports 3-8 Players**
- Max 8 people per party
- Parties auto-cleanup when all players leave

---

## 🔧 Troubleshooting

### Problem: Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or kill all Node processes
pkill -f "node server.js"
```

### Problem: API Quota Exceeded
- System automatically falls back to offline stories
- Game continues to work normally

### Problem: 404 Not Found
- Make sure frontend server is running (Terminal 2)
- Refresh browser (⌘+R)
- Clear cache and reload

---

## 📱 Multiplayer on Different Devices
To play with people on different computers:
1. Deploy backend to cloud (Render, Railway, etc.)
2. Or use `ngrok` to expose local server

```bash
# Install ngrok
brew install ngrok

# Expose port 3000
ngrok http 3000

# Share the public URL with others
```

---

## 📊 Project Structure
```
/Users/siqijiang/aigame/
├── server.js              # Backend main file
├── state/                 # Party state management
├── game/                  # Game logic (stories, voting)
├── .env                   # API key configuration
└── frontend/              # React frontend
    ├── src/
    │   ├── App.jsx       # Game interface
    │   └── App.css       # Styles
    └── vite.config.js    # Vite config
```

---

## 🎪 Hackathon Demo Tips
1. Start backend and frontend early
2. Have 3-4 browsers/tabs ready to demo multiplayer
3. Have backup usernames and room codes
4. Show off the AI-generated story quality
5. Emphasize smooth real-time voting and auto-advancement

---

## 📞 Quick Help
- **Backend not responding?** → Check Terminal 1 is running `node server.js`
- **Can't open website?** → Check Terminal 2 is running `npx vite`
- **API failing?** → Normal, will use offline stories automatically
- **Players can't join?** → Verify room code and network connection

Good luck with your Hackathon demo! 🚀
