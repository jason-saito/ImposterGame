import { create } from 'zustand';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

// Lazy socket initialization - only create socket when needed
let socket = null;

const getSocket = () => {
  if (!socket) {
    console.log('🔌 Initializing socket connection to', SOCKET_URL);
    socket = io(SOCKET_URL);
  }
  return socket;
};

export const useGameStore = create((set, get) => ({
  // Connection state
  get socket() {
    return getSocket();
  },

  // Player state
  playerId: localStorage.getItem('playerId') || null,
  playerName: localStorage.getItem('playerName') || '',
  isHost: false,

  // Room state
  roomId: null,
  gameCode: null,
  players: [],

  // Game state
  phase: 'landing', // landing, lobby, clue, discussion, voting, reveal, tie, gameOver
  role: null, // 'civilian' or 'imposter'
  secretWord: null,
  clues: [],
  votes: {},
  readyPlayers: { readyCount: 0, totalPlayers: 0 },
  eliminatedPlayer: null,
  remainingImpostersCount: 0,
  tiedPlayers: null,
  voteCount: null,
  winners: null,
  imposterIds: [],
  category: null,
  numImposters: 0,
  otherImpostersCount: 0,
  playerOrder: [],
  roundNumber: 0,
  gameOverReason: null,

  // Settings
  settings: {
    numImposters: 1,
    category: 'animals',
    maxPlayers: 10,
    gameMode: 'online'
  },

  // Actions
  setPlayerId: (playerId) => {
    localStorage.setItem('playerId', playerId);
    set({ playerId });
  },

  setPlayerName: (playerName) => {
    localStorage.setItem('playerName', playerName);
    set({ playerName });
  },

  setRoomData: (roomId, gameCode, isHost = false) => {
    set({ roomId, gameCode, isHost });
  },

  setPhase: (phase) => set({ phase }),

  setRole: (role, secretWord = null) => {
    set({ role, secretWord });
  },

  setPlayers: (players) => set({ players }),

  setClues: (clues) => set({ clues }),

  setSettings: (settings) => set({ settings }),

  updateVoteProgress: (votesReceived, totalVotes) => {
    set({ votes: { votesReceived, totalVotes } });
  },

  setEliminatedPlayer: (eliminatedPlayer) => set({ eliminatedPlayer }),

  setGameOver: (winners, imposterIds, secretWord) => {
    set({ phase: 'gameOver', winners, imposterIds, secretWord });
  },

  setPhase: (phase) => set({ phase }),

  resetGame: () => {
    set({
      roomId: null,
      gameCode: null,
      players: [],
      phase: 'landing',
      role: null,
      secretWord: null,
      clues: [],
      votes: {},
      readyPlayers: { readyCount: 0, totalPlayers: 0 },
      eliminatedPlayer: null,
      remainingImpostersCount: 0,
      tiedPlayers: null,
      voteCount: null,
      winners: null,
      imposterIds: [],
      isHost: false,
      category: null,
      numImposters: 0,
      otherImpostersCount: 0,
      playerOrder: [],
      roundNumber: 0,
      gameOverReason: null
    });
  },

  // Socket event handlers
  initializeSocket: () => {
    const { roomId, playerId } = get();
    const sock = getSocket();

    // Remove existing listeners to prevent duplicates
    sock.off('ROOM_UPDATED');
    sock.off('PHASE_CHANGED');
    sock.off('ROLE_INFO');
    sock.off('CLUE_SUBMITTED');
    sock.off('VOTE_UPDATE');
    sock.off('READY_UPDATE');
    sock.off('VOTE_TIE');
    sock.off('VOTE_RESULTS');
    sock.off('GAME_OVER');
    sock.off('ERROR');

    sock.on('ROOM_UPDATED', ({ room }) => {
      console.log('📥 ROOM_UPDATED received. Clues:', room.gameState?.clues, 'Round:', room.gameState?.roundNumber);
      set({
        players: room.players,
        settings: room.settings,
        clues: room.gameState?.clues || [],
        playerOrder: room.gameState?.playerOrder || [],
        roundNumber: room.gameState?.roundNumber || 0
      });
    });

    sock.on('PHASE_CHANGED', ({ phase }) => {
      console.log('📥 PHASE_CHANGED:', phase);
      set({ phase });

      // If phase changed to lobby, clear game-specific state
      if (phase === 'lobby') {
        console.log('🔄 Clearing game state and returning to lobby');
        set({
          role: null,
          secretWord: null,
          clues: [],
          votes: {},
          readyPlayers: { readyCount: 0, totalPlayers: 0 },
          eliminatedPlayer: null,
          remainingImpostersCount: 0,
          tiedPlayers: null,
          voteCount: null,
          winners: null,
          imposterIds: [],
          category: null,
          numImposters: 0,
          otherImpostersCount: 0,
          playerOrder: [],
          roundNumber: 0
        });
      }
    });

    sock.on('ROLE_INFO', ({ role, word, category, numImposters, otherImpostersCount }) => {
      set({
        role,
        secretWord: word,
        category: category || null,
        numImposters: numImposters || 0,
        otherImpostersCount: otherImpostersCount || 0
      });
    });

    sock.on('CLUE_SUBMITTED', ({ clues }) => {
      console.log('📥 CLUE_SUBMITTED received. Clues:', clues);
      set({ clues });
    });

    sock.on('VOTE_UPDATE', ({ votesReceived, totalVotes }) => {
      set({ votes: { votesReceived, totalVotes } });
    });

    sock.on('READY_UPDATE', ({ readyCount, totalPlayers }) => {
      set({ readyPlayers: { readyCount, totalPlayers } });
    });

    sock.on('VOTE_TIE', ({ tiedPlayers, voteCount }) => {
      set({
        phase: 'tie',
        tiedPlayers,
        voteCount
      });
    });

    sock.on('VOTE_RESULTS', ({ eliminatedPlayer, wasImposter, remainingImpostersCount }) => {
      set({ eliminatedPlayer, remainingImpostersCount });
    });

    sock.on('GAME_OVER', ({ winners, imposterIds, secretWord, reason }) => {
      console.log('📥 GAME_OVER received:', { winners, imposterIds, secretWord, reason });
      set({
        phase: 'gameOver',
        winners: winners || null,
        imposterIds: imposterIds || [],
        secretWord: secretWord || null,
        gameOverReason: reason || null
      });
    });

    sock.on('ERROR', ({ message }) => {
      console.error('❌ Socket error:', message);
      console.error('Error context:', { roomId: get().roomId, playerId: get().playerId, role: get().role, phase: get().phase });
      alert(message);
    });
  },

  joinRoom: (roomId, playerId) => {
    getSocket().emit('JOIN_ROOM', { roomId, playerId });
  },

  startGame: () => {
    const { roomId } = get();
    const sock = getSocket();
    if (!roomId) {
      console.error('Cannot start game: roomId is missing');
      alert('Error: Not connected to a room. Please try refreshing the page.');
      return;
    }

    // Check if socket is connected
    if (!sock.connected) {
      console.error('Socket not connected. Attempting to reconnect...');
      sock.connect();
      // Wait a moment for connection
      setTimeout(() => {
        if (sock.connected) {
          console.log('Socket reconnected. Starting game...');
          sock.emit('START_GAME', { roomId });
        } else {
          alert('Error: Cannot connect to server. Please check if the backend is running and refresh the page.');
        }
      }, 1000);
      return;
    }

    console.log('Starting game with roomId:', roomId);
    sock.emit('START_GAME', { roomId });
  },

  submitClue: (text) => {
    const { roomId, playerId } = get();
    console.log('📤 Submitting clue:', { roomId, playerId, text });
    getSocket().emit('SUBMIT_CLUE', { roomId, playerId, text });
  },

  startVoting: () => {
    const { roomId, playerId } = get();
    getSocket().emit('START_VOTING', { roomId, playerId });
  },

  castVote: (targetId) => {
    const { roomId, playerId, role } = get();
    console.log('📤 Casting vote:', { roomId, playerId, targetId, role });
    getSocket().emit('CAST_VOTE', { roomId, voterId: playerId, targetId });
  },

  nextRound: () => {
    const { roomId, playerId } = get();
    getSocket().emit('NEXT_ROUND', { roomId, playerId });
  },

  endGame: () => {
    const { roomId, playerId } = get();
    getSocket().emit('END_GAME', { roomId, playerId });
  },

  restartGame: () => {
    const { roomId, playerId } = get();
    getSocket().emit('RESTART_GAME', { roomId, playerId });
  },

  resetToLobby: () => {
    const { roomId, playerId } = get();
    getSocket().emit('RESET_TO_LOBBY', { roomId, playerId });
  }
}));
