import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function RoleReveal({ role, secretWord }) {
  const { category, numImposters, otherImpostersCount } = useGameStore();
  const isImposter = role === 'imposter';
  
  const categoryNames = {
    animals: 'Animals',
    food: 'Food',
    objects: 'Objects',
    places: 'Places',
    sports: 'Sports',
    colors: 'Colors',
    movies: 'Movies',
    nature: 'Nature',
    custom: 'Custom'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.5, rotateY: -180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className={`max-w-md w-full rounded-3xl shadow-2xl p-12 text-center ${
          isImposter
            ? 'bg-gradient-to-br from-red-500 to-pink-600'
            : 'bg-gradient-to-br from-green-400 to-emerald-600'
        }`}
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white mb-6"
        >
          {isImposter ? '🕵️ YOU ARE THE' : '👤 YOU ARE A'}
        </motion.h1>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-6xl font-black text-white mb-8"
        >
          {isImposter ? 'IMPOSTER' : 'CIVILIAN'}
        </motion.div>

        {isImposter ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <p className="text-2xl text-white font-bold">
              Try to blend in!
            </p>
            {category && (
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-lg text-white font-semibold mb-1">
                  Category: {categoryNames[category] || category}
                </p>
                <p className="text-lg text-white font-semibold">
                  Total Imposters: {numImposters}
                </p>
                {otherImpostersCount > 0 && (
                  <p className="text-lg text-white font-semibold mt-2">
                    Other Imposters: {otherImpostersCount}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-xl text-white font-bold mb-4">
              The secret word is:
            </p>
            <div className="bg-white bg-opacity-20 rounded-2xl p-6 mb-4">
              <p className="text-5xl font-black text-white">
                {secretWord?.toUpperCase()}
              </p>
            </div>
            {category && (
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-lg text-white font-semibold">
                  Category: {categoryNames[category] || category}
                </p>
                <p className="text-lg text-white font-semibold">
                  Total Imposters: {numImposters}
                </p>
              </div>
            )}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white text-sm mt-8 opacity-75"
        >
          This screen will automatically close...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
