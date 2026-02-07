require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import modules
const partyStore = require('./state/partyStore');
const GameState = require('./game/gameState');
const storyEngine = require('./game/storyEngine');
const VotingEngine = require('./game/votingEngine');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize game modules
const gameState = new GameState(partyStore);
const votingEngine = new VotingEngine(partyStore);

// Middleware
app.use(cors());
app.use(express.json());

// ========== PARTY ENDPOINTS ==========

// Create a new party
app.post('/api/party/create', (req, res) => {
  const { playerName } = req.body;
  
  if (!playerName || playerName.trim() === '') {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    const result = partyStore.createParty(playerName);
    console.log(`✅ Party created: ${result.partyCode} by ${playerName}`);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join an existing party
app.post('/api/party/join', (req, res) => {
  const { partyCode, playerName } = req.body;

  if (!partyCode || !playerName) {
    return res.status(400).json({ error: 'Party code and player name are required' });
  }

  try {
    const result = partyStore.joinParty(partyCode, playerName);
    console.log(`✅ ${playerName} joined party ${partyCode}`);
    res.json({ success: true, ...result });
  } catch (error) {
    const status = error.message === 'Party not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Get party info (players list, game state)
app.get('/api/party/:partyCode', (req, res) => {
  const { partyCode } = req.params;

  try {
    const party = partyStore.getParty(partyCode);
    res.json({
      success: true,
      partyCode: partyCode.toUpperCase(),
      players: party.players,
      gameState: party.gameState,
      createdAt: party.createdAt
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Leave party
app.post('/api/party/leave', (req, res) => {
  const { partyCode, playerId } = req.body;

  if (!partyCode || !playerId) {
    return res.status(400).json({ error: 'Party code and player ID are required' });
  }

  try {
    const result = partyStore.leaveParty(partyCode, playerId);
    console.log(`👋 ${result.playerName} left party ${partyCode}`);
    
    if (result.deleted) {
      console.log(`🗑️  Party ${partyCode} deleted (empty)`);
    }

    res.json({ success: true, message: 'Left party successfully' });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// ========== GAME ENDPOINTS ==========

// Start game (host only recommended)
app.post('/api/game/start', async (req, res) => {
  const { partyCode } = req.body;

  if (!partyCode) {
    return res.status(400).json({ error: 'Party code is required' });
  }

  try {
    const roundContent = await storyEngine.generateRound(0);
    const state = gameState.startGame(
      partyCode,
      roundContent.story,
      roundContent.choices
    );

    console.log(`🎮 Game started for party ${partyCode}`);
    res.json({ success: true, gameState: state });
  } catch (error) {
    const status = error.message === 'Party not found' ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Submit a vote
app.post('/api/game/vote', (req, res) => {
  const { partyCode, playerId, choice } = req.body;

  if (!partyCode || !playerId || !choice) {
    return res.status(400).json({ error: 'Party code, player ID, and choice are required' });
  }

  try {
    const voteCounts = votingEngine.vote(partyCode, playerId, choice);
    res.json({ success: true, voteCounts });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Tally votes and advance to next round
app.post('/api/game/next', async (req, res) => {
  const { partyCode } = req.body;

  if (!partyCode) {
    return res.status(400).json({ error: 'Party code is required' });
  }

  try {
    const { winner } = votingEngine.tallyVotes(partyCode);
    const currentRound = gameState.getCurrentRound(partyCode);
    
    const roundContent = await storyEngine.generateRound(currentRound, winner);
    const state = gameState.nextRound(
      partyCode,
      winner,
      roundContent.story,
      roundContent.choices
    );

    console.log(`➡️  Party ${partyCode} moved to round ${state.currentRound}`);
    res.json({ success: true, gameState: state });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// ========== UTILITY ENDPOINTS ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    activeParties: partyStore.getPartyCount(),
    timestamp: new Date().toISOString()
  });
});

// Get all active parties (for debugging)
app.get('/api/debug/parties', (req, res) => {
  res.json({ parties: partyStore.getAllParties() });
});

// Start server (bind to all interfaces for LAN access)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 LAN access enabled on port ${PORT}`);
  console.log(`📡 Party system ready!`);
  console.log(`🎨 Story engine: ${storyEngine.hasApiKey ? 'Gemini API' : 'Fallback mode'}`);
});
