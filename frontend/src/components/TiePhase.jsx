import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function TiePhase() {
  const { tiedPlayers, voteCount } = useGameStore();

  if (!tiedPlayers) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center"
        >
          {/* Tie Announcement */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-orange-500 rounded-3xl shadow-2xl p-12 mb-6"
          >
            <div className="text-7xl mb-6">🤝</div>
            <h1 className="text-6xl font-black text-white mb-6">
              IT'S A TIE!
            </h1>
            <p className="text-2xl font-bold text-white opacity-90">
              Multiple players received {voteCount} vote{voteCount !== 1 ? 's' : ''} each
            </p>
          </motion.div>

          {/* Tied Players */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Tied Players:
            </h2>
            <div className="space-y-3">
              {tiedPlayers.map((player, index) => (
                <motion.div
                  key={player.playerId}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-4 border-2 border-orange-300"
                >
                  <p className="text-2xl font-black text-gray-800">
                    {player.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Another Round Message */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-8"
          >
            <h2 className="text-4xl font-black text-white mb-4">
              GIVE NEW HINTS!
            </h2>
            <p className="text-xl text-white opacity-90">
              Everyone will give new clues before voting again...
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
