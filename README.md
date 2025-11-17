# Imposter Game

A fast-paced, social bluffing game inspired by Spyfall and Among Us, built as a Kahoot-style web experience.

## Features

- 🎮 **Kahoot-style joining** - Players join with a simple 6-digit game code
- 🕵️ **Role-based gameplay** - Imposters try to blend in while civilians spot them
- 💬 **Real-time communication** - WebSocket-powered live updates
- 📱 **Mobile-friendly** - Optimized for phone players and desktop/TV hosts
- 🎨 **Beautiful UI** - Clean, bold, and playful design with smooth animations

## Game Flow

1. **Landing Page** → Choose to host or join a game
2. **Lobby** → Players join with game code, host configures settings
3. **Role Reveal** → Each player secretly learns their role
4. **Clue Phase** → Players submit clues about the secret word
5. **Discussion** → Players debate and theorize about the imposter
6. **Voting** → Everyone votes for who they think is the imposter
7. **Reveal** → Dramatic results showing if the vote was correct
8. **Game Over** → Final summary and option to play again

## Tech Stack

### Backend
- Node.js with Express
- Socket.io for real-time communication
- UUID for unique IDs
- CORS and Helmet for security

### Frontend
- React with Vite
- React Router for navigation
- Zustand for state management
- Tailwind CSS for styling
- Framer Motion for animations
- Socket.io Client for WebSocket connection

## Setup Instructions

### Prerequisites
- Node.js (v20 or higher)
- npm

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

You need to run both the backend and frontend servers:

1. **Start the Backend Server** (in one terminal)
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **Start the Frontend Development Server** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Play the Game**
   - Open `http://localhost:5173` in your browser
   - Click "Host Game" to create a new game
   - Other players can join by clicking "Join Game" and entering the 6-digit code
   - You can test with multiple browser tabs or devices on the same network

## Game Settings

As a host, you can configure:
- **Number of Imposters** - 1, 2, or 3 imposters
- **Word Category** - Animals, Food, Objects, or Places

## How to Play

### For Civilians:
1. You'll see a secret word
2. Give subtle clues about the word without revealing it
3. Watch for players who seem confused or give vague clues
4. Vote for who you think is the imposter

### For Imposters:
1. You won't see the secret word
2. Listen to others' clues carefully
3. Try to give believable clues that blend in
4. Don't get caught!

## Project Structure

```
imposter/
├── backend/
│   ├── server.js          # Express + Socket.io server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand state management
│   │   ├── App.jsx        # Main app with routing
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot module replacement enabled
```

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist` and can be served statically.

## Future Enhancements

- [ ] Custom word lists
- [ ] Multi-round games
- [ ] Player statistics
- [ ] Sound effects and music
- [ ] Mobile app versions
- [ ] Room persistence with database
- [ ] More game modes

## License

MIT

## Credits

Built with ❤️ following the technical requirements specification for Imposter Game.
