const fs = require("fs");
const path = require("path");
const config = require("./config");

function defaultData() {
  return {
    users: {}, // nick -> points
    bank: {}, // nick -> balance
    levels: {},
    attendance: {}, // nick -> YYYY-MM-DD
    lastInterest: {},
    admins: [...config.ADMINS],
    allowedRooms: [...config.ALLOWED_ROOMS],
    cooldowns: {},
    teach: {}, // roomId -> { key: value }
    recentSpeakers: {}, // roomId -> [nick, ...]
    votes: {},
    novels: {},
    timecapsules: [],
  };
}

function load() {
  try {
    if (fs.existsSync(config.DATA_FILE)) {
      const raw = fs.readFileSync(config.DATA_FILE, "utf8");
      const data = JSON.parse(raw);
      const base = defaultData();
      for (const k of Object.keys(base)) {
        if (data[k] === undefined) data[k] = base[k];
      }
      return data;
    }
  } catch (e) {
    console.error("data load error", e.message);
  }
  return defaultData();
}

function save(data) {
  try {
    const dir = path.dirname(config.DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(config.DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("data save error", e.message);
  }
}

function getPoints(nick) {
  return load().users[nick] || 0;
}

function getBank(nick) {
  return load().bank[nick] || 0;
}

function getLevel(nick) {
  const data = load();
  if (data.levels[nick]) return data.levels[nick];
  return Math.max(1, Math.floor(getPoints(nick) / config.LEVEL_UNIT) + 1);
}

function addPoints(nick, amount) {
  const data = load();
  const next = Math.max(0, (data.users[nick] || 0) + amount);
  data.users[nick] = next;
  data.levels[nick] = Math.max(1, Math.floor(next / config.LEVEL_UNIT) + 1);
  save(data);
  return next;
}

function addBank(nick, amount) {
  const data = load();
  const next = Math.max(0, (data.bank[nick] || 0) + amount);
  data.bank[nick] = next;
  save(data);
  return next;
}

function isAdmin(nick) {
  const n = String(nick).trim();
  if (config.ADMINS.includes(n)) return true;
  return (load().admins || []).includes(n);
}

function isRoomAllowed(roomId) {
  const rooms = load().allowedRooms || [];
  if (!rooms.length) return true;
  return rooms.map(String).includes(String(roomId));
}

function checkCooldown(nick, kind = "default") {
  if (isAdmin(nick)) return { blocked: false, msg: "" };
  const data = load();
  const key = `${nick}:${kind}`;
  const now = Date.now() / 1000;
  const need = config.COOLDOWN[kind] || config.COOLDOWN.default;
  if (data.cooldowns[key]) {
    const remain = need - (now - data.cooldowns[key]);
    if (remain > 0) {
      return { blocked: true, msg: `쿨다운 ${remain.toFixed(1)}초` };
    }
  }
  data.cooldowns[key] = now;
  save(data);
  return { blocked: false, msg: "" };
}

function pushRecent(roomId, nick) {
  const data = load();
  const rid = String(roomId);
  if (!data.recentSpeakers[rid]) data.recentSpeakers[rid] = [];
  let list = data.recentSpeakers[rid].filter((x) => x !== nick);
  list.unshift(nick);
  data.recentSpeakers[rid] = list.slice(0, 15);
  save(data);
}

function getRecent(roomId) {
  return load().recentSpeakers[String(roomId)] || [];
}

module.exports = {
  load,
  save,
  getPoints,
  getBank,
  getLevel,
  addPoints,
  addBank,
  isAdmin,
  isRoomAllowed,
  checkCooldown,
  pushRecent,
  getRecent,
  defaultData,
};
