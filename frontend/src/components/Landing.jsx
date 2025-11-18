import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { API_URL } from '../config';

export default function Landing() {
  const { code } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCode = code || searchParams.get('code') || '';
  const [gameCode, setGameCode] = useState(urlCode);
  const [playerName, setPlayerName] = useState('');
  const [hostName, setHostName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(!!urlCode);
  const [showHostForm, setShowHostForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setPlayerId, setPlayerName: savePlayerName, setRoomData, joinRoom, initializeSocket } = useGameStore();
  const navigate = useNavigate();

  // Clear URL params when component mounts without a code
  useEffect(() => {
    if (!urlCode && searchParams.has('code')) {
      setSearchParams({}, { replace: true });
    }
  }, [urlCode, searchParams, setSearchParams]);

  // If code is in URL, pre-fill and show join form
  useEffect(() => {
    if (urlCode) {
      setGameCode(urlCode);
      setShowJoinForm(true);
    } else {
      // Reset form when no code in URL
      setGameCode('');
      setShowJoinForm(false);
      setShowHostForm(false);
    }
  }, [urlCode]);

  const handleHostGame = async () => {
    if (!hostName.trim()) {
      alert('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName })
      });

      const data = await response.json();

      setPlayerId(data.hostPlayer.playerId);
      savePlayerName(hostName);
      setRoomData(data.roomId, data.gameCode, true);

      initializeSocket();
      joinRoom(data.roomId, data.hostPlayer.playerId);

      navigate(`/lobby/${data.gameCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      alert('Please enter both game code and your name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode, playerName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();

      setPlayerId(data.player.playerId);
      savePlayerName(playerName);
      setRoomData(data.roomId, gameCode, false);

      initializeSocket();
      joinRoom(data.roomId, data.player.playerId);

      navigate(`/lobby/${gameCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      alert(error.message || 'Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">IMPOSTER</h1>
          <p className="text-xl text-purple-100">Can you spot the imposter?</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
          {!showHostForm && !showJoinForm && (
            <>
              <button
                onClick={() => setShowHostForm(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Host Game
              </button>

              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Join Game
              </button>
            </>
          )}

          {showHostForm && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Host a Game</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                maxLength={20}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleHostGame}
                  disabled={loading}
                  className="flex-1 bg-purple-500 text-white font-bold py-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
                <button
                  onClick={() => setShowHostForm(false)}
                  className="px-6 bg-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {showJoinForm && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Join a Game</h2>
              <input
                type="text"
                placeholder="Enter 2-digit game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-center tracking-widest font-bold"
                maxLength={2}
              />
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                maxLength={20}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoinGame}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="px-6 bg-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
