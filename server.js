const express = require("express");
const path = require("path");
require("dotenv").config();

const { Telegraf } = require("telegraf");
const { assignRoom, getRoomStatus, finishGame } = require("./rooms");

const app = express();
const PORT = 80;

// -------------------- بخش وب‌سرور --------------------
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// API برای وضعیت اتاق
app.get("/room-status", (req, res) => {
  const roomName = req.query.room;
  const status = getRoomStatus(roomName);
  if (status) {
    res.json(status);
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

// -------------------- بخش ربات تلگرام --------------------
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    "سلام! یکی از گزینه‌های زیر رو انتخاب کن:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎮 بازی رایگان",
              web_app: { url: "https://cosmic-cendol-33545.netlify.app/free/index.html" }
            }
          ],
          [
            {
              text: "🏆 Tournament",
              web_app: { url: "https://cosmic-cendol-33545.netlify.app/tournament/index.html" }
            }
          ]
        ]
      }
    }
  );
});

// وقتی کاربر وارد تورنمنت شد
bot.on("web_app_data", (ctx) => {
  const data = ctx.webAppData.data;

  if (data.startsWith("JOIN_TOURNAMENT")) {
    const userId = ctx.from.id;
    const roomName = assignRoom(userId);
    if (roomName) {
      ctx.reply(`شما وارد ${roomName} شدید!`);
    } else {
      ctx.reply("همه اتاق‌ها پر شده‌اند.");
    }
  }

  if (data.startsWith("FINISH_GAME")) {
    const [_, roomName, score] = data.split(":");
    const userId = ctx.from.id;
    finishGame(userId, roomName, parseInt(score));
    ctx.reply("امتیاز شما ثبت شد ✅");
  }
});

bot.launch().then(() => {
  console.log("Telegram bot launched!");
});

// -------------------- اجرا --------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});