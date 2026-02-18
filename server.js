const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Local dev: /api/config so client can use same code path (returns empty = same origin)
app.get('/api/config', (req, res) => {
  res.json({ socketUrl: '' });
});

// --- LAN IP Detection ---
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// --- Room Management ---
const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function findRoomBySocket(socketId) {
  for (const [code, room] of rooms) {
    if (room.hostSocketId === socketId) return { code, role: 'host' };
    for (const [sid, player] of room.players) {
      if (sid === socketId) return { code, role: 'player', playerIndex: player.playerIndex };
    }
  }
  return null;
}

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Host creates a room
  socket.on('host-create-room', () => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, {
      hostSocketId: socket.id,
      players: new Map(),
      gameState: 'lobby',
      currentLevel: 1,
      lives: 3,
      score: 0,
      levelStartTime: Date.now(),
    });
    socket.join(roomCode);
    socket.emit('room-created', {
      roomCode,
      localIP: getLocalIP(),
      port: PORT
    });
    console.log(`[room] ${roomCode} created by ${socket.id}`);
  });

  // Controller joins a room
  socket.on('player-join', ({ roomCode, nickname }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    if (room.players.size >= 2) {
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }

    // Assign player index (0 = Cyan, 1 = Magenta)
    const takenIndices = new Set([...room.players.values()].map(p => p.playerIndex));
    const playerIndex = takenIndices.has(0) ? 1 : 0;

    room.players.set(socket.id, {
      nickname: nickname || `Player ${playerIndex + 1}`,
      ready: false,
      playerIndex
    });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    // Notify everyone in the room
    const playerList = [...room.players.values()].map(p => ({
      nickname: p.nickname,
      playerIndex: p.playerIndex,
      ready: p.ready
    }));

    io.to(roomCode).emit('player-joined', { playerList });
    socket.emit('join-success', { playerIndex });

    console.log(`[join] ${nickname} → room ${roomCode} as P${playerIndex}`);
  });

  // Player ready
  socket.on('player-ready', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.ready = true;

    const playerList = [...room.players.values()].map(p => ({
      nickname: p.nickname,
      playerIndex: p.playerIndex,
      ready: p.ready
    }));

    io.to(roomCode).emit('player-ready-update', { playerList });

    // Check if both players are ready
    const allReady = room.players.size === 2 &&
      [...room.players.values()].every(p => p.ready);

    if (allReady) {
      room.gameState = 'playing';
      room.currentLevel = 1;
      room.lives = 3;
      room.score = 0;
      room.levelStartTime = Date.now();
      io.to(roomCode).emit('game-start', { level: 1, lives: 3 });
      console.log(`[game-start] room ${roomCode}`);
    }
  });

  // Player input (relay to host with minimal processing)
  socket.on('player-input', ({ roomCode, input }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Send directly to host socket only
    io.to(room.hostSocketId).volatile.emit('player-input', {
      playerIndex: player.playerIndex,
      input
    });
  });

  // Level complete (host notifies)
  socket.on('level-complete', ({ roomCode, nextLevel, levelTime }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Score: 1000 per level + time bonus
    const seconds = Math.floor((levelTime || 0) / 1000);
    const timeBonus = Math.max(0, 300 - seconds) * 10;
    room.score += 1000 + timeBonus;

    room.currentLevel = nextLevel;
    room.levelStartTime = Date.now();

    io.to(roomCode).emit('level-transition', {
      nextLevel,
      score: room.score,
      lives: room.lives,
    });
    console.log(`[level] room ${roomCode} → level ${nextLevel} (score: ${room.score})`);
  });

  // Player died (host notifies)
  socket.on('player-died', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.lives -= 1;

    // Notify everyone of updated lives
    io.to(roomCode).emit('lives-update', { lives: room.lives });

    if (room.lives <= 0) {
      // Game over — no lives remaining
      room.gameState = 'gameover';
      io.to(roomCode).emit('game-over-lives', {
        score: room.score,
        level: room.currentLevel,
      });
      console.log(`[game-over] room ${roomCode} at level ${room.currentLevel} (score: ${room.score})`);
    } else {
      // Notify controllers for haptic feedback
      for (const [sid] of room.players) {
        io.to(sid).emit('reset-level');
      }
    }
  });

  // Game over (all levels complete — victory)
  socket.on('game-over', ({ roomCode, levelTime }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Final level score + lives bonus
    const seconds = Math.floor((levelTime || 0) / 1000);
    const timeBonus = Math.max(0, 300 - seconds) * 10;
    const livesBonus = room.lives * 500;
    room.score += 1000 + timeBonus + livesBonus;

    room.gameState = 'victory';
    io.to(roomCode).emit('game-victory', {
      score: room.score,
      lives: room.lives,
    });
    console.log(`[victory] room ${roomCode} (score: ${room.score}, lives: ${room.lives})`);
  });

  // Try again (after game over)
  socket.on('try-again', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.lives = 3;
    room.score = 0;
    room.gameState = 'playing';
    room.levelStartTime = Date.now();

    io.to(roomCode).emit('retry-level', {
      level: room.currentLevel,
      lives: 3,
      score: 0,
    });
    console.log(`[retry] room ${roomCode} at level ${room.currentLevel}`);
  });

  // Play again (back to lobby after victory)
  socket.on('play-again', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.gameState = 'lobby';
    room.currentLevel = 1;
    room.lives = 3;
    room.score = 0;
    for (const [, player] of room.players) {
      player.ready = false;
    }

    const playerList = [...room.players.values()].map(p => ({
      nickname: p.nickname,
      playerIndex: p.playerIndex,
      ready: p.ready
    }));

    io.to(roomCode).emit('back-to-lobby', { playerList });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const info = findRoomBySocket(socket.id);
    if (!info) return;

    const room = rooms.get(info.code);
    if (!room) return;

    if (info.role === 'host') {
      // Host left — close the room
      io.to(info.code).emit('room-closed');
      rooms.delete(info.code);
      console.log(`[room-closed] ${info.code} (host left)`);
    } else {
      // Player left
      room.players.delete(socket.id);
      io.to(info.code).emit('player-left', { playerIndex: info.playerIndex });

      // If game was playing, pause
      if (room.gameState === 'playing') {
        io.to(room.hostSocketId).emit('player-disconnected', {
          playerIndex: info.playerIndex
        });
      }

      console.log(`[player-left] P${info.playerIndex} from room ${info.code}`);
    }
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  const ip = getLocalIP();
  console.log(`\n🎮 Co-op Platformer Server`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}`);
  console.log(`\n   Open the Local URL on your computer to host a game.`);
  console.log(`   Players scan the QR code with their phones to join.\n`);
});
