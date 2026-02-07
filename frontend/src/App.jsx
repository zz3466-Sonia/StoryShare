import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

export default function App() {
  const API_BASE = useMemo(() => (import.meta.env.VITE_API_BASE || ''), []);
  const MAX_ROUNDS = 5;

  // Navigation State
  const [view, setView] = useState('home'); // home, hostLobby, enterCode, enterName, memberLobby, game, end

  // Data State
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [voteCounts, setVoteCounts] = useState({ A: 0, B: 0, C: 0 });
  const [selectedChoice, setSelectedChoice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const resetSession = () => {
    setView('home');
    setUsername('');
    setRoomCode('');
    setPlayerId('');
    setIsHost(false);
    setPlayers([]);
    setGameState(null);
    setVoteCounts({ A: 0, B: 0, C: 0 });
    setSelectedChoice('');
    setError('');
    setTimer(30);
  };

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: text || 'Unknown response' };
    }
  };

  const apiRequest = async (path, options = {}) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      setError(err.message || 'Network error');
      throw err;
    }
  };

  const createParty = async () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/api/party/create', {
        method: 'POST',
        body: JSON.stringify({ playerName: username.trim() })
      });
      setRoomCode(data.partyCode);
      setPlayerId(data.playerId);
      setIsHost(true);
      setPlayers([{ id: data.playerId, name: data.playerName, isHost: true }]);
      setView('hostLobby');
    } finally {
      setLoading(false);
    }
  };

  const joinParty = async () => {
    if (!roomCode.trim() || !username.trim()) {
      setError('Please enter room code and name');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/api/party/join', {
        method: 'POST',
        body: JSON.stringify({ partyCode: roomCode.trim(), playerName: username.trim() })
      });
      setRoomCode(data.partyCode);
      setPlayerId(data.playerId);
      setIsHost(false);
      setView('memberLobby');
    } finally {
      setLoading(false);
    }
  };

  const leaveParty = async () => {
    if (!roomCode || !playerId) return resetSession();
    setLoading(true);
    try {
      await apiRequest('/api/party/leave', {
        method: 'POST',
        body: JSON.stringify({ partyCode: roomCode, playerId })
      });
      resetSession();
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const data = await apiRequest('/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ partyCode: roomCode })
      });
      setGameState(data.gameState);
      setVoteCounts(data.gameState.voteCounts || { A: 0, B: 0, C: 0 });
      setSelectedChoice('');
      setTimer(30);
      setView('game');
    } finally {
      setLoading(false);
    }
  };

  const submitVote = async (choice) => {
    if (!roomCode || !playerId || !choice) return;
    setSelectedChoice(choice);
    const data = await apiRequest('/api/game/vote', {
      method: 'POST',
      body: JSON.stringify({ partyCode: roomCode, playerId, choice })
    });
    setVoteCounts(data.voteCounts || { A: 0, B: 0, C: 0 });
  };

  const nextRound = async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const data = await apiRequest('/api/game/next', {
        method: 'POST',
        body: JSON.stringify({ partyCode: roomCode })
      });
      setGameState(data.gameState);
      setVoteCounts(data.gameState.voteCounts || { A: 0, B: 0, C: 0 });
      setSelectedChoice('');
      setTimer(30);
      if (data.gameState.currentRound >= MAX_ROUNDS) {
        setView('end');
      } else {
        setView('game');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roomCode) return;
    const poll = async () => {
      try {
        const data = await apiRequest(`/api/party/${roomCode}`);
        setPlayers(data.players || []);
        if (data.gameState) {
          setGameState(data.gameState);
          setVoteCounts(data.gameState.voteCounts || { A: 0, B: 0, C: 0 });
          if (data.gameState.started) {
            if (data.gameState.currentRound >= MAX_ROUNDS) {
              setView('end');
            } else {
              setView('game');
            }
          }
        }
      } catch {
        // ignore transient polling errors
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  useEffect(() => {
    if (view !== 'game') return;
    setTimer(30);
  }, [view, gameState?.currentRound]);

  useEffect(() => {
    if (view !== 'game') return;
    if (timer <= 0) {
      if (isHost) nextRound();
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [view, timer, isHost]);

  // --- VIEWS ---

  // 1. HOME PAGE
  const HomeScreen = () => (
    <div className="screen-card">
      <h1 className="logo">CROWDSTORY</h1>
      <p className="subtitle">A party RPG game to play with your friends!</p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <input
        type="text"
        placeholder="Your Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />

      <button className="btn-primary" onClick={() => {
        if (!loading) createParty();
      }}>{loading ? 'CREATING...' : 'CREATE PARTY'}</button>

      <button className="btn-primary btn-secondary" onClick={() => setView('enterCode')}>
        JOIN PARTY
      </button>
    </div>
  );

  // 2. HOST LOBBY
  const HostLobby = () => (
    <div className="screen-card">
      <button className="btn-primary btn-red" onClick={leaveParty}>LEAVE GROUP</button>
      <h1 className="logo" style={{fontSize: '1.5rem'}}>CROWDSTORY</h1>

      <h3>CODE: {roomCode}</h3>

      <div className="player-list">
        {players.map((p) => (
          <div key={p.id} className={`player-chip ${p.isHost ? 'host-chip' : ''}`}>
            {p.name} {p.isHost ? '(HOST)' : ''}
          </div>
        ))}
      </div>

      <div style={{marginTop: 'auto'}}>
        <button className="btn-primary" onClick={startGame} disabled={loading}>
          {loading ? 'STARTING...' : 'START GAME'}
        </button>
      </div>
    </div>
  );

  // 3. ENTER CODE (Member View)
  const EnterCodeScreen = () => (
    <div className="screen-card">
      <h1 className="logo" style={{fontSize: '1.5rem'}}>CROWDSTORY</h1>
      <div style={{marginTop: '3rem'}}>
        <h3>ENTER CODE</h3>
        <input
          type="text"
          placeholder="ex. DEVFEST2026"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
        />
        <button className="btn-primary" onClick={() => setView('enterName')}>CONTINUE</button>
      </div>
    </div>
  );

  // 4. ENTER NAME (Member View)
  const EnterNameScreen = () => (
    <div className="screen-card">
      <h1 className="logo" style={{fontSize: '1.5rem'}}>CROWDSTORY</h1>
      <div style={{marginTop: '3rem'}}>
        <h3>ENTER USERNAME</h3>
        <input
          type="text"
          placeholder="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button className="btn-primary" onClick={joinParty} disabled={loading}>
          {loading ? 'JOINING...' : 'JOIN'}
        </button>
      </div>
    </div>
  );

  // 5. MEMBER LOBBY
  const MemberLobby = () => (
    <div className="screen-card">
      <button className="btn-primary btn-red" onClick={leaveParty}>LEAVE GROUP</button>
      <h1 className="logo" style={{fontSize: '1.5rem'}}>CROWDSTORY</h1>
      <h3>CODE: {roomCode}</h3>

      <div className="player-list">
        {players.map((p) => (
          <div key={p.id} className={`player-chip ${p.isHost ? 'host-chip' : ''}`}>
            {p.name} {p.isHost ? '(HOST)' : ''}
          </div>
        ))}
      </div>

      <p style={{marginTop: 'auto', color: '#888'}}>Waiting for host to start...</p>
    </div>
  );

  // 6. GAME SCREEN (The Story)
  const GameScreen = () => (
    <div className="screen-card" style={{alignItems: 'flex-start', textAlign: 'left'}}>
      <h1 className="logo" style={{fontSize: '1.2rem'}}>CROWDSTORY</h1>

      {gameState?.lastWinner && (
        <p style={{ marginTop: '10px', color: '#2c3e50' }}>
          Last round winner: {gameState.lastWinner}
        </p>
      )}

      <p style={{ marginTop: '10px', color: '#888' }}>
        Round {gameState?.currentRound || 1} • Time left: {timer}s
      </p>

      {/* Story Text */}
      <div style={{fontSize: '1.2rem', margin: '20px 0', lineHeight: '1.5'}}>
        {gameState?.currentStory || 'Loading story...'}
      </div>

      {/* Choices */}
      <div style={{width: '100%', marginTop: 'auto'}}>
        {(gameState?.currentChoices || []).map((choice) => {
          const label = choice?.trim().charAt(0).toUpperCase();
          const count = voteCounts[label] ?? 0;
          return (
            <button
              key={choice}
              className="choice-btn"
              onClick={() => submitVote(label)}
              disabled={!!selectedChoice}
              style={{
                border: selectedChoice === label ? '2px solid #2c3e50' : undefined
              }}
            >
              {choice} ({count})
            </button>
          );
        })}
      </div>

      {isHost && (
        <button className="btn-primary" style={{marginTop: '20px'}} onClick={nextRound} disabled={loading}>
          {loading ? 'ADVANCING...' : 'NEXT ROUND'}
        </button>
      )}
    </div>
  );

  // 7. END SCREEN
  const EndScreen = () => (
    <div className="screen-card">
      <button className="btn-primary btn-red" onClick={resetSession}>HOME</button>
      <h1 className="logo" style={{fontSize: '1.5rem'}}>CROWDSTORY</h1>

      <h2 style={{color: '#555'}}>YOUR ENDING</h2>

      <div style={{background: '#eee', padding: '20px', borderRadius: '10px', fontSize: '1rem', lineHeight: '1.4'}}>
        {gameState?.currentStory || 'Thanks for playing!'}
      </div>

      <button className="btn-primary" style={{marginTop: 'auto'}} onClick={resetSession}>PLAY AGAIN</button>
    </div>
  );

  // --- RENDER CONTROLLER ---
  return (
    <div className="app-container">
      {view === 'home' && <HomeScreen />}
      {view === 'hostLobby' && <HostLobby />}
      {view === 'enterCode' && <EnterCodeScreen />}
      {view === 'enterName' && <EnterNameScreen />}
      {view === 'memberLobby' && <MemberLobby />}
      {view === 'game' && <GameScreen />}
      {view === 'end' && <EndScreen />}
    </div>
  );
}
