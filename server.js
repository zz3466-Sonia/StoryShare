const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for parties
// Structure: { partyCode: { players: [], createdAt: timestamp, gameState: {} } }
const parties = {};

// Generate random 6-character party code
function generatePartyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Check if code already exists
  if (parties[code]) {
    return generatePartyCode(); // Recursively generate new code
  }
  return code;
}

// ========== PARTY ENDPOINTS ==========

// Create a new party
app.post('/api/party/create', (req, res) => {
  const { playerName } = req.body;
  
  if (!playerName || playerName.trim() === '') {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const partyCode = generatePartyCode();
  const playerId = Date.now().toString(); // Simple unique ID
  
  parties[partyCode] = {
    players: [{
      id: playerId,
      name: playerName,
      isHost: true,
      joinedAt: new Date().toISOString()
    }],
    createdAt: new Date().toISOString(),
    gameState: {
      started: false,
      currentRound: 0,
      currentStory: '',
      currentChoices: [],
      votes: {}
    }
  };

  console.log(`✅ Party created: ${partyCode} by ${playerName}`);

  res.json({
    success: true,
    partyCode,
    playerId,
    playerName,
    isHost: true
  });
});

// Join an existing party
app.post('/api/party/join', (req, res) => {
  const { partyCode, playerName } = req.body;

  if (!partyCode || !playerName) {
    return res.status(400).json({ error: 'Party code and player name are required' });
  }

  const party = parties[partyCode.toUpperCase()];
  
  if (!party) {
    return res.status(404).json({ error: 'Party not found' });
  }

  if (party.gameState.started) {
    return res.status(400).json({ error: 'Game already started' });
  }

  // Check if player name already exists in party
  const existingPlayer = party.players.find(p => p.name === playerName);
  if (existingPlayer) {
    return res.status(400).json({ error: 'Player name already taken in this party' });
  }

  const playerId = Date.now().toString();
  
  party.players.push({
    id: playerId,
    name: playerName,
    isHost: false,
    joinedAt: new Date().toISOString()
  });

  console.log(`✅ ${playerName} joined party ${partyCode}`);

  res.json({
    success: true,
    partyCode: partyCode.toUpperCase(),
    playerId,
    playerName,
    isHost: false
  });
});

// Get party info (players list, game state)
app.get('/api/party/:partyCode', (req, res) => {
  const { partyCode } = req.params;
  const party = parties[partyCode.toUpperCase()];

  if (!party) {
    return res.status(404).json({ error: 'Party not found' });
  }

  res.json({
    success: true,
    partyCode: partyCode.toUpperCase(),
    players: party.players,
    gameState: party.gameState,
    createdAt: party.createdAt
  });
});

// Leave party
app.post('/api/party/leave', (req, res) => {
  const { partyCode, playerId } = req.body;

  if (!partyCode || !playerId) {
    return res.status(400).json({ error: 'Party code and player ID are required' });
  }

  const party = parties[partyCode.toUpperCase()];
  
  if (!party) {
    return res.status(404).json({ error: 'Party not found' });
  }

  const playerIndex = party.players.findIndex(p => p.id === playerId);
  
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'Player not found in party' });
  }

  const player = party.players[playerIndex];
  party.players.splice(playerIndex, 1);

  console.log(`👋 ${player.name} left party ${partyCode}`);

  // If party is empty, delete it
  if (party.players.length === 0) {
    delete parties[partyCode.toUpperCase()];
    console.log(`🗑️  Party ${partyCode} deleted (empty)`);
  }
  // If host left, assign new host
  else if (player.isHost && party.players.length > 0) {
    party.players[0].isHost = true;
    console.log(`👑 ${party.players[0].name} is now host of party ${partyCode}`);
  }

  res.json({
    success: true,
    message: 'Left party successfully'
  });
});

// ========== UTILITY ENDPOINTS ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    activeParties: Object.keys(parties).length,
    timestamp: new Date().toISOString()
  });
});

// Get all active parties (for debugging)
app.get('/api/debug/parties', (req, res) => {
  res.json({
    parties: Object.keys(parties).map(code => ({
      code,
      playerCount: parties[code].players.length,
      players: parties[code].players.map(p => p.name)
    }))
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Party system ready!`);
});
