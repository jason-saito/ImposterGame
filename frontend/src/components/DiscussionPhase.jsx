import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function DiscussionPhase() {
  const { clues, startVoting, settings, readyPlayers, playerId, players } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(60);
  const [hasClickedReady, setHasClickedReady] = useState(false);
  const isLocalMode = settings.gameMode === 'local';
  const currentPlayer = (players || []).find(p => p.playerId === playerId);
  const isEliminated = currentPlayer?.eliminated;

  // Reset timer and ready state when component mounts (for new rounds)
  useEffect(() => {
    setTimeLeft(60);
    setHasClickedReady(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-start voting when timer hits 0
          if (!isEliminated && !hasClickedReady) {
            startVoting();
            setHasClickedReady(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEliminated, hasClickedReady, startVoting]);

  const handleReady = () => {
    if (!isEliminated) {
      startVoting();
      setHasClickedReady(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-3xl w-full">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center"
        >
          <h1 className="text-4xl font-black text-gray-800 mb-4">
            💬 Discussion Time
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Discuss the clues and figure out who the imposter is!
          </p>
          <div className="text-5xl font-black text-purple-600">
            {timeLeft}s
          </div>
        </motion.div>

        {/* All Clues - only show in online mode */}
        {!isLocalMode && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">All Clues</h2>
            <div className="space-y-4">
              {clues.map((clue, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border-2 border-purple-200"
                >
                  <p className="font-black text-lg text-purple-900 mb-1">
                    {clue.playerName}
                  </p>
                  <p className="text-gray-800 text-xl">"{clue.text}"</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Ready Button (All Players) */}
        {!hasClickedReady ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReady}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-2xl font-black py-6 rounded-2xl shadow-2xl hover:from-orange-600 hover:to-red-600 transition-all"
          >
            I'M READY TO VOTE
          </motion.button>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center"
          >
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-3xl font-black text-gray-800 mb-4">
              Ready!
            </h3>
            <p className="text-xl text-gray-600 mb-4">
              Waiting for other players...
            </p>
            <div className="text-lg font-bold text-purple-600">
              {readyPlayers.readyCount} / {readyPlayers.totalPlayers} players ready
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
