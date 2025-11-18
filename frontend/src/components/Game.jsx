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
  const { phase, role, secretWord, players, playerId, gameCode, roundNumber } = useGameStore();
  const [showRole, setShowRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // If phase changes to lobby, redirect to lobby
    if (phase === 'lobby') {
      try {
        if (gameCode) {
          console.log('Game phase changed to lobby, navigating to /lobby/' + gameCode);
          navigate(`/lobby/${gameCode}`, { replace: true });
        } else {
          console.log('Game phase changed to lobby, navigating to /lobby');
          navigate('/lobby', { replace: true });
        }
      } catch (error) {
        console.error('Error navigating to lobby:', error);
      }
      return;
    }

    // Only show role reveal in round 1
    if (phase === 'clue' && roundNumber === 1) {
      setShowRole(true);
    } else if (phase === 'clue') {
      setShowRole(false);
    }
  }, [phase, navigate, gameCode, roundNumber]);

  useEffect(() => {
    // Show role for 5 seconds then hide (only in round 1)
    if (phase === 'clue' && showRole && roundNumber === 1) {
      const timer = setTimeout(() => setShowRole(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [phase, showRole, roundNumber]);

  // Don't redirect if we're in gameOver phase - let GameOver component handle navigation
  if (!role && phase !== 'gameOver') {
    // Redirect to landing if not in a game (but not if game just ended)
    navigate('/', { replace: true });
    window.history.replaceState({}, '', '/');
    return null;
  }

  // Check if current player is eliminated
  const currentPlayer = (players || []).find(p => p.playerId === playerId);
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
