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
const hostDisconnectTimers = new Map(); // Grace period for host refresh
const playerDisconnectTimers = new Map(); // Grace period for player refresh

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
    if (room.viewers && room.viewers.has(socketId)) return { code, role: 'viewer' };
  }
  return null;
}

function buildPlayerList(room) {
  return [...room.players.values()].map(p => ({
    nickname: p.nickname,
    playerIndex: p.playerIndex,
    ready: p.ready,
    face: p.face || 'smiley',
  }));
}

function resolveTargetSocket(room, target) {
  if (target === 'host') return room.hostSocketId;
  if (typeof target === 'number') {
    for (const [sid, player] of room.players) {
      if (player.playerIndex === target) return sid;
    }
  }
  return null;
}

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Host creates a room
  socket.on('host-create-room', () => {
    // Clean up any room this socket already hosts
    const existing = findRoomBySocket(socket.id);
    if (existing && existing.role === 'host') {
      io.to(existing.code).emit('room-closed');
      rooms.delete(existing.code);
      if (hostDisconnectTimers.has(existing.code)) {
        clearTimeout(hostDisconnectTimers.get(existing.code).timeout);
        hostDisconnectTimers.delete(existing.code);
      }
      console.log(`[room-closed] ${existing.code} (host created new room)`);
    }

    const roomCode = generateRoomCode();
    rooms.set(roomCode, {
      hostSocketId: socket.id,
      players: new Map(),
      viewers: new Set(),      // remote computers watching the game
      gameState: 'lobby',
      currentLevel: 1,
      lives: 3,
      score: 0,
      playerCount: 2,   // default 2 players, host can change
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

  // Host re-claims a room after page refresh
  socket.on('host-rejoin-room', ({ roomCode }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('rejoin-failed', { reason: 'room-not-found' });
      return;
    }

    // Check if grace period is active
    const timerEntry = hostDisconnectTimers.get(roomCode);
    if (timerEntry) {
      clearTimeout(timerEntry.timeout);
      hostDisconnectTimers.delete(roomCode);
    }

    // Check if old host socket is truly gone or timer was active
    const oldHostSocket = io.sockets.sockets.get(room.hostSocketId);
    if (oldHostSocket && oldHostSocket.connected && !timerEntry) {
      socket.emit('rejoin-failed', { reason: 'host-already-connected' });
      return;
    }

    // Allow reclaim
    room.hostSocketId = socket.id;
    socket.join(roomCode);

    // Build faces map
    const faces = {};
    for (const [, p] of room.players) {
      faces[p.playerIndex] = p.face || 'smiley';
    }

    socket.emit('room-rejoined', {
      roomCode,
      playerList: buildPlayerList(room),
      gameState: room.gameState,
      currentLevel: room.currentLevel,
      lives: room.lives,
      score: room.score,
      playerCount: room.playerCount,
      faces,
    });
    console.log(`[room-rejoin] ${roomCode} reclaimed by ${socket.id} (state: ${room.gameState})`);
  });

  // Host sets player count (1-4)
  socket.on('set-player-count', ({ roomCode, playerCount }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.gameState !== 'lobby') return;

    room.playerCount = Math.max(1, Math.min(4, playerCount));
    io.to(roomCode).emit('player-count-update', { playerCount: room.playerCount });
    console.log(`[player-count] room ${roomCode} → ${room.playerCount} players`);
  });

  // Host sets start level (1-9)
  socket.on('set-start-level', ({ roomCode, startLevel }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.gameState !== 'lobby') return;

    room.startLevel = Math.max(1, Math.min(9, startLevel));
    console.log(`[start-level] room ${roomCode} → level ${room.startLevel}`);
  });

  // Host resumed game after page refresh
  socket.on('host-resumed-game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.gameState !== 'playing') return;

    // Send current game state so the host scene can initialize at the right level
    socket.emit('resume-game-state', {
      level: room.currentLevel,
      lives: room.lives,
      score: room.score,
    });
    console.log(`[host-resumed] room ${roomCode} at level ${room.currentLevel}`);
  });

  // Controller joins a room
  socket.on('player-join', ({ roomCode, nickname }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }
    // Human slots = playerCount (all can be human; AI fills unfilled)
    if (room.players.size >= room.playerCount) {
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }

    // Assign first available player index (0-3)
    const takenIndices = new Set([...room.players.values()].map(p => p.playerIndex));
    let playerIndex = 0;
    while (takenIndices.has(playerIndex) && playerIndex < 4) playerIndex++;

    room.players.set(socket.id, {
      nickname: nickname || `Player ${playerIndex + 1}`,
      ready: false,
      playerIndex,
      face: 'smiley',
    });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    const playerList = buildPlayerList(room);
    io.to(roomCode).emit('player-joined', { playerList });
    socket.emit('join-success', { playerIndex });

    console.log(`[join] ${nickname} → room ${roomCode} as P${playerIndex}`);
  });

  // Player rejoins after disconnect (during gameplay)
  socket.on('player-rejoin', ({ roomCode, playerIndex }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('rejoin-failed', { reason: 'room-not-found' });
      return;
    }

    // Check if there's a grace period reservation for this player index
    const timerKey = `${roomCode}_${playerIndex}`;
    const timerEntry = playerDisconnectTimers.get(timerKey);

    if (!timerEntry) {
      // Check if that player slot is actually free
      const slotTaken = [...room.players.values()].some(p => p.playerIndex === playerIndex);
      if (slotTaken) {
        socket.emit('rejoin-failed', { reason: 'slot-taken' });
        return;
      }
      socket.emit('rejoin-failed', { reason: 'no-reservation' });
      return;
    }

    // Cancel the timer and reclaim the slot
    clearTimeout(timerEntry.timeout);
    playerDisconnectTimers.delete(timerKey);

    room.players.set(socket.id, {
      nickname: timerEntry.nickname,
      ready: true,
      playerIndex,
      face: timerEntry.face || 'smiley',
    });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    socket.emit('rejoin-success', {
      playerIndex,
      gameState: room.gameState,
      currentLevel: room.currentLevel,
      lives: room.lives,
      score: room.score,
    });

    // Notify host that player is back
    io.to(room.hostSocketId).emit('player-rejoined', { playerIndex });
    console.log(`[player-rejoin] P${playerIndex} back in room ${roomCode}`);
  });

  // Player ready
  socket.on('player-ready', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.ready = true;

    const playerList = buildPlayerList(room);
    io.to(roomCode).emit('player-ready-update', { playerList });

    // Check if all joined humans are ready (at least 1 human required)
    const allReady = room.players.size >= 1 &&
      [...room.players.values()].every(p => p.ready);

    if (allReady) {
      const startLvl = room.startLevel || 1;
      room.gameState = 'playing';
      room.currentLevel = startLvl;
      room.lives = 3;
      room.score = 0;
      room.levelStartTime = Date.now();

      // Figure out which indices are human vs AI
      const humanPlayers = [...room.players.values()].map(p => p.playerIndex).sort();

      // Build faces map
      const faces = {};
      for (const [, p] of room.players) {
        faces[p.playerIndex] = p.face || 'smiley';
      }

      io.to(roomCode).emit('game-start', {
        level: startLvl,
        lives: 3,
        playerCount: room.playerCount,
        humanPlayers,
        faces,
      });
      console.log(`[game-start] room ${roomCode} (${room.playerCount}P, humans: [${humanPlayers}])`);
    }
  });

  // Player selects face
  socket.on('player-face-select', ({ roomCode, face }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const validFaces = ['smiley', 'crazy', 'angry', 'cool', 'wink', 'skull'];
    if (validFaces.includes(face)) {
      player.face = face;
      const playerList = buildPlayerList(room);
      io.to(roomCode).emit('player-ready-update', { playerList });
    }
  });

  // Heart collected (sync lives)
  socket.on('heart-collected', ({ roomCode, heartIndex }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.lives < 5) {
      room.lives += 1;
      io.to(roomCode).emit('lives-update', { lives: room.lives });
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

  // Viewer (remote computer) joins a room to watch the game
  socket.on('viewer-join', ({ roomCode }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('viewer-join-error', { message: 'Room not found' });
      return;
    }

    room.viewers.add(socket.id);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.role = 'viewer';

    socket.emit('viewer-joined', {
      roomCode,
      playerList: buildPlayerList(room),
      gameState: room.gameState,
      currentLevel: room.currentLevel,
      lives: room.lives,
      score: room.score,
      playerCount: room.playerCount,
    });
    console.log(`[viewer] ${socket.id} joined room ${roomCode} (${room.viewers.size} viewers)`);
  });

  // Host broadcasts game state to viewers (relayed via server)
  socket.on('game-state-update', (data) => {
    const room = rooms.get(data.roomCode);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.viewers.size === 0) return; // skip if no viewers

    // Relay to all sockets in the room except the host
    socket.to(data.roomCode).volatile.emit('game-state-update', data);
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

  // Try again (after game over — same level)
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

  // Restart game (after game over — from level 1)
  socket.on('restart-game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.lives = 3;
    room.score = 0;
    room.currentLevel = 1;
    room.gameState = 'playing';
    room.levelStartTime = Date.now();

    io.to(roomCode).emit('retry-level', {
      level: 1,
      lives: 3,
      score: 0,
    });
    console.log(`[restart] room ${roomCode} from level 1`);
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

    const playerList = buildPlayerList(room);
    io.to(roomCode).emit('back-to-lobby', { playerList });
  });

  // --- WebRTC Signaling ---
  socket.on('webrtc-offer', ({ roomCode, from, to, offer }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const targetSid = resolveTargetSocket(room, to);
    if (targetSid) io.to(targetSid).emit('webrtc-offer', { from, offer });
  });

  socket.on('webrtc-answer', ({ roomCode, from, to, answer }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const targetSid = resolveTargetSocket(room, to);
    if (targetSid) io.to(targetSid).emit('webrtc-answer', { from, answer });
  });

  socket.on('webrtc-ice-candidate', ({ roomCode, from, to, candidate }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const targetSid = resolveTargetSocket(room, to);
    if (targetSid) io.to(targetSid).emit('webrtc-ice-candidate', { from, candidate });
  });

  socket.on('webrtc-ready', ({ roomCode, playerIndex }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    socket.to(roomCode).emit('webrtc-ready', { playerIndex });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const info = findRoomBySocket(socket.id);
    if (!info) return;

    const room = rooms.get(info.code);
    if (!room) return;

    if (info.role === 'viewer') {
      // Viewer left — just remove from set
      room.viewers.delete(socket.id);
      console.log(`[viewer-left] ${socket.id} from room ${info.code} (${room.viewers.size} remaining)`);
      return;
    }

    if (info.role === 'host') {
      // Host disconnected — start grace period (30s for refresh)
      console.log(`[host-disconnect] ${info.code} — starting 30s grace period`);

      const oldSocketId = socket.id;
      const timeout = setTimeout(() => {
        hostDisconnectTimers.delete(info.code);
        const stillExist = rooms.get(info.code);
        if (stillExist && stillExist.hostSocketId === oldSocketId) {
          // Host never came back — close room
          io.to(info.code).emit('room-closed');
          rooms.delete(info.code);
          console.log(`[room-closed] ${info.code} (host grace period expired)`);
        }
      }, 30000);

      hostDisconnectTimers.set(info.code, {
        timeout,
        disconnectedAt: Date.now()
      });
    } else {
      // Player left
      const player = room.players.get(socket.id);
      const playerNickname = player ? player.nickname : 'Unknown';
      const playerFace = player ? player.face : 'smiley';
      room.players.delete(socket.id);

      if (room.gameState === 'playing') {
        // During gameplay — start grace period for reconnection (30s)
        const timerKey = `${info.code}_${info.playerIndex}`;
        console.log(`[player-temp-disconnect] P${info.playerIndex} from room ${info.code} — starting 30s grace period`);

        io.to(room.hostSocketId).emit('player-temporarily-disconnected', {
          playerIndex: info.playerIndex
        });

        const timeout = setTimeout(() => {
          playerDisconnectTimers.delete(timerKey);
          // Player never came back — permanent leave
          io.to(info.code).emit('player-left', { playerIndex: info.playerIndex });
          io.to(room.hostSocketId).emit('player-disconnected', {
            playerIndex: info.playerIndex
          });
          console.log(`[player-left] P${info.playerIndex} from room ${info.code} (grace period expired)`);
        }, 30000);

        playerDisconnectTimers.set(timerKey, {
          timeout,
          nickname: playerNickname,
          face: playerFace,
          playerIndex: info.playerIndex,
          disconnectedAt: Date.now(),
        });
      } else {
        // In lobby — immediate leave
        io.to(info.code).emit('player-left', { playerIndex: info.playerIndex });
        console.log(`[player-left] P${info.playerIndex} from room ${info.code}`);
      }
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
