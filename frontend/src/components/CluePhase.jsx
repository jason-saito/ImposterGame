import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function CluePhase() {
  const { role, secretWord, clues, submitClue, playerId, settings, players, playerOrder } = useGameStore();
  const [clueText, setClueText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Reset state when component mounts (for new rounds)
  useEffect(() => {
    setClueText('');
    setSubmitted(false);
  }, []);

  // Reset submitted state when clues array is cleared (new round)
  useEffect(() => {
    if (clues.length === 0) {
      setSubmitted(false);
      setClueText('');
    }
  }, [clues.length]);

  const isImposter = role === 'imposter';
  const hasSubmitted = submitted || clues.some(c => c.playerId === playerId);
  const isLocalMode = settings.gameMode === 'local';

  // Get the first player in the randomized order (who should start)
  const getStartingPlayerName = () => {
    if (playerOrder && playerOrder.length > 0) {
      const firstPlayerId = playerOrder[0];
      const firstPlayer = players.find(p => p.playerId === firstPlayerId && !p.eliminated);
      return firstPlayer?.name || null;
    }
    // Fallback: if no playerOrder, pick a random active player
    const activePlayers = players.filter(p => !p.eliminated);
    if (activePlayers.length > 0) {
      return activePlayers[Math.floor(Math.random() * activePlayers.length)].name;
    }
    return null;
  };

  const startingPlayerName = getStartingPlayerName();

  const handleSubmit = () => {
    // Allow empty clues in local mode
    if (!isLocalMode && !clueText.trim()) {
      alert('Please enter a clue');
      return;
    }

    submitClue(clueText || ' '); // Submit space if empty for local mode
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full">
        {/* Role Reminder */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-2xl p-6 mb-6 text-center ${
            isImposter
              ? 'bg-red-500 bg-opacity-20 border-2 border-red-400'
              : 'bg-green-500 bg-opacity-20 border-2 border-green-400'
          }`}
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            {isImposter ? '🕵️ You are the Imposter' : '👤 You are a Civilian'}
          </h2>
          {!isImposter && secretWord && (
            <p className="text-4xl font-black text-white">
              {secretWord.toUpperCase()}
            </p>
          )}
          {isImposter && (
            <p className="text-lg text-white opacity-90">
              No word provided - try to blend in!
            </p>
          )}
        </motion.div>

        {/* Clue Input */}
        {!hasSubmitted ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              {isLocalMode ? 'Ready to Continue?' : 'Enter Your Clue'}
            </h3>
            {!isLocalMode ? (
              <>
                <textarea
                  value={clueText}
                  onChange={(e) => setClueText(e.target.value)}
                  placeholder={
                    isImposter
                      ? "Fake a clue to blend in..."
                      : "Give a clue about the word without saying it..."
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg resize-none"
                  rows={3}
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 mb-4 text-right">
                  {clueText.length}/100
                </p>
              </>
            ) : (
              <div className="mb-6 text-center">
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  Ready to Continue?
                </p>
                {startingPlayerName && (
                  <p className="text-xl font-bold text-purple-600 mb-4">
                    {startingPlayerName} should start with the first clue
                  </p>
                )}
                <p className="text-xl text-gray-600 mb-4">
                  Everyone ready to share their clues?
                </p>
                <p className="text-sm text-gray-500">
                  Click "Move On" when you're ready to continue
                </p>
              </div>
            )}
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
            >
              {isLocalMode ? 'Move On' : 'Submit Clue'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center"
          >
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {isLocalMode ? 'Ready!' : 'Clue Submitted!'}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Waiting for other players...
            </p>
            <div className="text-sm text-gray-500">
              {clues.length} clue{clues.length !== 1 ? 's' : ''} submitted
            </div>
          </motion.div>
        )}

        {/* Clues List - only show in online mode */}
        {!isLocalMode && clues.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white bg-opacity-20 rounded-2xl p-6 mt-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Submitted Clues ({clues.length})
            </h3>
            <div className="space-y-2">
              {clues.map((clue, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white bg-opacity-90 rounded-lg p-3"
                >
                  <p className="font-bold text-gray-800">{clue.playerName}</p>
                  <p className="text-gray-700">{clue.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
