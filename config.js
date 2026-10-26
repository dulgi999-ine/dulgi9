
const path = require("path");

module.exports = {
  DEVICE_NAME: process.env.DULGI_DEVICE_NAME || "둘기봇",
  DEVICE_UUID: process.env.DULGI_DEVICE_UUID || "fbaeac0d-2fee-4eb6-bd56-71fe172e70f2",
  EMAIL: process.env.DULGI_EMAIL || "squal79@kakao.com",
  PASSWORD: process.env.DULGI_PASSWORD || "~ee8356120",

  PREFIX: "/둘기봇",
  BOT_NAME: "둘기봇",

  DATA_FILE:
    process.env.DULGI_DATA_FILE ||
    path.join(__dirname, "data", "dulgi_data.json"),

  ADMINS: ["둘기"],
  ADMIN_PASSWORD: process.env.DULGI_ADMIN_PASSWORD || "",

  ALLOWED_ROOMS: [],

  COOLDOWN: {
    default: 4,
    ai: 12,
    game: 3,
    image: 15,
    attendance: 60,
    teach: 10,
  },

  ATTENDANCE_REWARDS: [80, 100, 120, 150, 200, 300],
  BANK_INTEREST_RATE: 0.008,
  BANK_INTEREST_CAP: 400,
  TRANSFER_FEE_RATE: 0.02,
  TRANSFER_FEE_MIN: 1,
  LEVEL_UNIT: 1500,
  TEACH_MAX_PER_ROOM: 80,
  TEACH_MIN_KEY: 2,
  TEACH_MAX_KEY: 40,
  TEACH_MAX_VALUE: 200,
  MAX_REPLY_LENGTH: 900,
};
