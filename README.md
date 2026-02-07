# AI Character Group Chat - Party System Backend

Backend for an interactive AI character group chat game with real-time voting and storytelling.

## Features

✅ **Party System**
- Create party with unique 6-character code
- Join existing party
- Track players in each party
- Automatic host assignment
- Leave party functionality

## Installation

```bash
npm install
```

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Create Party
```http
POST /api/party/create
Content-Type: application/json

{
  "playerName": "Alice"
}
```

Response:
```json
{
  "success": true,
  "partyCode": "ABC123",
  "playerId": "1234567890",
  "playerName": "Alice",
  "isHost": true
}
```

### Join Party
```http
POST /api/party/join
Content-Type: application/json

{
  "partyCode": "ABC123",
  "playerName": "Bob"
}
```

### Get Party Info
```http
GET /api/party/ABC123
```

Response:
```json
{
  "success": true,
  "partyCode": "ABC123",
  "players": [
    {
      "id": "1234567890",
      "name": "Alice",
      "isHost": true,
      "joinedAt": "2026-02-07T10:00:00.000Z"
    }
  ],
  "gameState": {
    "started": false,
    "currentRound": 0
  }
}
```

### Leave Party
```http
POST /api/party/leave
Content-Type: application/json

{
  "partyCode": "ABC123",
  "playerId": "1234567890"
}
```

### Health Check
```http
GET /api/health
```

## Testing the API

You can test with curl:

```bash
# Create a party
curl -X POST http://localhost:3000/api/party/create \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Alice"}'

# Join a party
curl -X POST http://localhost:3000/api/party/join \
  -H "Content-Type: application/json" \
  -d '{"partyCode": "ABC123", "playerName": "Bob"}'

# Get party info
curl http://localhost:3000/api/party/ABC123
```

## Next Steps

- [ ] Add game state management
- [ ] Add voting system
- [ ] Integrate Gemini AI for story generation
- [ ] Add real-time updates (Socket.io or Firebase)
- [ ] Add timer for voting rounds

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **CORS** - Cross-origin requests
- In-memory storage (can upgrade to Redis/Firebase later)
