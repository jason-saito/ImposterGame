import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';
import { API_URL } from '../config';

export default function Lobby() {
  const { code } = useParams();
  const {
    gameCode,
    players,
    isHost,
    settings,
    setSettings,
    startGame,
    resetGame,
    phase,
    restartGame,
    endGame,
    setPlayerId,
    setPlayerName: savePlayerName,
    setRoomData,
    joinRoom,
    initializeSocket
  } = useGameStore();

  const navigate = useNavigate();
  const [newWord, setNewWord] = useState('');
  const [showCustomWords, setShowCustomWords] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Join form state for URL visitors
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);

  const handleBackToHome = () => {
    resetGame();
    // Navigate to home and clear any URL parameters
    navigate('/', { replace: true });
    // Force URL update to remove query params
    window.history.replaceState({}, '', '/');
  };

  // Handle URL code parameter - if code is in URL but player hasn't joined, show join form
  useEffect(() => {
    console.log('Lobby URL check:', { code, gameCode, willShowJoinForm: !!(code && !gameCode) });
    if (code && !gameCode) {
      // Code in URL but not in room - show join form
      console.log('Showing join form for code:', code);
      setShowJoinForm(true);
    }
  }, [code, gameCode]);

  const handleJoinFromURL = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    console.log('Attempting to join via URL:', { code, playerName, API_URL });
    setJoining(true);
    try {
      const response = await fetch(`${API_URL}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode: code, playerName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();

      setPlayerId(data.player.playerId);
      savePlayerName(playerName);
      setRoomData(data.roomId, code, false);

      initializeSocket();
      joinRoom(data.roomId, data.player.playerId);

      setShowJoinForm(false);
    } catch (error) {
      console.error('Error joining room:', error);
      alert(error.message || 'Failed to join room. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (phase === 'clue') {
      try {
        console.log('Lobby phase changed to clue, navigating to /game');
        navigate('/game', { replace: true });
      } catch (error) {
        console.error('Error navigating to game:', error);
      }
    } else if (phase === 'lobby') {
      // Stay in lobby when phase is lobby
      // This handles the case when game is reset to lobby
      console.log('Phase is lobby, staying in lobby view');
    }
  }, [phase, navigate]);

  useEffect(() => {
    setShowCustomWords(settings.category === 'custom');
  }, [settings.category]);

  useEffect(() => {
    // Auto-adjust imposters if too many for current player count (max 3)
    const maxImposters = Math.min(3, Math.max(1, players.length - 1));
    if (settings.numImposters > maxImposters && isHost) {
      handleSettingsChange('numImposters', maxImposters);
    }
  }, [players.length]);

  const handleStartGame = () => {
    console.log('handleStartGame called', { 
      playersCount: players.length, 
      isHost, 
      phase, 
      category: settings.category,
      customWordsCount: settings.customWords?.length 
    });

    if (players.length < 3) {
      alert('You need at least 3 players to start the game');
      return;
    }

    if (settings.category === 'custom' && (!settings.customWords || settings.customWords.length === 0)) {
      alert('Please add at least one custom word');
      return;
    }

    // Check connected players
    const connectedPlayers = (players || []).filter(p => p.connected);
    if (connectedPlayers.length < 3) {
      alert(`You need at least 3 connected players to start. Currently ${connectedPlayers.length} player(s) are connected.`);
      return;
    }

    startGame();
  };

  const handleSettingsChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const roomId = useGameStore.getState().roomId;
      await fetch(`${API_URL}/rooms/${roomId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleAddWord = () => {
    if (!newWord.trim()) {
      alert('Please enter a word');
      return;
    }

    const updatedWords = [...(settings.customWords || []), newWord.trim()];
    handleSettingsChange('customWords', updatedWords);
    setNewWord('');
  };

  const handleRemoveWord = (index) => {
    const updatedWords = settings.customWords.filter((_, i) => i !== index);
    handleSettingsChange('customWords', updatedWords);
  };

  const handleExportWords = () => {
    const wordsString = (settings.customWords || []).join(', ');
    navigator.clipboard.writeText(wordsString).then(() => {
      alert('Word list copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
    setImportText('');
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportText('');
  };

  const handleProcessImport = () => {
    if (!importText.trim()) {
      alert('Please paste your word list');
      return;
    }

    const words = importText.split(',').map(w => w.trim()).filter(w => w.length > 0);

    if (words.length === 0) {
      alert('No valid words found. Please use comma-separated words (e.g., "apple, banana, cherry")');
      return;
    }

    handleSettingsChange('customWords', words);
    setShowImportModal(false);
    setImportText('');
    alert(`Successfully imported ${words.length} word(s)!`);
  };

  // If user is joining via URL, show join form
  if (showJoinForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-white mb-4">IMPOSTER</h1>
            <p className="text-xl text-purple-100">Join Game</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Code</h2>
            <div className="text-6xl font-black text-purple-600 tracking-widest mb-6 text-center">
              {code}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinFromURL()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                maxLength={20}
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  onClick={handleJoinFromURL}
                  disabled={joining}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 shadow-lg"
                >
                  {joining ? 'Joining...' : 'Join Game'}
                </button>
                <button
                  onClick={handleBackToHome}
                  className="px-6 bg-gray-300 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      {/* Back Button */}
      <motion.button
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={handleBackToHome}
        className="fixed top-4 left-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm"
      >
        <span className="text-xl">←</span>
        <span>Back to Home</span>
      </motion.button>

      <div className="max-w-4xl mx-auto">
        {/* Game Code Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Game Code</h2>
          <div className="text-7xl font-black text-purple-600 tracking-widest mb-4">
            {gameCode}
          </div>
          <p className="text-gray-600 mb-4">
            Share this code with your friends to join!
          </p>
          <button
            onClick={() => {
              const url = `${window.location.origin}/lobby/${gameCode}`;
              navigator.clipboard.writeText(url).then(() => {
                alert('Game URL copied to clipboard!');
              }).catch(() => {
                alert('Failed to copy URL. Please share the code manually.');
              });
            }}
            className="bg-purple-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
          >
            📋 Copy Game URL
          </button>
        </motion.div>

        {/* Players List */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Players ({players.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player, index) => (
              <motion.div
                key={player.playerId}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl font-bold text-lg flex items-center justify-between ${
                  player.connected
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <span>
                  {player.name}
                  {player.isHost && ' 👑'}
                </span>
                <span className="text-sm">
                  {player.connected ? '🟢' : '🔴'}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Settings (Host Only) */}
        {isHost && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-2xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Game Mode
                </label>
                <select
                  value={settings.gameMode || 'online'}
                  onChange={(e) => handleSettingsChange('gameMode', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-semibold"
                >
                  <option value="online">Online - Type Clues</option>
                  <option value="local">Local - In Person</option>
                </select>
                <p className="text-sm text-gray-600 mt-2">
                  {settings.gameMode === 'local'
                    ? '📱 Players will click "Move On" instead of typing clues (for in-person play)'
                    : '💻 Players will type and submit clues online'}
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Number of Imposters
                </label>
                <select
                  value={settings.numImposters}
                  onChange={(e) => handleSettingsChange('numImposters', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-semibold"
                >
                  {Array.from({ length: Math.min(3, Math.max(1, players.length - 1)) }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} Imposter{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                {players.length < 3 && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ Need at least 3 players to start
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Word Category
                </label>
                <select
                  value={settings.category}
                  onChange={(e) => handleSettingsChange('category', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-semibold"
                >
                  <option value="animals">Animals</option>
                  <option value="food">Food</option>
                  <option value="objects">Objects</option>
                  <option value="places">Places</option>
                  <option value="sports">Sports</option>
                  <option value="colors">Colors</option>
                  <option value="movies">Movies</option>
                  <option value="nature">Nature</option>
                  <option value="custom">Custom Words</option>
                </select>
              </div>

              {/* Custom Words Section */}
              {showCustomWords && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-2 border-purple-200 rounded-lg p-4"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Custom Word List</h3>

                  {/* Add Word Input */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                      placeholder="Enter a word"
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      maxLength={30}
                    />
                    <button
                      onClick={handleAddWord}
                      className="bg-purple-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Import/Export Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={handleOpenImportModal}
                      className="flex-1 bg-blue-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      📋 Import (Paste)
                    </button>
                    <button
                      onClick={handleExportWords}
                      disabled={!settings.customWords || settings.customWords.length === 0}
                      className="flex-1 bg-green-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      📤 Export (Copy)
                    </button>
                  </div>

                  {/* Words List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {settings.customWords && settings.customWords.length > 0 ? (
                      settings.customWords.map((word, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex items-center justify-between bg-purple-50 rounded-lg p-3"
                        >
                          <span className="font-semibold text-gray-800">{word}</span>
                          <button
                            onClick={() => handleRemoveWord(index)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ✕
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No words added yet. Add some words above!
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-4">
                    💡 Tip: To reuse this list later, click Export to copy it, then Import to paste it back.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Game Control Buttons (Host Only) */}
        {isHost && phase === 'lobby' && players.length >= 3 && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl font-black py-6 rounded-2xl shadow-2xl hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            START GAME
          </motion.button>
        )}

        {/* Restart Game and End Game Buttons (Host Only, when game is in progress) */}
        {isHost && phase !== 'lobby' && phase !== 'gameOver' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <button
              onClick={handleStartGame}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xl font-black py-4 rounded-2xl shadow-xl hover:from-blue-600 hover:to-cyan-700 transition-all"
            >
              START GAME
            </button>
            <button
              onClick={endGame}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white text-xl font-black py-4 rounded-2xl shadow-xl hover:from-red-600 hover:to-pink-700 transition-all"
            >
              END GAME
            </button>
          </motion.div>
        )}

        {/* Waiting Message (Players) */}
        {!isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-white text-xl font-bold"
          >
            Waiting for host to start the game...
          </motion.div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Import Word List
            </h2>
            <p className="text-gray-600 mb-4">
              Paste your comma-separated word list below:
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Example: apple, banana, cherry, dragon, elephant
            </p>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your words here (comma-separated)..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg resize-none"
              rows={6}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleProcessImport}
                className="flex-1 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Import Words
              </button>
              <button
                onClick={handleCloseImportModal}
                className="px-6 bg-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
