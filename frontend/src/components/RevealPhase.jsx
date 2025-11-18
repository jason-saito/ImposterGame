import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function RevealPhase() {
  const { eliminatedPlayer, remainingImpostersCount, isHost, nextRound } = useGameStore();

  if (!eliminatedPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading results...</div>
      </div>
    );
  }

  const { name, wasImposter, isNoVote } = eliminatedPlayer;
  // Game continues if there are still imposters remaining (game isn't over)
  const continueGame = remainingImpostersCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center"
        >
          {/* Eliminated Player / Vote Result */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-12 mb-6"
          >
            <h2 className="text-3xl font-bold text-gray-700 mb-6">
              {isNoVote ? 'Vote Result:' : 'You voted out:'}
            </h2>
            <div className={`text-6xl font-black mb-8 ${isNoVote ? 'text-red-600' : 'text-purple-600'}`}>
              {name}
            </div>
          </motion.div>

          {/* Reveal */}
          <motion.div
            initial={{ scale: 0, rotateZ: -180 }}
            animate={{ scale: 1, rotateZ: 0 }}
            transition={{ delay: 1, type: 'spring', duration: 1 }}
            className={`rounded-3xl shadow-2xl p-12 ${
              isNoVote
                ? 'bg-gradient-to-br from-red-600 to-red-700'
                : wasImposter
                ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                : 'bg-gradient-to-br from-red-500 to-pink-600'
            }`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="text-7xl mb-6">
                {isNoVote ? '🚫' : wasImposter ? '🎉' : '😱'}
              </div>
              <h1 className="text-5xl font-black text-white mb-6">
                {isNoVote ? 'NO VOTE!' : wasImposter ? 'CORRECT!' : 'WRONG!'}
              </h1>
              <p className="text-3xl font-bold text-white">
                {isNoVote
                  ? 'No one was eliminated'
                  : wasImposter
                  ? `${name} was the Imposter!`
                  : `${name} was a Civilian!`}
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-8"
          >
            {continueGame ? (
              <div className="bg-orange-500 rounded-2xl shadow-xl p-6">
                <p className="text-3xl font-black text-white mb-2">
                  {remainingImpostersCount} IMPOSTER{remainingImpostersCount > 1 ? 'S' : ''} REMAIN{remainingImpostersCount === 1 ? 'S' : ''}!
                </p>
                {isHost ? (
                  <button
                    onClick={nextRound}
                    className="mt-4 w-full bg-white text-orange-500 text-xl font-black py-4 rounded-xl hover:bg-orange-50 transition-all shadow-lg"
                  >
                    GIVE NEW HINTS
                  </button>
                ) : (
                  <p className="text-xl text-white opacity-90">
                    Waiting for host to continue...
                  </p>
                )}
              </div>
            ) : continueGame ? (
              <div className="bg-orange-500 rounded-2xl shadow-xl p-6">
                <p className="text-3xl font-black text-white mb-2">
                  {remainingImpostersCount} IMPOSTER{remainingImpostersCount > 1 ? 'S' : ''} REMAIN{remainingImpostersCount === 1 ? 'S' : ''}!
                </p>
                {isHost ? (
                  <button
                    onClick={nextRound}
                    className="mt-4 w-full bg-white text-orange-500 text-xl font-black py-4 rounded-xl hover:bg-orange-50 transition-all shadow-lg"
                  >
                    GIVE NEW HINTS
                  </button>
                ) : (
                  <p className="text-xl text-white opacity-90">
                    Waiting for host to continue...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-white text-lg opacity-75">
                {wasImposter && remainingImpostersCount === 0
                  ? 'Civilians win! 🎊'
                  : 'The imposter remains among you...'}
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
