import { create } from 'zustand';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

const socket = io(SOCKET_URL);

export const useGameStore = create((set, get) => ({
  // Connection state
  socket,

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
      otherImpostersCount: 0
    });
  },

  // Socket event handlers
  initializeSocket: () => {
    const { roomId, playerId } = get();

    // Remove existing listeners to prevent duplicates
    socket.off('ROOM_UPDATED');
    socket.off('PHASE_CHANGED');
    socket.off('ROLE_INFO');
    socket.off('CLUE_SUBMITTED');
    socket.off('VOTE_UPDATE');
    socket.off('READY_UPDATE');
    socket.off('VOTE_TIE');
    socket.off('VOTE_RESULTS');
    socket.off('GAME_OVER');
    socket.off('ERROR');

    socket.on('ROOM_UPDATED', ({ room }) => {
      console.log('📥 ROOM_UPDATED received. Clues:', room.gameState?.clues);
      set({
        players: room.players,
        settings: room.settings,
        clues: room.gameState?.clues || []
      });
    });

    socket.on('PHASE_CHANGED', ({ phase }) => {
      set({ phase });
    });

    socket.on('ROLE_INFO', ({ role, word, category, numImposters, otherImpostersCount }) => {
      set({ 
        role, 
        secretWord: word,
        category: category || null,
        numImposters: numImposters || 0,
        otherImpostersCount: otherImpostersCount || 0
      });
    });

    socket.on('CLUE_SUBMITTED', ({ clues }) => {
      console.log('📥 CLUE_SUBMITTED received. Clues:', clues);
      set({ clues });
    });

    socket.on('VOTE_UPDATE', ({ votesReceived, totalVotes }) => {
      set({ votes: { votesReceived, totalVotes } });
    });

    socket.on('READY_UPDATE', ({ readyCount, totalPlayers }) => {
      set({ readyPlayers: { readyCount, totalPlayers } });
    });

    socket.on('VOTE_TIE', ({ tiedPlayers, voteCount }) => {
      set({
        phase: 'tie',
        tiedPlayers,
        voteCount
      });
    });

    socket.on('VOTE_RESULTS', ({ eliminatedPlayer, wasImposter, remainingImpostersCount }) => {
      set({ eliminatedPlayer, remainingImpostersCount });
    });

    socket.on('GAME_OVER', ({ winners, imposterIds, secretWord }) => {
      set({
        phase: 'gameOver',
        winners,
        imposterIds,
        secretWord
      });
    });

    socket.on('ERROR', ({ message }) => {
      console.error('❌ Socket error:', message);
      console.error('Error context:', { roomId: get().roomId, playerId: get().playerId, role: get().role, phase: get().phase });
      alert(message);
    });
  },

  joinRoom: (roomId, playerId) => {
    socket.emit('JOIN_ROOM', { roomId, playerId });
  },

  startGame: () => {
    const { roomId } = get();
    if (!roomId) {
      console.error('Cannot start game: roomId is missing');
      alert('Error: Not connected to a room. Please try refreshing the page.');
      return;
    }
    
    // Check if socket is connected
    if (!socket.connected) {
      console.error('Socket not connected. Attempting to reconnect...');
      socket.connect();
      // Wait a moment for connection
      setTimeout(() => {
        if (socket.connected) {
          console.log('Socket reconnected. Starting game...');
          socket.emit('START_GAME', { roomId });
        } else {
          alert('Error: Cannot connect to server. Please check if the backend is running and refresh the page.');
        }
      }, 1000);
      return;
    }
    
    console.log('Starting game with roomId:', roomId);
    socket.emit('START_GAME', { roomId });
  },

  submitClue: (text) => {
    const { roomId, playerId } = get();
    console.log('📤 Submitting clue:', { roomId, playerId, text });
    socket.emit('SUBMIT_CLUE', { roomId, playerId, text });
  },

  startVoting: () => {
    const { roomId, playerId } = get();
    socket.emit('START_VOTING', { roomId, playerId });
  },

  castVote: (targetId) => {
    const { roomId, playerId, role } = get();
    console.log('📤 Casting vote:', { roomId, playerId, targetId, role });
    socket.emit('CAST_VOTE', { roomId, voterId: playerId, targetId });
  },

  nextRound: () => {
    const { roomId, playerId } = get();
    socket.emit('NEXT_ROUND', { roomId, playerId });
  },

  endGame: () => {
    const { roomId, playerId } = get();
    socket.emit('END_GAME', { roomId, playerId });
  },

  restartGame: () => {
    const { roomId, playerId } = get();
    socket.emit('RESTART_GAME', { roomId, playerId });
  }
}));
