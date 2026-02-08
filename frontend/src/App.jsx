import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import Particles from './Particles.jsx';

export default function App() {
  const API_BASE = useMemo(() => (import.meta.env.VITE_API_BASE || ''), []);
  const MAX_ROUNDS = 5;

  // Theme colors
 const themeColors = {
  scifi: {
    logo: 'rgb(135, 206, 235)',
    primary: 'rgb(135, 206, 235)',
    secondary: '#e9fcff',
    accent: '#00838F'
  },
  romance: {
    logo: '#ffb4da',
    primary: '#ffb4da',
    secondary: '#ffdaec',
    accent: '#C41E3A'
  },
  mystery: {
    logo: '#663399', // purple
    primary: '#ccb3ff',
    secondary: '#e1d2ff',
    accent: '#663399'
  },
  adventure: {
    logo: '#FFB347',
    primary: '#ffd6a3',
    secondary: '#ffe5c0',
    accent: '#FF6347'
  }
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
    <div className="screen-card" style={{borderTopColor: colors.primary}}>

  <h1 className="logo" style={{ color: colors.logo }}>
    CROWDSTORY
  </h1>
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
        background: colors.primary
      }}>LEAVE GROUP</button>
      <h1 className="logo" style={{
        fontSize: '2.5rem',
        color: colors.primary
      }}>CROWDSTORY</h1>

      <h3>CODE: {roomCode}</h3>

      <div className="player-list">
        {players.map((p) => (
          <div key={p.id} className={`player-chip ${p.isHost ? 'host-chip' : ''}`}
            style={p.isHost ? { background: colors.secondary, borderColor: colors.primary } : {}}>
            <img
          src= "public/Person.png"
          alt="host"
          style={{
            width: "20px",
            marginRight: "6px",
            verticalAlign: "middle"
          }}/>
            {p.name} {p.isHost ? '(HOST)' : ''}
          </div>
        ))}
      </div>

      {/* Story Theme Selection */}
      <div style={{marginTop: '20px', marginBottom: '20px', width: '100%', maxWidth: '320px'}}>
        <p style={{fontSize: '0.9rem', color: '#373737', marginBottom: '10px'}}>Choose Genre:</p>
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
        background: colors.primary
      }}>BACK</button>
      <h1 className="logo" style={{
        fontSize: '1.5rem',
        color: colors.primary
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
        background: colors.primary
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
          <img
          src= "public/Person.png"
          alt="host"
          style={{
            width: "16px",
            marginRight: "6px",
            verticalAlign: "middle"
          }}/>
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
        fontSize: '2.2rem',
        alignSelf: 'center',
        color: colors.primary
      }}>CROWDSTORY</h1>

      {gameState?.lastWinner && (
        <p style={{ marginTop: '10px', color: colors.accent, alignSelf: 'center' }}>
          Last round winner: {gameState.lastWinner}
        </p>
      )}

      <p style={{ marginTop: '10px', color: '#888', alignSelf: 'center', fontFamily: 'Actor' }}>
        Scene {gameState?.currentRound || 1} • Time left: {timer}s
      </p>

      {/* Story Text */}
      <div style={{fontSize: '1rem', margin: '20px 0', lineHeight: '1.5', maxWidth: '320px', textAlign: 'left', fontFamily: 'Actor'}}>
        {displayedText || 'Loading story...'}
      </div>

      {(imageLoading || imageError || imageUrl) && (
        <div style={{ margin: '10px 0', width: '100%', maxWidth: '320px' }}>
          {imageLoading && <p style={{ color: '#888' }}>Generating image...</p>}
          {imageError && <p style={{ color: '#c0392b' }}>{imageError}</p>}
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
      <div style={{width: '100%', maxWidth: '320px', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Actor'}}>
        {(gameState?.currentChoices || []).map((choice) => {
          const label = choice?.trim().charAt(0).toUpperCase();
          const count = voteCounts[label] ?? 0;
          const [poppingChoice, setPoppingChoice] = useState(null);

          return (
            <button
              key={choice}
              className="choice-btn"
              onClick={() => {
                submitVote(label);
                setPoppingChoice(label);
                setTimeout(() => setPoppingChoice(null), 160);
              }}
              style={{
                background: colors.secondary,
                borderColor: colors.primary,
                color: colors.accent,
                border: selectedChoice === label
                  ? `2px solid ${colors.accent}`
                  : `2px solid ${colors.primary}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "10px 14px",
                fontSize: "0.95rem",
                fontFamily: 'Actor',
              }}
            >
              <span>{choice}</span>

              <span
              style={{
                minWidth: "24px",
                height: "24px",
                borderRadius: "50%",
                background: colors.primary,
                color: colors.secondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",

                // animation part
                transform: poppingChoice === label ? "scale(1.6)" : "scale(1)",
                transition: "transform 0.18s cubic-bezier(.34,1.56,.64,1)"
              }}
            >
              {count}
            </span>
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
        color: colors.primary
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
    <div className="app-shell">
      <div className="particles-layer">
        <Particles
          particleColors={[getThemeColor(storyTheme).primary, '#ffffff']}
          particleCount={160}
          particleSpread={8}
          speed={0.08}
          particleBaseSize={140}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={window.devicePixelRatio || 1}
        />
      </div>

      <div className="app-container">
        {view === 'home' && <HomeScreen />}
        {view === 'hostLobby' && <HostLobby />}
        {view === 'enterCode' && <EnterCodeScreen />}
        {view === 'memberLobby' && <MemberLobby />}
        {view === 'game' && <GameScreen />}
        {view === 'end' && <EndScreen />}
      </div>
    </div>
  );
}
