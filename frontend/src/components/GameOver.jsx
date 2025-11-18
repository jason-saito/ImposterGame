import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function GameOver() {
  const { winners, imposterIds, players, secretWord, resetGame, resetToLobby, gameCode, isHost } = useGameStore();
  const navigate = useNavigate();

  // Safety check - if no gameCode, can't go back to lobby
  const canGoToLobby = !!gameCode;

  const handleBackToHome = () => {
    resetGame();
    // Navigate to home and clear any URL parameters
    navigate('/', { replace: true });
    // Force URL update to remove query params
    window.history.replaceState({}, '', '/');
  };

  const handleBackToLobby = () => {
    if (!gameCode) {
      console.error('Cannot return to lobby: gameCode is missing');
      alert('Error: Cannot return to lobby. Please go back to home.');
      return;
    }
    
    try {
      if (isHost) {
        resetToLobby();
        // Small delay to ensure state is reset before navigation
        setTimeout(() => {
          navigate(`/lobby/${gameCode}`);
        }, 200);
      } else {
        // Non-hosts can also go back to lobby (they'll just wait there)
        navigate(`/lobby/${gameCode}`);
      }
    } catch (error) {
      console.error('Error returning to lobby:', error);
      alert('Error returning to lobby. Please try going back to home.');
    }
  };

  const imposterPlayers = (players || []).filter(p => imposterIds?.includes(p.playerId));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-3xl w-full">
        {/* Winner Announcement */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className={`rounded-3xl shadow-2xl p-12 mb-6 text-center ${
            winners === 'civilians'
              ? 'bg-gradient-to-br from-green-400 to-emerald-600'
              : 'bg-gradient-to-br from-red-500 to-pink-600'
          }`}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-8xl mb-6">
              {winners === 'civilians' ? '🎉' : '🕵️'}
            </div>
            <h1 className="text-6xl font-black text-white mb-4">
              {winners === 'civilians' ? 'CIVILIANS WIN!' : 'IMPOSTERS WIN!'}
            </h1>
            <p className="text-2xl font-bold text-white opacity-90">
              {winners === 'civilians'
                ? 'All imposters have been eliminated!'
                : 'The imposters fooled everyone!'}
            </p>
          </motion.div>
        </motion.div>

        {/* Game Summary */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-6"
        >
          <h2 className="text-3xl font-black text-gray-800 mb-6">Game Summary</h2>

          <div className="space-y-4">
            <div className="bg-purple-100 rounded-xl p-4">
              <p className="text-lg font-bold text-purple-900 mb-2">
                Secret Word:
              </p>
              <p className="text-3xl font-black text-purple-600">
                {secretWord?.toUpperCase()}
              </p>
            </div>

            <div className="bg-red-100 rounded-xl p-4">
              <p className="text-lg font-bold text-red-900 mb-2">
                The Imposter{imposterPlayers.length > 1 ? 's were' : ' was'}:
              </p>
              <div className="space-y-2">
                {imposterPlayers.map((player, index) => (
                  <motion.div
                    key={player.playerId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="bg-white rounded-lg p-3"
                  >
                    <p className="text-xl font-bold text-red-600">
                      🕵️ {player.name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {canGoToLobby && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToLobby}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-2xl font-black py-6 rounded-2xl shadow-2xl hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              {isHost ? 'Back to Lobby (Start New Game)' : 'Back to Lobby'}
            </motion.button>
          )}
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: canGoToLobby ? 1.1 : 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToHome}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-black py-6 rounded-2xl shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Exit to Home Page
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
