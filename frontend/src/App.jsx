import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './App.css';

export default function App() {
  const API_BASE = useMemo(() => (import.meta.env.VITE_API_BASE || ''), []);
  const MAX_ROUNDS = 5;

  // Theme colors
  const themeColors = {
    scifi: { primary: '#87CEEB', secondary: '#B0E0E6', accent: '#00838F' },
    romance: { primary: '#FF69B4', secondary: '#FFB6D9', accent: '#C41E3A' },
    mystery: { primary: '#9370DB', secondary: '#B19CD9', accent: '#663399' },
    adventure: { primary: '#FF8C00', secondary: '#FFB347', accent: '#FF6347' }
  };

  const getThemeColor = (theme) => themeColors[theme] || themeColors.scifi;

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
  const [displayedText, setDisplayedText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [storyTheme, setStoryTheme] = useState('scifi');
  const gameCardRef = useRef(null);
  const gameScrollTopRef = useRef(0);

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
    setImageUrl('');
    setImageLoading(false);
    setImageError('');
    setStoryTheme('scifi');
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

  const playSound = (type = 'click') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = type === 'success' ? 880 : 440;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      osc.onended = () => ctx.close();
    } catch {
      // ignore audio errors
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

  const validateRoomCode = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return false;
    }
    setLoading(true);
    try {
      await apiRequest(`/api/party/${roomCode.trim()}`);
      setError('');
      return true;
    } catch {
      setError('Party not found');
      return false;
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
        body: JSON.stringify({ partyCode: roomCode, theme: storyTheme })
      });
      setGameState(data.gameState);
      setVoteCounts(data.gameState.voteCounts || { A: 0, B: 0, C: 0 });
      setSelectedChoice('');
      setTimer(30);
      setImageUrl('');
      setImageLoading(false);
      setImageError('');
      setView('game');
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (choice) => {
    if (!roomCode || !choice) return;
    setImageLoading(true);
    setImageError('');
    try {
      const data = await apiRequest('/api/game/image', {
        method: 'POST',
        body: JSON.stringify({ partyCode: roomCode, choice })
      });
      setImageUrl(data.imageDataUrl || '');
      // Don't show error if no image - graceful degradation
      if (data.error && data.error !== 'No API key') {
        setImageError(data.error);
      }
    } catch (err) {
      // Only show critical errors, not image generation failures
      if (!err.message.includes('Image') && !err.message.includes('Empty response')) {
        setImageError(err.message || 'Error loading image');
      }
    } finally {
      setImageLoading(false);
    }
  };

  const submitVote = async (choice) => {
    if (!roomCode || !playerId || !choice) return;
    playSound('click');
    setSelectedChoice(choice);
    const data = await apiRequest('/api/game/vote', {
      method: 'POST',
      body: JSON.stringify({ partyCode: roomCode, playerId, choice })
    });
    setVoteCounts(data.voteCounts || { A: 0, B: 0, C: 0 });
    generateImage(choice);
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
      setImageUrl('');
      setImageLoading(false);
      setImageError('');
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
    gameScrollTopRef.current = 0;
    if (gameCardRef.current) {
      gameCardRef.current.scrollTop = 0;
    }
  }, [view, gameState?.currentRound]);

  useEffect(() => {
    if (view !== 'game') return;
    setImageUrl('');
    setImageLoading(false);
    setImageError('');
  }, [view, gameState?.currentRound]);

  useEffect(() => {
    if (view !== 'game') return;
    const story = gameState?.currentStory || '';
    if (!story) {
      setDisplayedText('');
      return;
    }
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(story.slice(0, i));
      if (i >= story.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [view, gameState?.currentStory]);

  useLayoutEffect(() => {
    if (view !== 'game') return;
    const el = gameCardRef.current;
    if (!el) return;
    if (el.scrollTop !== gameScrollTopRef.current) {
      el.scrollTop = gameScrollTopRef.current;
    }
  }, [view, displayedText, imageUrl, imageLoading]);

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
  const HomeScreen = () => {
    const colors = getThemeColor(storyTheme);
    return (
    <div
      className="screen-card"
      style={{borderTopColor: colors.primary}}
      ref={gameCardRef}
      onScroll={(e) => {
        gameScrollTopRef.current = e.currentTarget.scrollTop;
      }}
    >
      <h1 className="logo" style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>CROWDSTORY</h1>
      <p className="subtitle">A party RPG game to play with your friends!</p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <input
        type="text"
        placeholder="Your Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />

      <button className="btn-primary" onClick={() => {
        if (!loading) createParty();
      }}>{loading ? 'CREATING...' : 'CREATE PARTY'}</button>

      <button className="btn-primary btn-secondary" onClick={() => {
        if (!username.trim()) {
          setError('Please enter your name');
          return;
        }
        setError('');
        setView('enterCode');
      }}>
        JOIN PARTY
      </button>
    </div>
    );
  };

  // 2. HOST LOBBY
  const HostLobby = () => {
    const colors = getThemeColor(storyTheme);
    return (
    <div className="screen-card" style={{borderTopColor: colors.primary}}>
      <button className="btn-primary btn-red" onClick={leaveParty} style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
      }}>LEAVE GROUP</button>
      <h1 className="logo" style={{
        fontSize: '1.5rem',
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>CROWDSTORY</h1>

      <h3>CODE: {roomCode}</h3>

      <div className="player-list">
        {players.map((p) => (
          <div key={p.id} className={`player-chip ${p.isHost ? 'host-chip' : ''}`}
            style={p.isHost ? { background: colors.secondary, borderColor: colors.primary } : {}}
          >
            {p.name} {p.isHost ? '(HOST)' : ''}
          </div>
        ))}
      </div>

      {/* Story Theme Selection */}
      <div style={{marginTop: '20px', marginBottom: '20px', width: '100%', maxWidth: '320px'}}>
        <p style={{fontSize: '0.9rem', color: '#888', marginBottom: '10px'}}>Choose Story Theme:</p>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
          {['scifi', 'romance', 'mystery', 'adventure'].map((theme) => {
            const themeColor = getThemeColor(theme);
            return (
            <button
              key={theme}
              onClick={() => setStoryTheme(theme)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: storyTheme === theme ? `2px solid ${themeColor.primary}` : '1px solid #ddd',
                background: storyTheme === theme ? themeColor.secondary : '#f5f5f5',
                color: storyTheme === theme ? themeColor.accent : '#888',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textTransform: 'capitalize'
              }}
            >
              {theme}
            </button>
            );
          })}
        </div>
      </div>

      <div style={{marginTop: 'auto'}}>
        <button 
          className="btn-primary" 
          onClick={startGame} 
          disabled={loading}
          style={{ background: colors.primary }}
        >
          {loading ? 'STARTING...' : 'START GAME'}
        </button>
      </div>
    </div>
    );
  };

  // 3. ENTER CODE (Member View)
  const EnterCodeScreen = () => {
    const colors = getThemeColor(storyTheme);
    return (
    <div className="screen-card" style={{borderTopColor: colors.primary}}>
      <button className="btn-primary btn-red" onClick={() => setView('home')} style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
      }}>BACK</button>
      <h1 className="logo" style={{
        fontSize: '1.5rem',
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>CROWDSTORY</h1>
      <div style={{marginTop: '3rem'}}>
        <h3>ENTER ROOM CODE</h3>
        <p style={{color: '#888', fontSize: '0.9rem'}}>Playing as: <strong>{username}</strong></p>
        {error && <p style={{ color: '#c0392b' }}>{error}</p>}
        <input
          type="text"
          placeholder="ex. DEVFEST2026"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          autoFocus
        />
        <button className="btn-primary" onClick={joinParty} disabled={loading}>
          {loading ? 'JOINING...' : 'JOIN PARTY'}
        </button>
      </div>
    </div>
    );
  };



  // 5. MEMBER LOBBY
  const MemberLobby = () => {
    const colors = getThemeColor(storyTheme);
    return (
    <div className="screen-card" style={{borderTopColor: colors.primary}}>
      <button className="btn-primary btn-red" onClick={leaveParty} style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
      }}>LEAVE GROUP</button>
      <h1 className="logo" style={{
        fontSize: '1.5rem',
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>CROWDSTORY</h1>
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
  };

  // 6. GAME SCREEN (The Story)
  const GameScreen = () => {
    const colors = getThemeColor(storyTheme);
    return (
    <div className="screen-card" style={{borderTopColor: colors.primary}}>
      <button 
        className="btn-primary btn-red" 
        onClick={() => resetSession()} 
        style={{background: colors.accent, fontSize: '0.8rem', padding: '6px 12px', alignSelf: 'flex-start'}}
      >
        ← EXIT
      </button>
      
      <h1 className="logo" style={{
        fontSize: '1.2rem',
        alignSelf: 'center',
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>CROWDSTORY</h1>

      {gameState?.lastWinner && (
        <p style={{ marginTop: '10px', color: colors.accent, alignSelf: 'center' }}>
          Last round winner: {gameState.lastWinner}
        </p>
      )}

      <p style={{ marginTop: '10px', color: '#888', alignSelf: 'center' }}>
        Round {gameState?.currentRound || 1} • Time left: {timer}s
      </p>

      {/* Story Text */}
      <div style={{fontSize: '1rem', margin: '20px 0', lineHeight: '1.5', maxWidth: '320px', textAlign: 'left'}}>
        {displayedText || 'Loading story...'}
      </div>

      {(imageLoading || imageUrl) && (
        <div style={{ margin: '10px 0', width: '100%', maxWidth: '320px' }}>
          {imageLoading && <p style={{ color: '#888' }}>Generating image...</p>}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Story scene"
              className="story-image"
            />
          )}
        </div>
      )}

      {/* Choices */}
      <div className="choices-section" style={{width: '100%', maxWidth: '320px', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {(gameState?.currentChoices || []).map((choice) => {
          const label = choice?.trim().charAt(0).toUpperCase();
          const count = voteCounts[label] ?? 0;
          return (
            <button
              key={choice}
              onClick={() => submitVote(label)}
              className="choice-btn"
              style={{
                background: colors.secondary,
                borderColor: colors.primary,
                color: colors.accent,
                border: selectedChoice === label ? `2px solid ${colors.accent}` : `2px solid ${colors.primary}`
              }}
            >
              {choice} ({count})
            </button>
          );
        })}
      </div>

      {isHost && (
        <button 
          className="btn-primary" 
          style={{marginTop: '20px', background: colors.primary}} 
          onClick={nextRound} 
          disabled={loading}
        >
          {loading ? 'ADVANCING...' : 'NEXT ROUND'}
        </button>
      )}
    </div>
    );
  };

  // 7. END SCREEN
  const EndScreen = () => {
    const colors = getThemeColor(storyTheme);
    return (
    <div className="screen-card" style={{borderTopColor: colors.primary}}>
      <button className="btn-primary btn-red" onClick={resetSession}>HOME</button>
      <h1 className="logo" style={{
        fontSize: '1.5rem',
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>CROWDSTORY</h1>

      <h2 style={{color: '#555'}}>YOUR ENDING</h2>

      <div style={{background: '#eee', padding: '20px', borderRadius: '10px', fontSize: '1rem', lineHeight: '1.4'}}>
        {gameState?.currentStory || 'Thanks for playing!'}
      </div>

      <button className="btn-primary" style={{marginTop: 'auto'}} onClick={resetSession}>PLAY AGAIN</button>
    </div>
    );
  };

  // --- RENDER CONTROLLER ---
  return (
    <div className="app-container">
      {view === 'home' && <HomeScreen />}
      {view === 'hostLobby' && <HostLobby />}
      {view === 'enterCode' && <EnterCodeScreen />}
      {view === 'memberLobby' && <MemberLobby />}
      {view === 'game' && <GameScreen />}
      {view === 'end' && <EndScreen />}
    </div>
  );
}
