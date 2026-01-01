const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// -------------------- سرو کردن فرانت‌اند --------------------

// پوشه free
app.use("/free", express.static(path.join(__dirname, "free")));

// پوشه tournament
app.use("/tournament", express.static(path.join(__dirname, "tournament")));

// صفحه اصلی
app.get("/", (req, res) => {
  res.send("سرور Render بالا هست ✅");
});

// -------------------- منطق اتاق‌ها --------------------

const rooms = {
  room1: { capacity: 50, players: [], closed: false },
  room2: { capacity: 50, players: [], closed: false },
  room3: { capacity: 50, players: [], closed: false },
};

function assignRoomSequential(userId) {
  for (const [roomName, room] of Object.entries(rooms)) {
    if (!room.closed && room.players.length < room.capacity) {
      room.players.push({ id: userId, finished: false, score: 0 });
      if (room.players.length === room.capacity) {
        room.closed = true;
      }
      return roomName;
    }
  }
  return null;
}

function getRoomStatus(roomName) {
  const room = rooms[roomName];
  if (!room) return null;
  return {
    current: room.players.length,
    capacity: room.capacity,
    closed: room.closed,
  };
}

function finishGame(userId, roomName, score) {
  const room = rooms[roomName];
  if (!room) return;

  const player = room.players.find(p => p.id === userId);
  if (player) {
    player.finished = true;
    player.score = score;
  }

  if (room.closed) {
    fs.writeFileSync(
      `scores_${roomName}.json`,
      JSON.stringify(room.players, null, 2)
    );
  }
}

// -------------------- API ها --------------------

app.get("/room-status", (req, res) => {
  const roomName = req.query.room;
  const status = getRoomStatus(roomName);
  if (status) {
    res.json(status);
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

app.post("/join-room", (req, res) => {
  const userId = req.body.userId;
  const roomName = assignRoomSequential(userId);
  if (roomName) {
    res.json({ room: roomName });
  } else {
    res.status(400).json({ error: "All rooms are full" });
  }
});

app.post("/finish-game", (req, res) => {
  const { userId, roomName, score } = req.body;
  finishGame(userId, roomName, score);
  res.json({ status: "Score saved ✅" });
});

// -------------------- اجرا --------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});