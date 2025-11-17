import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const httpServer = createServer(app);

// Get CORS origin from environment variable, default to localhost for development
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

app.use(helmet());
app.use(cors({
  origin: corsOrigin
}));
app.use(express.json());

// In-memory store for rooms
const rooms = new Map();

// Word categories
const wordCategories = {
  animals: ['elephant', 'giraffe', 'penguin', 'kangaroo', 'dolphin', 'octopus', 'butterfly', 'rhinoceros'],
  food: ['pizza', 'sushi', 'taco', 'burger', 'pasta', 'croissant', 'ramen', 'burrito'],
  objects: ['umbrella', 'telescope', 'guitar', 'camera', 'skateboard', 'backpack', 'laptop', 'headphones'],
  places: ['beach', 'mountain', 'library', 'museum', 'airport', 'stadium', 'theater', 'castle']
};

// Helper function to generate 6-digit game code
function generateGameCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to get unique game code
function getUniqueGameCode() {
  let code;
  do {
    code = generateGameCode();
  } while (Array.from(rooms.values()).some(room => room.gameCode === code));
  return code;
}

// Helper function to select random word from category
function getRandomWord(category, customWords = []) {
  let words;

  if (category === 'custom' && customWords.length > 0) {
    words = customWords;
  } else {
    words = wordCategories[category] || wordCategories.animals;
  }

  return words[Math.floor(Math.random() * words.length)];
}

// Helper function to get better random integer
function getSecureRandomInt(max) {
  // Use multiple random calls for better entropy
  const rand1 = Math.random();
  const rand2 = Math.random();
  const rand3 = Math.random();

  // Combine multiple random sources
  const combined = (rand1 + rand2 + rand3) / 3;
  return Math.floor(combined * max);
}

// Helper function to select random imposters
function selectImposters(players, numImposters) {
  const selectedIndices = new Set();
  const imposterIds = [];

  console.log(`🎲 Selecting ${numImposters} imposter(s) from ${players.length} players:`);
  players.forEach((p, idx) => console.log(`   [${idx}] ${p.name}`));

  // First, create a shuffled array for additional randomness
  const shuffledPlayers = [...players];
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
  }

  // Then randomly select from shuffled array
  let attempts = 0;
  while (selectedIndices.size < numImposters && attempts < 1000) {
    attempts++;
    const randomIndex = getSecureRandomInt(players.length);

    if (!selectedIndices.has(randomIndex)) {
      selectedIndices.add(randomIndex);
      imposterIds.push(shuffledPlayers[randomIndex].playerId);
      console.log(`   ✓ Selected index ${randomIndex}: ${shuffledPlayers[randomIndex].name}`);
    }
  }

  return imposterIds;
}

// API Routes

// Create a new room
app.post('/rooms', (req, res) => {
  const { hostName } = req.body;

  const roomId = uuidv4();
  const gameCode = getUniqueGameCode();
  const hostPlayer = {
    playerId: uuidv4(),
    name: hostName || 'Host',
    isHost: true,
    connected: false,
    eliminated: false
  };

  const room = {
    roomId,
    gameCode,
    status: 'lobby',
    players: [hostPlayer],
    settings: {
      numImposters: 1,
      category: 'animals',
      maxPlayers: 10,
      customWords: [],
      gameMode: 'online' // 'online' or 'local'
    },
    gameState: {
      phase: 'lobby',
      secretWord: null,
      imposterIds: [],
      clues: [],
      votes: {},
      readyPlayers: [],
      eliminatedPlayer: null,
      roundNumber: 0
    }
  };

  rooms.set(roomId, room);

  console.log(`✅ Room created - Code: ${gameCode}, Host: ${hostName}`);
  console.log(`   Active rooms: ${rooms.size}`);

  res.json({ roomId, gameCode, hostPlayer });
});

// Join an existing room
app.post('/rooms/join', (req, res) => {
  const { gameCode, playerName } = req.body;

  console.log(`🔍 Join attempt - Code: ${gameCode}, Player: ${playerName}`);
  console.log(`   Active rooms: ${rooms.size}`);
  console.log(`   Active codes: ${Array.from(rooms.values()).map(r => r.gameCode).join(', ')}`);

  // Find room by game code
  const room = Array.from(rooms.values()).find(r => r.gameCode === gameCode);

  if (!room) {
    console.log(`❌ Room not found for code: ${gameCode}`);
    return res.status(404).json({ error: 'Game not found' });
  }

  if (room.status !== 'lobby') {
    return res.status(400).json({ error: 'Game has already started' });
  }

  if (room.players.length >= room.settings.maxPlayers) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const player = {
    playerId: uuidv4(),
    name: playerName,
    isHost: false,
    connected: false,
    eliminated: false
  };

  room.players.push(player);

  console.log(`✅ ${playerName} joined room ${gameCode}`);
  console.log(`   Players in room: ${room.players.length}`);

  res.json({ roomId: room.roomId, player });
});

// Update room settings
app.patch('/rooms/:roomId/settings', (req, res) => {
  const { roomId } = req.params;
  const { numImposters, category, customWords, gameMode } = req.body;

  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (numImposters !== undefined) {
    room.settings.numImposters = numImposters;
  }
  if (category !== undefined) {
    room.settings.category = category;
  }
  if (customWords !== undefined) {
    room.settings.customWords = customWords;
  }
  if (gameMode !== undefined) {
    room.settings.gameMode = gameMode;
  }

  io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });

  res.json({ success: true });
});

// Helper to get public room data (without sensitive info)
function getRoomPublicData(room) {
  return {
    roomId: room.roomId,
    gameCode: room.gameCode,
    status: room.status,
    players: room.players.map(p => ({
      playerId: p.playerId,
      name: p.name,
      isHost: p.isHost,
      connected: p.connected,
      eliminated: p.eliminated || false
    })),
    settings: room.settings,
    gameState: {
      phase: room.gameState.phase,
      clues: room.gameState.clues,
      roundNumber: room.gameState.roundNumber
    }
  };
}

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('JOIN_ROOM', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    const player = room.players.find(p => p.playerId === playerId);

    if (!player) {
      socket.emit('ERROR', { message: 'Player not found' });
      return;
    }

    player.connected = true;
    socket.join(roomId);

    // Store player info in socket
    socket.data.roomId = roomId;
    socket.data.playerId = playerId;

    // Send room state to all players
    io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });

    // If game is in progress, send player their role
    if (room.gameState.phase !== 'lobby') {
      const isImposter = room.gameState.imposterIds.includes(playerId);
      socket.emit('ROLE_INFO', {
        role: isImposter ? 'imposter' : 'civilian',
        word: isImposter ? null : room.gameState.secretWord
      });
    }
  });

  socket.on('START_GAME', ({ roomId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    // Validate imposter count - only select from connected players
    const activePlayers = room.players.filter(p => p.connected);
    const maxImposters = activePlayers.length - 1;

    if (room.settings.numImposters >= activePlayers.length) {
      socket.emit('ERROR', {
        message: `Cannot have ${room.settings.numImposters} imposter(s) with ${activePlayers.length} player(s). Maximum is ${maxImposters}.`
      });
      return;
    }

    // Select imposters from ACTIVE (connected) players only
    console.log(`\n🎮 Starting game with ${activePlayers.length} players`);
    const imposterIds = selectImposters(activePlayers, room.settings.numImposters);
    console.log(`🎯 Final imposter IDs: ${imposterIds}\n`);

    // Select secret word
    const secretWord = getRandomWord(room.settings.category, room.settings.customWords);

    // Update game state
    room.gameState = {
      phase: 'clue',
      secretWord,
      imposterIds,
      clues: [],
      votes: {},
      readyPlayers: [],
      eliminatedPlayer: null,
      roundNumber: 1
    };
    room.status = 'playing';

    // Notify everyone phase changed
    io.to(roomId).emit('PHASE_CHANGED', { phase: 'clue' });

    // Send role info to each player individually
    room.players.forEach(player => {
      const playerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.data.playerId === player.playerId);

      if (playerSocket) {
        const isImposter = imposterIds.includes(player.playerId);
        playerSocket.emit('ROLE_INFO', {
          role: isImposter ? 'imposter' : 'civilian',
          word: isImposter ? null : secretWord
        });
      }
    });

    io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });
  });

  socket.on('SUBMIT_CLUE', ({ roomId, playerId, text }) => {
    const room = rooms.get(roomId);

    console.log(`📝 SUBMIT_CLUE - Player: ${playerId}, Phase: ${room?.gameState?.phase}, Room exists: ${!!room}`);

    if (!room) {
      console.log(`❌ Submit clue rejected - Room not found`);
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    if (room.gameState.phase !== 'clue') {
      console.log(`❌ Submit clue rejected - Phase is ${room.gameState.phase || 'undefined'}, expected 'clue'`);
      socket.emit('ERROR', { message: 'Invalid action' });
      return;
    }

    // Check if player is eliminated
    const player = room.players.find(p => p.playerId === playerId);
    if (!player) {
      console.log(`❌ Submit clue rejected - Player not found`);
      socket.emit('ERROR', { message: 'Player not found' });
      return;
    }

    if (player.eliminated) {
      socket.emit('ERROR', { message: 'Eliminated players cannot submit clues' });
      return;
    }

    // Filter out any clues from eliminated players (cleanup)
    const activePlayerIds = new Set(room.players.filter(p => p.connected && !p.eliminated).map(p => p.playerId));
    room.gameState.clues = room.gameState.clues.filter(clue => activePlayerIds.has(clue.playerId));

    // Check if this player already submitted a clue
    const existingClueIndex = room.gameState.clues.findIndex(c => c.playerId === playerId);
    if (existingClueIndex !== -1) {
      // Update existing clue
      room.gameState.clues[existingClueIndex] = {
        playerId,
        playerName: player.name,
        text
      };
    } else {
      // Add new clue
      room.gameState.clues.push({
        playerId,
        playerName: player.name,
        text
      });
    }

    console.log(`✅ Clue added. Total clues: ${room.gameState.clues.length}`);

    // Emit clue submitted
    io.to(roomId).emit('CLUE_SUBMITTED', { clues: room.gameState.clues });
    console.log(`📢 CLUE_SUBMITTED emitted to room. Clues: ${JSON.stringify(room.gameState.clues)}`);

    // Check if all active (non-eliminated) players submitted
    const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
    console.log(`   Active players: ${activePlayers.length}, Clues submitted: ${room.gameState.clues.length}`);

    if (room.gameState.clues.length >= activePlayers.length) {
      console.log(`✅ All clues submitted! Moving to discussion phase.`);
      room.gameState.phase = 'discussion';
      room.gameState.readyPlayers = []; // Reset ready tracking
      io.to(roomId).emit('PHASE_CHANGED', { phase: 'discussion' });
    }
  });

  socket.on('START_VOTING', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    if (room.gameState.phase !== 'discussion') {
      socket.emit('ERROR', { message: 'Not in discussion phase' });
      return;
    }

    // Check if player is eliminated
    const player = room.players.find(p => p.playerId === playerId);
    if (player?.eliminated) {
      socket.emit('ERROR', { message: 'Eliminated players cannot mark ready' });
      return;
    }

    // Mark player as ready (avoid duplicates)
    if (!room.gameState.readyPlayers.includes(playerId)) {
      room.gameState.readyPlayers.push(playerId);
    }

    // Check if all active (non-eliminated) players are ready
    const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
    const readyCount = room.gameState.readyPlayers.length;

    // Emit ready status update
    io.to(roomId).emit('READY_UPDATE', {
      readyCount,
      totalPlayers: activePlayers.length
    });

    // If everyone is ready, start voting
    if (readyCount >= activePlayers.length) {
      room.gameState.phase = 'voting';
      room.gameState.votes = {};
      room.gameState.readyPlayers = []; // Reset for next round

      io.to(roomId).emit('PHASE_CHANGED', { phase: 'voting' });
    }
  });

  socket.on('CAST_VOTE', ({ roomId, voterId, targetId }) => {
    const room = rooms.get(roomId);

    if (!room || room.gameState.phase !== 'voting') {
      socket.emit('ERROR', { message: 'Invalid action' });
      return;
    }

    // Check if player is eliminated
    const voter = room.players.find(p => p.playerId === voterId);
    if (voter?.eliminated) {
      socket.emit('ERROR', { message: 'Eliminated players cannot vote' });
      return;
    }

    // Record vote
    room.gameState.votes[voterId] = targetId;

    // Emit vote progress (exclude eliminated players)
    const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
    const votesReceived = Object.keys(room.gameState.votes).length;
    io.to(roomId).emit('VOTE_UPDATE', {
      votesReceived,
      totalVotes: activePlayers.length
    });

    // Check if all active (non-eliminated) votes are in
    if (votesReceived >= activePlayers.length) {
      // Tally votes
      const voteCounts = {};
      Object.values(room.gameState.votes).forEach(targetId => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      });

      // Find player with most votes
      let maxVotes = 0;
      let eliminatedPlayerId = null;
      const playersWithMaxVotes = [];

      Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedPlayerId = playerId;
          playersWithMaxVotes.length = 0;
          playersWithMaxVotes.push(playerId);
        } else if (count === maxVotes) {
          playersWithMaxVotes.push(playerId);
        }
      });

      // Check for tie
      if (playersWithMaxVotes.length > 1) {
        console.log(`🔄 Tie detected! ${playersWithMaxVotes.length} players with ${maxVotes} vote(s) each`);

        // Get player names for the tie
        const tiedPlayers = playersWithMaxVotes.map(id => {
          const player = room.players.find(p => p.playerId === id);
          return { playerId: id, name: player?.name };
        });

        // Emit tie result
        io.to(roomId).emit('VOTE_TIE', {
          tiedPlayers,
          voteCount: maxVotes
        });

        // Reset votes and go back to discussion
        room.gameState.votes = {};
        room.gameState.readyPlayers = [];
        room.gameState.phase = 'discussion';

        setTimeout(() => {
          io.to(roomId).emit('PHASE_CHANGED', { phase: 'discussion' });
        }, 5000); // Show tie screen for 5 seconds

        return;
      }

      const eliminatedPlayer = room.players.find(p => p.playerId === eliminatedPlayerId);
      const wasImposter = room.gameState.imposterIds.includes(eliminatedPlayerId);

      // Mark player as eliminated
      if (eliminatedPlayer) {
        eliminatedPlayer.eliminated = true;
        console.log(`💀 ${eliminatedPlayer.name} has been eliminated`);
      }

      room.gameState.eliminatedPlayer = {
        playerId: eliminatedPlayerId,
        name: eliminatedPlayer?.name,
        wasImposter
      };

      // Determine if game is over
      let gameOver = false;
      let winners = null;
      let remainingImpostersCount = 0;

      if (wasImposter) {
        // Check if all imposters eliminated
        const remainingImposters = room.gameState.imposterIds.filter(
          id => id !== eliminatedPlayerId
        );
        remainingImpostersCount = remainingImposters.length;

        if (remainingImpostersCount === 0) {
          gameOver = true;
          winners = 'civilians';
        }
      } else {
        // Voted out a civilian - check if imposters now outnumber civilians
        const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
        const remainingCivilians = activePlayers.filter(
          p => !room.gameState.imposterIds.includes(p.playerId)
        ).length;
        remainingImpostersCount = room.gameState.imposterIds.filter(
          id => !room.players.find(p => p.playerId === id)?.eliminated
        ).length;

        // Imposters win if they equal or outnumber civilians
        if (remainingImpostersCount >= remainingCivilians) {
          gameOver = true;
          winners = 'imposters';
        }
      }

      room.gameState.phase = 'reveal';

      io.to(roomId).emit('VOTE_RESULTS', {
        eliminatedPlayer: room.gameState.eliminatedPlayer,
        wasImposter,
        remainingImpostersCount,
        voteBreakdown: voteCounts
      });

      io.to(roomId).emit('PHASE_CHANGED', { phase: 'reveal' });

      if (gameOver) {
        setTimeout(() => {
          room.status = 'finished';
          io.to(roomId).emit('GAME_OVER', {
            winners,
            imposterIds: room.gameState.imposterIds,
            secretWord: room.gameState.secretWord
          });
        }, 3000);
      } else {
        // Continue to next round - game is not over yet
        if (wasImposter) {
          console.log(`🔄 Imposter eliminated! ${remainingImpostersCount} imposter(s) remain. Starting next round...`);
        } else {
          console.log(`🔄 Civilian eliminated! Game continues. ${remainingImpostersCount} imposter(s) vs civilians. Starting next round...`);
        }

        setTimeout(() => {
          // Reset for next round (keep same word AND same imposters!)
          room.gameState.clues = [];
          room.gameState.votes = {};
          room.gameState.readyPlayers = [];
          room.gameState.eliminatedPlayer = null;
          room.gameState.roundNumber += 1;
          room.gameState.phase = 'clue';
          // NOTE: imposterIds and secretWord are NOT reset - they persist for the entire game

          const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
          console.log(`🔄 Starting round ${room.gameState.roundNumber}`);
          console.log(`   Phase set to: ${room.gameState.phase}`);
          console.log(`   Secret word: ${room.gameState.secretWord}`);
          console.log(`   Imposters (unchanged): ${room.gameState.imposterIds.length}`);
          console.log(`   Active players: ${activePlayers.length}`);
          console.log(`   Clues reset: ${room.gameState.clues.length}`);

          // Notify everyone of the new round
          io.to(roomId).emit('PHASE_CHANGED', { phase: 'clue' });
          io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });

          // Send updated role info to each player
          room.players.forEach(player => {
            // Skip eliminated player
            if (player.playerId === eliminatedPlayerId) return;

            const playerSocket = Array.from(io.sockets.sockets.values())
              .find(s => s.data.playerId === player.playerId);

            if (playerSocket) {
              const isImposter = room.gameState.imposterIds.includes(player.playerId);
              playerSocket.emit('ROLE_INFO', {
                role: isImposter ? 'imposter' : 'civilian',
                word: isImposter ? null : room.gameState.secretWord
              });
            }
          });

          console.log(`✅ Round ${room.gameState.roundNumber} setup complete. Ready for clues.`);
        }, 5000); // Show reveal for 5 seconds before next round
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    const { roomId, playerId } = socket.data;

    if (roomId && playerId) {
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.playerId === playerId);
        if (player) {
          player.connected = false;
          io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`\n🎮 Imposter Game Server`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`⚠️  Note: All rooms are cleared when server restarts\n`);
});
