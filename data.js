
const fs = require("fs");
const path = require("path");
const os = require("os");
const config = require("./config");

const PRIMARY_FILE = config.DATA_FILE;
const FALLBACK_FILE = path.join(os.tmpdir(), "dulgi_data.json");

let activeFile = PRIMARY_FILE;

function defaultData() {
  return {
    users: {},
    bank: {},
    levels: {},
    attendance: {},
    lastInterest: {},
    admins: [...config.ADMINS],
    allowedRooms: [...config.ALLOWED_ROOMS],
    cooldowns: {},
    teach: {},
    recentSpeakers: {},
    votes: {},
    novels: {},
    timecapsules: [],
  };
}

function readFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  const base = defaultData();

  for (const key of Object.keys(base)) {
    if (data[key] === undefined || data[key] === null) {
      data[key] = base[key];
    }
  }

  return data;
}

function load() {
  const candidates = [...new Set([activeFile, PRIMARY_FILE, FALLBACK_FILE])];

  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const data = readFile(file);
        activeFile = file;
        return data;
      }
    } catch (e) {
      console.error("[둘기봇] 데이터 읽기 실패:", file, e.message);
    }
  }

  return defaultData();
}

function writeFile(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function save(data) {
  try {
    writeFile(activeFile, data);
    return true;
  } catch (e) {
    console.error("[둘기봇] 기본 경로 저장 실패:", e.message);
  }

  try {
    writeFile(FALLBACK_FILE, data);
    activeFile = FALLBACK_FILE;
    console.warn("[둘기봇] 임시 경로로 저장했습니다:", FALLBACK_FILE);
    return true;
  } catch (e) {
    console.error("[둘기봇] 임시 경로 저장도 실패:", e.message);
    return false;
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

  return Math.max(
    1,
    Math.floor((data.users[nick] || 0) / config.LEVEL_UNIT) + 1
  );
}

function addPoints(nick, amount) {
  const data = load();
  const next = Math.max(0, (data.users[nick] || 0) + amount);

  data.users[nick] = next;
  data.levels[nick] = Math.max(
    1,
    Math.floor(next / config.LEVEL_UNIT) + 1
  );

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
  const name = String(nick).trim();

  if (config.ADMINS.includes(name)) return true;
  return (load().admins || []).includes(name);
}

function isRoomAllowed(roomId) {
  const rooms = load().allowedRooms || [];

  if (!rooms.length) return true;
  return rooms.map(String).includes(String(roomId));
}

function checkCooldown(nick, kind = "default") {
  if (isAdmin(nick)) {
    return { blocked: false, msg: "" };
  }

  const data = load();
  const key = `${nick}:${kind}`;
  const now = Date.now() / 1000;
  const need = config.COOLDOWN[kind] || config.COOLDOWN.default;
  const previous = data.cooldowns[key];

  if (previous) {
    const remain = need - (now - previous);

    if (remain > 0) {
      return {
        blocked: true,
        msg: `쿨다운 ${remain.toFixed(1)}초`,
      };
    }
  }

  data.cooldowns[key] = now;
  save(data);

  return { blocked: false, msg: "" };
}

function pushRecent(roomId, nick) {
  const data = load();
  const id = String(roomId);

  if (!data.recentSpeakers[id]) {
    data.recentSpeakers[id] = [];
  }

  const list = data.recentSpeakers[id].filter((name) => name !== nick);
  list.unshift(nick);
  data.recentSpeakers[id] = list.slice(0, 15);

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
