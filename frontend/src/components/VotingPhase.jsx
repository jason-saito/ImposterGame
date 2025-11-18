import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function VotingPhase() {
  const { players, playerId, castVote, votes } = useGameStore();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Reset voting state when component mounts (important for re-voting after ties and new rounds)
  useEffect(() => {
    setHasVoted(false);
    setSelectedPlayer(null);
  }, []);

  // Also reset when votes object is empty or undefined (new round started)
  useEffect(() => {
    if (!votes || (typeof votes === 'object' && !votes.votesReceived)) {
      setHasVoted(false);
      setSelectedPlayer(null);
    }
  }, [votes]);

  const handleVote = () => {
    if (!selectedPlayer) {
      alert('Please select a player to vote for');
      return;
    }

    castVote(selectedPlayer);
    setHasVoted(true);
  };

  const votingPlayers = players.filter(p => p.playerId !== playerId && !p.eliminated);

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
            🗳️ Vote for the Imposter
          </h1>
          <p className="text-xl text-gray-600">
            Who do you think is the imposter?
          </p>
        </motion.div>

        {!hasVoted ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {votingPlayers.map((player, index) => (
                <motion.button
                  key={player.playerId}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPlayer(player.playerId)}
                  className={`p-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 ${
                    selectedPlayer === player.playerId
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {player.name}
                  {player.isHost && ' 👑'}
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleVote}
              disabled={!selectedPlayer}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-black py-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              Submit Vote
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-12 text-center"
          >
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-3xl font-black text-gray-800 mb-4">
              Vote Submitted!
            </h3>
            <p className="text-xl text-gray-600 mb-6">
              Waiting for other players to vote...
            </p>
            {votes.votesReceived !== undefined && votes.totalVotes !== undefined && (
              <div className="text-lg text-gray-500">
                {votes.votesReceived} / {votes.totalVotes} votes received
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
