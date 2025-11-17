import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';
import { API_URL } from '../config';

export default function Lobby() {
  const {
    gameCode,
    players,
    isHost,
    settings,
    setSettings,
    startGame,
    resetGame,
    phase
  } = useGameStore();

  const navigate = useNavigate();
  const [newWord, setNewWord] = useState('');
  const [showCustomWords, setShowCustomWords] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const handleBackToHome = () => {
    resetGame();
    navigate('/');
  };

  useEffect(() => {
    if (phase === 'clue') {
      navigate('/game');
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
    if (players.length < 3) {
      alert('You need at least 3 players to start the game');
      return;
    }

    if (settings.category === 'custom' && (!settings.customWords || settings.customWords.length === 0)) {
      alert('Please add at least one custom word');
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
          <p className="text-gray-600">
            Share this code with your friends to join!
          </p>
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

        {/* Start Game Button (Host Only) */}
        {isHost && (
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
