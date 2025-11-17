import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import RoleReveal from './RoleReveal';
import CluePhase from './CluePhase';
import DiscussionPhase from './DiscussionPhase';
import VotingPhase from './VotingPhase';
import TiePhase from './TiePhase';
import RevealPhase from './RevealPhase';
import GameOver from './GameOver';
import Eliminated from './Eliminated';

export default function Game() {
  const { phase, role, secretWord, players, playerId } = useGameStore();
  const [showRole, setShowRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Reset showRole when entering clue phase (for new rounds)
    if (phase === 'clue') {
      setShowRole(true);
    }
  }, [phase]);

  useEffect(() => {
    // Show role for 5 seconds then hide
    if (phase === 'clue' && showRole) {
      const timer = setTimeout(() => setShowRole(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [phase, showRole]);

  if (!role) {
    // Redirect to landing if not in a game
    navigate('/');
    return null;
  }

  // Check if current player is eliminated
  const currentPlayer = players.find(p => p.playerId === playerId);
  const isEliminated = currentPlayer?.eliminated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500">
      <AnimatePresence mode="wait">
        {isEliminated && phase !== 'gameOver' ? (
          <Eliminated key="eliminated" />
        ) : (
          <>
            {phase === 'clue' && showRole && (
              <RoleReveal key="role" role={role} secretWord={secretWord} />
            )}
            {phase === 'clue' && !showRole && (
              <CluePhase key="clue" />
            )}
            {phase === 'discussion' && (
              <DiscussionPhase key="discussion" />
            )}
            {phase === 'voting' && (
              <VotingPhase key="voting" />
            )}
            {phase === 'tie' && (
              <TiePhase key="tie" />
            )}
            {phase === 'reveal' && (
              <RevealPhase key="reveal" />
            )}
            {phase === 'gameOver' && (
              <GameOver key="gameOver" />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
