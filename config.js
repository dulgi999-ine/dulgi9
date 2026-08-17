module.exports = {
  // ===== 계정 (서브 계정만 사용) =====
  DEVICE_NAME: process.env.DULGI_DEVICE_NAME || "둘기봇",
  DEVICE_UUID: process.env.DULGI_DEVICE_UUID || "", // 필수: 직접 채우기
  EMAIL: process.env.DULGI_EMAIL || "",
  PASSWORD: process.env.DULGI_PASSWORD || "",

  // ===== 봇 =====
  PREFIX: "/둘기봇",
  BOT_NAME: "둘기봇",
  DATA_FILE: require("path").join(__dirname, "..", "data", "dulgi_data.json"),

  // 관리자 닉네임 (카톡 닉네임 정확히)
  ADMINS: ["둘기"],
  ADMIN_PASSWORD: "eeonc",

  // 허용 방 (비어있으면 전체 허용 — 운영 시 채우는 것 권장)
  ALLOWED_ROOMS: [],

  // 쿨다운 (초)
  COOLDOWN: {
    default: 4,
    ai: 12,
    game: 3,
    image: 15,
    attendance: 60,
    teach: 10,
  },

  // 경제
  ATTENDANCE_REWARDS: [80, 100, 120, 150, 200, 300],
  BANK_INTEREST_RATE: 0.008, // 0.8%/일
  BANK_INTEREST_CAP: 400,
  TRANSFER_FEE_RATE: 0.02, // 2%
  TRANSFER_FEE_MIN: 1,
  LEVEL_UNIT: 1500,

  // 가르치기
  TEACH_MAX_PER_ROOM: 80,
  TEACH_MIN_KEY: 2,
  TEACH_MAX_KEY: 40,
  TEACH_MAX_VALUE: 200,

  // 메시지
  MAX_REPLY_LENGTH: 900,
};
