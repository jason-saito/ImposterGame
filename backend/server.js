import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

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
  animals: [
    'elephant', 'giraffe', 'penguin', 'kangaroo', 'dolphin', 'octopus', 'butterfly', 'rhinoceros', 'tiger', 'panda', 'zebra', 'whale',
    'lion', 'cheetah', 'hippopotamus', 'gorilla', 'chimpanzee', 'sloth', 'koala', 'ostrich', 'flamingo', 'eagle', 'falcon', 'hawk',
    'shark', 'seal', 'walrus', 'otter', 'fox', 'wolf', 'bear', 'camel', 'alligator', 'crocodile', 'jellyfish', 'starfish', 'lobster',
    'crab', 'squid', 'anteater', 'armadillo', 'buffalo', 'moose', 'reindeer', 'horse', 'donkey', 'goat', 'sheep', 'pig', 'cow', 'chicken',
    'rooster', 'peacock', 'sparrow', 'parrot', 'toucan', 'swan', 'turkey', 'beaver', 'badger', 'hedgehog', 'porcupine', 'raccoon',
    'lemur', 'meerkat', 'hyena', 'mongoose'
  ],
  food: [
    'pizza', 'sushi', 'taco', 'burger', 'pasta', 'croissant', 'ramen', 'burrito', 'sandwich', 'salad', 'soup', 'donut',
    'steak', 'fried rice', 'pancakes', 'waffles', 'ice cream', 'chocolate', 'cupcake', 'lasagna', 'dumplings', 'noodles',
    'quesadilla', 'pretzel', 'hot dog', 'popcorn', 'cereal', 'oatmeal', 'smoothie', 'cookie', 'brownie', 'macarons',
    'spring rolls', 'pad thai', 'curry', 'paella', 'kebab', 'shawarma', 'gnocchi', 'risotto', 'bagel', 'fajitas', 'kimchi',
    'bibimbap', 'pho', 'samosa'
  ],
  objects: [
    'umbrella', 'telescope', 'guitar', 'camera', 'skateboard', 'backpack', 'laptop', 'headphones', 'watch', 'phone', 'book', 'key',
    'wallet', 'flashlight', 'calculator', 'speaker', 'microphone', 'pillow', 'blanket', 'chair', 'table', 'mirror', 'clock', 'pen',
    'pencil', 'marker', 'notebook', 'scissors', 'ruler', 'remote', 'charger', 'helmet', 'glasses', 'bottle', 'mug', 'suitcase',
    'ladder', 'drill', 'hammer', 'wrench', 'globe', 'lantern', 'binoculars', 'toaster', 'microwave', 'vacuum', 'basket'
  ],
  places: [
    'beach', 'mountain', 'library', 'museum', 'airport', 'stadium', 'theater', 'castle', 'park', 'school', 'hospital', 'restaurant',
    'zoo', 'aquarium', 'forest', 'desert', 'island', 'city', 'village', 'bridge', 'harbor', 'hotel', 'mall', 'market', 'farm',
    'campground', 'palace', 'temple', 'church', 'university', 'playground', 'subway', 'station', 'amusement park', 'skyscraper',
    'cafe', 'bakery', 'train station', 'bus stop', 'pier', 'canyon', 'valley', 'waterfall'
  ],
  sports: [
    'basketball', 'football', 'soccer', 'tennis', 'baseball', 'swimming', 'cycling', 'running', 'golf', 'volleyball', 'hockey', 'boxing',
    'badminton', 'table tennis', 'rugby', 'cricket', 'skiing', 'snowboarding', 'surfing', 'skating', 'wrestling', 'archery', 'fencing',
    'rowing', 'kayaking', 'canoeing', 'climbing', 'gymnastics', 'triathlon', 'martial arts', 'lacrosse', 'handball', 'softball'
  ],
  colors: [
    'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'brown', 'gray', 'gold',
    'silver', 'maroon', 'turquoise', 'teal', 'navy', 'beige', 'lavender', 'lime', 'coral', 'magenta', 'cyan'
  ],
  movies: [
    'action', 'comedy', 'horror', 'drama', 'sci-fi', 'romance', 'thriller', 'fantasy', 'animation', 'documentary', 'western', 'musical',
    'crime', 'mystery', 'adventure', 'biography', 'history', 'war', 'family', 'superhero', 'noir'
  ],
  nature: [
    'tree', 'flower', 'ocean', 'forest', 'river', 'cloud', 'sun', 'moon', 'star', 'rain', 'snow', 'wind',
    'lightning', 'mountain', 'desert', 'cave', 'volcano', 'waterfall', 'meadow', 'leaf', 'sand', 'stone', 'fog', 'thunder',
    'cliff', 'lake', 'reef', 'tide', 'breeze', 'ice', 'glacier', 'field'
  ]
};

// Helper function to generate 2-digit game code
function generateGameCode() {
  return Math.floor(10 + Math.random() * 90).toString().padStart(2, '0');
}

// Helper function to get unique game code
function getUniqueGameCode() {
  let code;
  do {
    code = generateGameCode();
  } while (Array.from(rooms.values()).some(room => room.gameCode === code));
  return code;
}

// Helper function to select random word from category using secure randomization
function getRandomWord(category, customWords = []) {
  let words;

  if (category === 'custom' && customWords.length > 0) {
    words = customWords;
  } else {
    words = wordCategories[category] || wordCategories.animals;
  }

  if (words.length === 0) return null;
  
  // Use cryptographically secure random selection
  const randomIndex = getSecureRandomInt(words.length);
  return words[randomIndex];
}

// Helper function to get cryptographically secure random integer
function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  
  // Use crypto for secure random number generation
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0);
  
  // Convert to range [0, max)
  return randomValue % max;
}

// Helper function to cryptographically secure Fisher-Yates shuffle
function secureShuffle(array) {
  const shuffled = [...array];
  
  // Use crypto-based random for each swap
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Get cryptographically secure random index
    const j = getSecureRandomInt(i + 1);
    
    // Swap elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Helper function to select random imposters using cryptographically secure randomization
function selectImposters(players, numImposters) {
  console.log(`🎲 Selecting ${numImposters} imposter(s) from ${players.length} players:`);
  players.forEach((p, idx) => console.log(`   [${idx}] ${p.name}`));

  // Use cryptographically secure Fisher-Yates shuffle
  const shuffled = secureShuffle(players);

  // Select first numImposters from shuffled array
  const imposterIds = shuffled.slice(0, numImposters).map(p => p.playerId);
  
  console.log(`   ✓ Selected imposters: ${imposterIds.map(id => {
    const player = players.find(p => p.playerId === id);
    return player?.name;
  }).join(', ')}`);

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
      gameMode: 'local' // 'online' or 'local' - default to local
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

// Get room by game code (for URL joining)
app.get('/rooms/code/:gameCode', (req, res) => {
  const { gameCode } = req.params;
  const room = Array.from(rooms.values()).find(r => r.gameCode === gameCode);

  if (!room) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Return minimal public data
  res.json({
    roomId: room.roomId,
    gameCode: room.gameCode,
    status: room.status,
    playerCount: room.players.length,
    maxPlayers: room.settings.maxPlayers
  });
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
      roundNumber: room.gameState.roundNumber,
      playerOrder: room.gameState.playerOrder || []
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
      const otherImpostersCount = isImposter ? room.gameState.imposterIds.length - 1 : 0;
      socket.emit('ROLE_INFO', {
        role: isImposter ? 'imposter' : 'civilian',
        word: isImposter ? null : room.gameState.secretWord,
        category: room.settings.category,
        numImposters: room.gameState.imposterIds.length,
        otherImpostersCount: otherImpostersCount
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

    // Randomize starting player order using cryptographically secure shuffle
    const shuffledActivePlayers = secureShuffle(activePlayers);

    // Update game state
    room.gameState = {
      phase: 'clue',
      secretWord,
      imposterIds,
      clues: [],
      votes: {},
      readyPlayers: [],
      eliminatedPlayer: null,
      roundNumber: 1,
      playerOrder: shuffledActivePlayers.map(p => p.playerId) // Store randomized order
    };
    room.status = 'playing';

    // Notify everyone phase changed
    io.to(roomId).emit('PHASE_CHANGED', { phase: 'clue' });

    // Send role info to each player individually with additional context
    room.players.forEach(player => {
      const playerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.data.playerId === player.playerId);

      if (playerSocket) {
        const isImposter = imposterIds.includes(player.playerId);
        const otherImpostersCount = isImposter ? imposterIds.length - 1 : 0;
        playerSocket.emit('ROLE_INFO', {
          role: isImposter ? 'imposter' : 'civilian',
          word: isImposter ? null : secretWord,
          category: room.settings.category,
          numImposters: imposterIds.length,
          otherImpostersCount: otherImpostersCount
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
      console.log(`❌ START_VOTING rejected - Phase is ${room.gameState.phase || 'undefined'}, expected 'discussion'`);
      socket.emit('ERROR', { message: 'Not in discussion phase' });
      return;
    }

    // Check if player is eliminated
    const player = room.players.find(p => p.playerId === playerId);
    if (!player) {
      socket.emit('ERROR', { message: 'Player not found' });
      return;
    }

    if (player.eliminated) {
      socket.emit('ERROR', { message: 'Eliminated players cannot mark ready' });
      return;
    }

    if (!player.connected) {
      socket.emit('ERROR', { message: 'Disconnected players cannot mark ready' });
      return;
    }

    // Mark player as ready (avoid duplicates)
    if (!room.gameState.readyPlayers.includes(playerId)) {
      room.gameState.readyPlayers.push(playerId);
      console.log(`✅ ${player.name} marked ready for voting`);
    }

    // Check if all active (non-eliminated) players are ready (including imposters)
    const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
    const readyCount = room.gameState.readyPlayers.length;

    console.log(`📊 Ready status: ${readyCount}/${activePlayers.length} players ready (Active: ${activePlayers.map(p => p.name).join(', ')})`);

    // Emit ready status update
    io.to(roomId).emit('READY_UPDATE', {
      readyCount,
      totalPlayers: activePlayers.length
    });

    // If everyone is ready, start voting
    if (readyCount >= activePlayers.length) {
      console.log(`✅ All players ready! Starting voting phase.`);
      room.gameState.phase = 'voting';
      room.gameState.votes = {};
      room.gameState.readyPlayers = []; // Reset for next round

      io.to(roomId).emit('PHASE_CHANGED', { phase: 'voting' });
    }
  });

  socket.on('CAST_VOTE', ({ roomId, voterId, targetId }) => {
    const room = rooms.get(roomId);

    console.log(`📝 CAST_VOTE received - Room: ${roomId}, Voter: ${voterId}, Target: ${targetId}`);

    if (!room) {
      console.log(`❌ CAST_VOTE rejected - Room not found`);
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    if (room.gameState.phase !== 'voting') {
      console.log(`❌ CAST_VOTE rejected - Phase is ${room.gameState.phase || 'undefined'}, expected 'voting'`);
      socket.emit('ERROR', { message: `Invalid action: Not in voting phase (current phase: ${room.gameState.phase || 'unknown'})` });
      return;
    }

    // Check if player is eliminated
    const voter = room.players.find(p => p.playerId === voterId);
    if (!voter) {
      console.log(`❌ CAST_VOTE rejected - Voter not found: ${voterId}`);
      socket.emit('ERROR', { message: 'Player not found' });
      return;
    }

    // Check if voter is an imposter (for logging only - imposters CAN vote)
    const isImposter = room.gameState.imposterIds.includes(voterId);
    console.log(`👤 Voter: ${voter.name}, Is Imposter: ${isImposter}, Eliminated: ${voter.eliminated}, Connected: ${voter.connected}`);

    if (voter.eliminated) {
      console.log(`❌ CAST_VOTE rejected - Voter is eliminated`);
      socket.emit('ERROR', { message: 'Eliminated players cannot vote' });
      return;
    }

    if (!voter.connected) {
      console.log(`❌ CAST_VOTE rejected - Voter is disconnected`);
      socket.emit('ERROR', { message: 'Disconnected players cannot vote' });
      return;
    }

    // Record vote - ALL active players can vote (civilians AND imposters)
    room.gameState.votes[voterId] = targetId;
    const targetPlayer = room.players.find(p => p.playerId === targetId);
    console.log(`✅ Vote recorded - Voter: ${voter.name} (${isImposter ? 'IMPOSTER' : 'CIVILIAN'}), Target: ${targetPlayer?.name || targetId}`);

    // Emit vote progress (include all active players - civilians AND imposters)
    const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
    const votesReceived = Object.keys(room.gameState.votes).length;
    
    console.log(`📊 Vote progress: ${votesReceived}/${activePlayers.length} votes received (Active players: ${activePlayers.map(p => p.name).join(', ')})`);
    
    io.to(roomId).emit('VOTE_UPDATE', {
      votesReceived,
      totalVotes: activePlayers.length
    });

    // Check if all active (non-eliminated) players have voted (including imposters)
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
        // Don't auto-advance - wait for host to manually start next round
        // The reveal phase will show a button for the host to continue to clue phase
        if (wasImposter) {
          console.log(`🔄 Imposter eliminated! ${remainingImpostersCount} imposter(s) remain. Waiting for host to start next round...`);
        } else {
          console.log(`🔄 Civilian eliminated! Game continues. ${remainingImpostersCount} imposter(s) vs civilians. Waiting for host to start next round...`);
        }
      }
    }
  });

  socket.on('NEXT_ROUND', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    // Only host can start next round
    const player = room.players.find(p => p.playerId === playerId);
    if (!player || !player.isHost) {
      socket.emit('ERROR', { message: 'Only the host can start the next round' });
      return;
    }

    if (room.gameState.phase !== 'reveal') {
      socket.emit('ERROR', { message: 'Not in reveal phase' });
      return;
    }

    // Reset for next round (keep same word AND same imposters!)
    room.gameState.clues = [];
    room.gameState.votes = {};
    room.gameState.readyPlayers = [];
    room.gameState.eliminatedPlayer = null;
    room.gameState.roundNumber += 1;
    room.gameState.phase = 'clue';

    // Re-randomize player order for this round using cryptographically secure shuffle
    const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
    const shuffledActivePlayers = secureShuffle(activePlayers);
    room.gameState.playerOrder = shuffledActivePlayers.map(p => p.playerId);

    console.log(`🔄 Starting round ${room.gameState.roundNumber}`);

    // Notify everyone of the new round
    io.to(roomId).emit('PHASE_CHANGED', { phase: 'clue' });
    io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });

    // Send updated role info to each player
    room.players.forEach(player => {
      if (player.eliminated) return;

      const playerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.data.playerId === player.playerId);

      if (playerSocket) {
        const isImposter = room.gameState.imposterIds.includes(player.playerId);
        const otherImpostersCount = isImposter ? room.gameState.imposterIds.length - 1 : 0;
        playerSocket.emit('ROLE_INFO', {
          role: isImposter ? 'imposter' : 'civilian',
          word: isImposter ? null : room.gameState.secretWord,
          category: room.settings.category,
          numImposters: room.gameState.imposterIds.length,
          otherImpostersCount: otherImpostersCount
        });
      }
    });
  });

  socket.on('END_GAME', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    // Only host can end game
    const player = room.players.find(p => p.playerId === playerId);
    if (!player || !player.isHost) {
      socket.emit('ERROR', { message: 'Only the host can end the game' });
      return;
    }

    // Determine winners based on current state
    const activePlayers = room.players.filter(p => p.connected && !p.eliminated);
    const remainingImposters = room.gameState.imposterIds.filter(
      id => !room.players.find(p => p.playerId === id)?.eliminated
    );
    const remainingCivilians = activePlayers.filter(
      p => !room.gameState.imposterIds.includes(p.playerId)
    ).length;

    let winners = 'imposters';
    if (remainingImposters.length === 0) {
      winners = 'civilians';
    } else if (remainingImposters.length < remainingCivilians) {
      winners = 'civilians'; // Civilians win if they outnumber imposters
    }

    room.status = 'finished';
    io.to(roomId).emit('GAME_OVER', {
      winners,
      imposterIds: room.gameState.imposterIds,
      secretWord: room.gameState.secretWord
    });
  });

  socket.on('RESET_TO_LOBBY', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    // Only host can reset to lobby
    const player = room.players.find(p => p.playerId === playerId);
    if (!player || !player.isHost) {
      socket.emit('ERROR', { message: 'Only the host can reset to lobby' });
      return;
    }

    // Reset all players (un-eliminate them)
    room.players.forEach(p => {
      p.eliminated = false;
    });

    // Reset game state back to lobby (keep room, players, and settings)
    room.gameState = {
      phase: 'lobby',
      secretWord: null,
      imposterIds: [],
      clues: [],
      votes: {},
      readyPlayers: [],
      eliminatedPlayer: null,
      roundNumber: 0
    };
    room.status = 'lobby';

    // Notify everyone phase changed back to lobby
    io.to(roomId).emit('PHASE_CHANGED', { phase: 'lobby' });
    io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });

    console.log(`🔄 Game reset to lobby - Room: ${room.gameCode}, Players: ${room.players.length}`);
  });

  socket.on('RESTART_GAME', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('ERROR', { message: 'Room not found' });
      return;
    }

    // Only host can restart game
    const player = room.players.find(p => p.playerId === playerId);
    if (!player || !player.isHost) {
      socket.emit('ERROR', { message: 'Only the host can restart the game' });
      return;
    }

    // Reset all players (un-eliminate them)
    room.players.forEach(p => {
      p.eliminated = false;
    });

    // Reset game state but keep room and players
    const activePlayers = room.players.filter(p => p.connected);
    const imposterIds = selectImposters(activePlayers, room.settings.numImposters);
    const secretWord = getRandomWord(room.settings.category, room.settings.customWords);

    // Randomize starting player order using cryptographically secure shuffle
    const shuffledActivePlayers = secureShuffle(activePlayers);

    room.gameState = {
      phase: 'clue',
      secretWord,
      imposterIds,
      clues: [],
      votes: {},
      readyPlayers: [],
      eliminatedPlayer: null,
      roundNumber: 1,
      playerOrder: shuffledActivePlayers.map(p => p.playerId)
    };
    room.status = 'playing';

    // Notify everyone phase changed
    io.to(roomId).emit('PHASE_CHANGED', { phase: 'clue' });

    // Send role info to each player individually with additional context
    room.players.forEach(player => {
      const playerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.data.playerId === player.playerId);

      if (playerSocket) {
        const isImposter = imposterIds.includes(player.playerId);
        const otherImpostersCount = isImposter ? imposterIds.length - 1 : 0;
        playerSocket.emit('ROLE_INFO', {
          role: isImposter ? 'imposter' : 'civilian',
          word: isImposter ? null : secretWord,
          category: room.settings.category,
          numImposters: imposterIds.length,
          otherImpostersCount: otherImpostersCount
        });
      }
    });

    io.to(roomId).emit('ROOM_UPDATED', { room: getRoomPublicData(room) });
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
