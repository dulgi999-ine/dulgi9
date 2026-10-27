
const fs = require("fs");
const os = require("os");
const path = require("path");
const config = require("./config");

const preferredPath =
  process.env.DULGI_DATA_FILE ||
  (config.DATA_FILE && path.isAbsolute(config.DATA_FILE)
    ? config.DATA_FILE
    : path.join(os.tmpdir(), "dulgi_data.json"));

let dataFile = preferredPath;

function emptyData() {
  return {
    users: {},
    rooms: {},
    recent: [],
    cooldowns: {},
    taught: {},
  };
}

function ensureDirectory(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function load() {
  try {
    ensureDirectory(dataFile);

    if (!fs.existsSync(dataFile)) {
      return emptyData();
    }

    const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));

    return {
      ...emptyData(),
      ...parsed,
    };
  } catch (error) {
    console.error("[둘기봇] 데이터 읽기 오류:", error.message);
    return emptyData();
  }
}

function save(data) {
  try {
    ensureDirectory(dataFile);

    const temporaryFile = dataFile + ".tmp";
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );
    fs.renameSync(temporaryFile, dataFile);

    return true;
  } catch (error) {
    console.error("[둘기봇] 데이터 저장 오류:", error.message);
    return false;
  }
}

let store = load();

function reload() {
  store = load();
  return store;
}

function pushRecent(roomId, nick) {
  store.recent.push({
    roomId: String(roomId),
    nick: String(nick),
    time: Date.now(),
  });

  if (store.recent.length > 500) {
    store.recent = store.recent.slice(-500);
  }

  save(store);
}

function isRoomAllowed(roomId) {
  const allowed = config.ALLOWED_ROOMS || [];

  return (
    allowed.length === 0 ||
    allowed.map(String).includes(String(roomId))
  );
}

function checkCooldown(nick, kind = "default") {
  if (!store.cooldowns) store.cooldowns = {};

  const seconds =
    Number((config.COOLDOWN || {})[kind]) ||
    Number((config.COOLDOWN || {}).default) ||
    0;

  const key = `${nick}:${kind}`;
  const now = Date.now();
  const last = Number(store.cooldowns[key]) || 0;
  const remaining = seconds * 1000 - (now - last);

  if (remaining > 0) {
    return {
      blocked: true,
      msg: `잠깐만 기다려 주세요. ${Math.ceil(
        remaining / 1000
      )}초 후 다시 사용할 수 있어요.`,
    };
  }

  store.cooldowns[key] = now;
  save(store);

  return { blocked: false, msg: "" };
}

module.exports = {
  load: () => store,
  reload,
  save,
  pushRecent,
  isRoomAllowed,
  checkCooldown,
};
