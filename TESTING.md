# Testing Guide for Imposter Game

## Starting the Application

### 1. Start the Backend Server

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm install  # Only needed first time or if dependencies changed
npm start    # Or use `npm run dev` for auto-reload with nodemon
```

The backend should start on `http://localhost:3001`

### 2. Start the Frontend Server

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
npm install  # Only needed first time or if dependencies changed
npm run dev
```

The frontend should start on `http://localhost:5173` (or another port if 5173 is taken)

## Testing Checklist

### ✅ Basic Functionality

1. **Create a Game**
   - Go to `http://localhost:5173`
   - Click "Host Game"
   - Enter your name
   - Verify you see a 2-digit game code (e.g., "42")
   - Verify the URL shows `/lobby/42` (or your code)

2. **Join via Code**
   - Open a new browser tab/window (or use incognito)
   - Click "Join Game"
   - Enter the 2-digit code
   - Enter a name
   - Verify you join the lobby

3. **Join via URL**
   - Copy the game URL from the lobby (click "📋 Copy Game URL")
   - Open in a new browser/incognito window
   - Verify it shows the join form with code pre-filled
   - Enter name and join

### ✅ Settings & Categories

4. **Test Game Mode**
   - Verify "Local" is selected by default (not "Online")
   - Change to "Online" and verify it stays

5. **Test Categories**
   - As host, check category dropdown
   - Verify you see: Animals, Food, Objects, Places, Sports, Colors, Movies, Nature, Custom
   - Select different categories

6. **Test Number of Imposters**
   - Add 3+ players
   - Verify you can select 1, 2, or 3 imposters (max based on player count)

### ✅ Game Flow

7. **Start Game**
   - With 3+ players, click "START GAME"
   - Verify role reveal shows:
     - For civilians: Secret word, category, total imposters
     - For imposters: Category, total imposters, other imposters count

8. **Clue Phase**
   - Verify all players can submit clues
   - In local mode: Click "Move On"
   - In online mode: Type and submit clues
   - Verify clues appear for all players (online mode)

9. **Discussion Phase**
   - Verify timer counts down
   - Click "I'M READY TO VOTE"
   - Verify ready count updates
   - When all ready, should move to voting

10. **Voting Phase**
    - **Imposters**: Verify they see "Imposters Cannot Vote" message
    - **Civilians**: Verify they can select and vote for players
    - Try voting as imposter → should show error/block
    - Verify vote progress updates

11. **Reveal Phase**
    - Verify eliminated player is shown
    - Verify if they were imposter or civilian
    - If game continues: Verify host sees "START NEXT ROUND" button
    - Verify non-hosts see "Waiting for host..."

12. **Next Round**
    - As host, click "START NEXT ROUND"
    - Verify new round starts
    - Verify role info is shown again
    - Verify player order is randomized (different clue submission order)

### ✅ Game Controls

13. **End Game**
    - During game, as host, go back to lobby
    - Click "END GAME"
    - Verify game ends and shows winners

14. **Restart Game**
    - After a game ends or during game, as host
    - Click "RESTART GAME (KEEP LOBBY)"
    - Verify:
      - Same lobby code
      - Same players
      - New game starts with new imposters/word

### ✅ Edge Cases

15. **Player Status**
    - Verify connected players show green dot (🟢)
    - Disconnect a player (close tab)
    - Verify they show red dot (🔴)

16. **Multiple Rounds**
    - Play through multiple rounds
    - Verify eliminated players stay eliminated
    - Verify game continues correctly

17. **Game Over Conditions**
    - Eliminate all imposters → Civilians win
    - Eliminate enough civilians → Imposters win
    - Verify game over screen shows correctly

## Quick Test Script

1. **Terminal 1**: `cd backend && npm start`
2. **Terminal 2**: `cd frontend && npm run dev`
3. **Browser 1**: Host game, get code
4. **Browser 2** (incognito): Join with code or URL
5. **Browser 3** (incognito): Join with code or URL
6. Start game and test all phases

## Common Issues

- **Backend not starting**: Check if port 3001 is in use
- **Frontend not connecting**: Verify backend is running and check `config.js` URLs
- **Socket errors**: Check browser console for connection issues
- **CORS errors**: Verify backend CORS settings match frontend URL

## Testing URL Features

To test URL joining:
1. Host creates game → URL: `http://localhost:5173/lobby/42`
2. Copy that URL
3. Open in new browser/incognito
4. Should redirect to landing with code pre-filled
5. Enter name and join

