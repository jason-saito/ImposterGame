import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function Eliminated() {
  const { players, playerId } = useGameStore();
  const eliminatedPlayer = (players || []).find(p => p.playerId === playerId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl w-full bg-gray-800 bg-opacity-90 rounded-3xl shadow-2xl p-12 text-center border-4 border-red-500"
      >
        {/* Skull Icon */}
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-9xl mb-6"
        >
          💀
        </motion.div>

        {/* Eliminated Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl font-black text-red-500 mb-6"
        >
          ELIMINATED
        </motion.h1>

        {/* Player Name */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-white mb-8"
        >
          {eliminatedPlayer?.name}
        </motion.p>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-black bg-opacity-50 rounded-2xl p-6 mb-6"
        >
          <p className="text-xl text-gray-300 mb-3">
            You have been voted out of the game.
          </p>
          <p className="text-lg text-gray-400">
            The game continues without you. Wait for the final results...
          </p>
        </motion.div>

        {/* Decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-500 text-sm"
        >
          ⚰️ Rest in peace ⚰️
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
