const config = require("./config");
const safety = require("./safety");
const data = require("./data");
const help = require("./help");

const games = {}; // roomId -> state

function today() {
  return new Date().toISOString().slice(0, 10);
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function handle(ctx) {
  const { roomId, nick, text } = ctx;
  let cmd = text.trim();
  if (!cmd) return `명령어를 입력하세요. \`${config.PREFIX} 도움말\``;

  // 진행 중 미니게임 숫자 입력
  if (games[roomId]) {
    const g = games[roomId];
    if (g.type === "updown" && /^-?\d+$/.test(cmd)) {
      const n = parseInt(cmd, 10);
      g.tries += 1;
      if (n === g.answer) {
        delete games[roomId];
        data.addPoints(nick, 120);
        return `**정답!** ${g.tries}회 만에 맞춤 +120P`;
      }
      return n < g.answer ? "업" : "다운";
    }
    if (g.type === "baseball" && /^\d{3}$/.test(cmd) && new Set(cmd).size === 3) {
      g.tries += 1;
      let s = 0,
        b = 0;
      for (let i = 0; i < 3; i++) {
        if (cmd[i] === g.answer[i]) s++;
        else if (g.answer.includes(cmd[i])) b++;
      }
      if (s === 3) {
        delete games[roomId];
        data.addPoints(nick, 150);
        return `**홈런!** ${g.tries}회 +150P`;
      }
      return `${s}S ${b}B`;
    }
    if (g.type === "quiz") {
      if (cmd.toLowerCase() === g.answer) {
        delete games[roomId];
        data.addPoints(nick, 80);
        return "정답! +80P";
      }
      delete games[roomId];
      return `오답. 정답: ${g.answer}`;
    }
  }

  // ----- 기본 -----
  if (["도움말", "help", "명령어"].includes(cmd)) return help.HELP;
  if (cmd === "가이드" || cmd.startsWith("가이드 ")) {
    return help.guide(cmd.replace(/^가이드\s*/, ""));
  }
  if (cmd === "처음") return help.GUIDE_FIRST;
  if (cmd === "핑") return `Pong! (${20 + Math.floor(Math.random() * 50)}ms)`;
  if (cmd === "정보") return `**${config.BOT_NAME}**\n상태: 온라인\n방식: LOCO 계열`;

  // ----- 출석 -----
  if (cmd === "출석") {
    const d = data.load();
    if (d.attendance[nick] === today()) return "오늘은 이미 출석했습니다.";
    const reward = rand(config.ATTENDANCE_REWARDS);
    d.attendance[nick] = today();
    d.users[nick] = (d.users[nick] || 0) + reward;
    let interest = 0;
    const bankBal = d.bank[nick] || 0;
    if (bankBal >= 1000 && d.lastInterest[nick] !== today()) {
      interest = Math.min(
        Math.floor(bankBal * config.BANK_INTEREST_RATE),
        config.BANK_INTEREST_CAP
      );
      d.bank[nick] = bankBal + interest;
      d.lastInterest[nick] = today();
    }
    d.levels[nick] = Math.max(1, Math.floor(d.users[nick] / config.LEVEL_UNIT) + 1);
    data.save(d);
    let msg = `**출석 완료**\n+${reward.toLocaleString()}P\n지갑: ${d.users[nick].toLocaleString()}P | 은행: ${(d.bank[nick] || 0).toLocaleString()}P`;
    if (interest) msg += `\n은행 이자 +${interest.toLocaleString()}P`;
    return msg;
  }

  if (["잔액", "포인트", "bal"].includes(cmd)) {
    return `**${nick}**\n지갑: ${data.getPoints(nick).toLocaleString()}P\n은행: ${data.getBank(nick).toLocaleString()}P\n레벨: Lv.${data.getLevel(nick)}`;
  }

  if (cmd === "은행") {
    return `**은행**\n잔액: ${data.getBank(nick).toLocaleString()}P\n\`${config.PREFIX} 입금 [금액]\`\n\`${config.PREFIX} 출금 [금액]\``;
  }

  if (cmd.startsWith("입금 ")) {
    const amount = parseInt(cmd.split(/\s+/)[1], 10);
    if (!amount || amount <= 0) return "1P 이상 입금하세요.";
    if (data.getPoints(nick) < amount) return "지갑 포인트 부족";
    data.addPoints(nick, -amount);
    data.addBank(nick, amount);
    return `**입금 완료** ${amount.toLocaleString()}P\n지갑 ${data.getPoints(nick).toLocaleString()}P | 은행 ${data.getBank(nick).toLocaleString()}P`;
  }

  if (cmd.startsWith("출금 ")) {
    const amount = parseInt(cmd.split(/\s+/)[1], 10);
    if (!amount || amount <= 0) return "1P 이상 출금하세요.";
    if (data.getBank(nick) < amount) return "은행 잔액 부족";
    data.addBank(nick, -amount);
    data.addPoints(nick, amount);
    return `**출금 완료** ${amount.toLocaleString()}P\n지갑 ${data.getPoints(nick).toLocaleString()}P | 은행 ${data.getBank(nick).toLocaleString()}P`;
  }

  if (cmd.startsWith("송금 ")) {
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) return `사용법: \`${config.PREFIX} 송금 [닉네임] [금액]\``;
    const target = parts[1];
    const amount = parseInt(parts[2], 10);
    if (!amount || amount <= 0) return "금액 오류";
    if (target === nick) return "자기 자신에게는 송금할 수 없습니다.";
    const fee = Math.max(
      config.TRANSFER_FEE_MIN,
      Math.floor(amount * config.TRANSFER_FEE_RATE)
    );
    const total = amount + fee;
    if (data.getPoints(nick) < total) return `포인트 부족 (금액+수수료 ${total}P)`;
    data.addPoints(nick, -total);
    data.addPoints(target, amount);
    return `**송금 완료**\n${nick} → ${target} ${amount.toLocaleString()}P (수수료 ${fee}P)`;
  }

  if (cmd === "레벨") {
    const pts = data.getPoints(nick);
    const lv = data.getLevel(nick);
    const need = Math.max(0, lv * config.LEVEL_UNIT - pts);
    return `**레벨** Lv.${lv} | ${pts.toLocaleString()}P\n다음까지 ${need.toLocaleString()}P`;
  }

  if (cmd === "랭킹") {
    const users = Object.entries(data.load().users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    if (!users.length) return "데이터 없음";
    const lines = ["**지갑 랭킹 TOP 10**"];
    users.forEach(([name, pts], i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      lines.push(`${medal} ${name} — ${pts.toLocaleString()}P`);
    });
    return lines.join("\n");
  }

  if (cmd === "최근") {
    const list = data.getRecent(roomId);
    if (!list.length) return "최근 발언자 없음";
    return "**최근 발언자**\n" + list.map((n, i) => `${i + 1}. ${n}`).join("\n");
  }

  // ----- 가르치기 -----
  if (cmd.startsWith("가르치기 ")) {
    const body = cmd.slice(5).trim();
    const sep = body.indexOf("==");
    if (sep < 0) return `사용법: \`${config.PREFIX} 가르치기 키==값\``;
    const key = body.slice(0, sep).trim();
    const val = body.slice(sep + 2).trim();
    if (key.length < config.TEACH_MIN_KEY || key.length > config.TEACH_MAX_KEY)
      return "키 길이 제한";
    if (!val || val.length > config.TEACH_MAX_VALUE) return "값 길이 제한";
    if (safety.isBad(key) || safety.isBad(val)) return safety.BLOCK_REPLY;
    const d = data.load();
    const rid = String(roomId);
    if (!d.teach[rid]) d.teach[rid] = {};
    if (Object.keys(d.teach[rid]).length >= config.TEACH_MAX_PER_ROOM)
      return "이 방 가르치기 개수 상한";
    d.teach[rid][key] = val;
    data.save(d);
    return `**등록** \`${key}\` → ${val}`;
  }

  if (cmd === "배운거") {
    const map = data.load().teach[String(roomId)] || {};
    const keys = Object.keys(map);
    if (!keys.length) return "배운 내용 없음";
    return "**배운 목록**\n" + keys.slice(0, 30).map((k) => `• ${k}`).join("\n");
  }

  if (cmd.startsWith("가르치기삭제 ")) {
    const key = cmd.slice(7).trim();
    const d = data.load();
    const rid = String(roomId);
    if (!d.teach[rid] || !d.teach[rid][key]) return "없음";
    if (!data.isAdmin(nick) && false) {
      /* 필요시 본인만 삭제 로직 */
    }
    delete d.teach[rid][key];
    data.save(d);
    return `삭제: ${key}`;
  }

  // 가르치기 자동 응답 (명령이 아닐 때 별도 — 여기선 prefix 이후만 처리)

  // ----- 게임 -----
  if (cmd === "슬롯") {
    const cost = 50;
    if (data.getPoints(nick) < cost) return `슬롯 ${cost}P 필요`;
    data.addPoints(nick, -cost);
    const sym = ["🍒", "🍋", "🔔", "⭐", "7️⃣", "💎"];
    const r = [rand(sym), rand(sym), rand(sym)];
    const t = r.join(" | ");
    if (r[0] === r[1] && r[1] === r[2]) {
      const win = r[0] === "💎" ? 800 : r[0] === "7️⃣" ? 400 : 200;
      data.addPoints(nick, win);
      return `**슬롯**\n${t}\n잭팟 +${win}P`;
    }
    if (new Set(r).size === 2) {
      data.addPoints(nick, 80);
      return `**슬롯**\n${t}\n+80P`;
    }
    return `**슬롯**\n${t}\n꽝`;
  }

  if (cmd.startsWith("룰렛 ")) {
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) return `사용법: \`${config.PREFIX} 룰렛 [빨강/검정/홀수/짝수] [금액]\``;
    const choice = parts[1];
    const bet = parseInt(parts[2], 10);
    if (!bet || bet < 10) return "최소 10P";
    if (data.getPoints(nick) < bet) return "포인트 부족";
    data.addPoints(nick, -bet);
    const num = Math.floor(Math.random() * 37);
    const color = num === 0 ? "초록" : num % 2 === 1 ? "빨강" : "검정";
    const oe = num === 0 ? "0" : num % 2 === 1 ? "홀수" : "짝수";
    let win = 0;
    if ((choice === "빨강" || choice === "레드") && color === "빨강") win = Math.floor(bet * 1.9);
    if ((choice === "검정" || choice === "블랙") && color === "검정") win = Math.floor(bet * 1.9);
    if ((choice === "홀수" || choice === "홀") && oe === "홀수") win = Math.floor(bet * 1.9);
    if ((choice === "짝수" || choice === "짝") && oe === "짝수") win = Math.floor(bet * 1.9);
    if (win) {
      data.addPoints(nick, win);
      return `**룰렛** ${num} (${color})\n선택 ${choice} → 승리 +${win}P`;
    }
    return `**룰렛** ${num} (${color})\n선택 ${choice} → 패배`;
  }

  if (cmd.startsWith("하이로우 ")) {
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) return `사용법: \`${config.PREFIX} 하이로우 [하이/로우] [금액]\``;
    const choice = parts[1];
    const bet = parseInt(parts[2], 10);
    if (!bet || bet < 20) return "최소 20P";
    if (data.getPoints(nick) < bet) return "포인트 부족";
    data.addPoints(nick, -bet);
    const card = 1 + Math.floor(Math.random() * 13);
    const high = card >= 8;
    const ok =
      (["하이", "high"].includes(choice) && high) ||
      (["로우", "low"].includes(choice) && !high);
    if (ok) {
      const win = Math.floor(bet * 1.85);
      data.addPoints(nick, win);
      return `**하이로우** 카드 ${card}\n승리 +${win}P`;
    }
    return `**하이로우** 카드 ${card}\n패배`;
  }

  if (cmd.startsWith("홀짝 ")) {
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) return `사용법: \`${config.PREFIX} 홀짝 [홀/짝] [금액]\``;
    const choice = parts[1];
    const bet = parseInt(parts[2], 10);
    if (!bet || bet < 10) return "최소 10P";
    if (data.getPoints(nick) < bet) return "포인트 부족";
    data.addPoints(nick, -bet);
    const num = 1 + Math.floor(Math.random() * 100);
    const res = num % 2 === 1 ? "홀" : "짝";
    const user = ["홀", "홀수"].includes(choice) ? "홀" : "짝";
    if (user === res) {
      const win = Math.floor(bet * 1.9);
      data.addPoints(nick, win);
      return `**홀짝** ${num}→${res} 승리 +${win}P`;
    }
    return `**홀짝** ${num}→${res} 패배`;
  }

  if (cmd.startsWith("주사위배팅 ")) {
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) return `사용법: \`${config.PREFIX} 주사위배팅 [1~6] [금액]\``;
    const guess = parseInt(parts[1], 10);
    const bet = parseInt(parts[2], 10);
    if (!(guess >= 1 && guess <= 6) || !bet || bet < 10) return "입력 오류";
    if (data.getPoints(nick) < bet) return "포인트 부족";
    data.addPoints(nick, -bet);
    const dice = 1 + Math.floor(Math.random() * 6);
    if (dice === guess) {
      const win = bet * 5;
      data.addPoints(nick, win);
      return `**주사위** 🎲${dice} 맞춤! +${win}P`;
    }
    return `**주사위** 🎲${dice} (선택 ${guess}) 패배`;
  }

  if (cmd.startsWith("동전배팅 ")) {
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) return `사용법: \`${config.PREFIX} 동전배팅 [앞/뒤] [금액]\``;
    const choice = parts[1];
    const bet = parseInt(parts[2], 10);
    if (!bet || bet < 10) return "최소 10P";
    if (data.getPoints(nick) < bet) return "포인트 부족";
    data.addPoints(nick, -bet);
    const res = Math.random() < 0.5 ? "앞" : "뒤";
    const user = ["앞", "앞면"].includes(choice) ? "앞" : "뒤";
    if (user === res) {
      data.addPoints(nick, bet * 2);
      return `**동전** ${res} 승리 +${bet * 2}P`;
    }
    return `**동전** ${res} 패배`;
  }

  if (cmd === "업다운") {
    games[roomId] = { type: "updown", answer: 1 + Math.floor(Math.random() * 100), tries: 0 };
    return "**업다운** 1~100 숫자를 입력하세요.";
  }
  if (cmd === "숫자야구") {
    const digits = "0123456789".split("");
    let a = "";
    while (a.length < 3) {
      const i = Math.floor(Math.random() * digits.length);
      a += digits.splice(i, 1)[0];
    }
    games[roomId] = { type: "baseball", answer: a, tries: 0 };
    return "**숫자야구** 서로 다른 숫자 3자리";
  }
  if (cmd.startsWith("가위바위보")) {
    const user = cmd.replace("가위바위보", "").trim();
    if (!["가위", "바위", "보"].includes(user))
      return `사용법: \`${config.PREFIX} 가위바위보 [가위/바위/보]\``;
    const bot = rand(["가위", "바위", "보"]);
    const winMap = { 가위: "보", 바위: "가위", 보: "바위" };
    if (user === bot) return `**가위바위보** ${user} vs ${bot} → 비김`;
    if (winMap[user] === bot) {
      data.addPoints(nick, 60);
      return `**가위바위보** ${user} vs ${bot} → 승리 +60P`;
    }
    return `**가위바위보** ${user} vs ${bot} → 패배`;
  }
  if (cmd === "주사위") return `**주사위** 🎲 ${1 + Math.floor(Math.random() * 6)}`;
  if (cmd === "동전") return `**동전** 🪙 ${Math.random() < 0.5 ? "앞면" : "뒷면"}`;
  if (cmd === "퀴즈") {
    const qna = [
      ["대한민국 수도는?", "서울"],
      ["1+1은?", "2"],
      ["가장 큰 바다?", "태평양"],
    ];
    const [q, a] = rand(qna);
    games[roomId] = { type: "quiz", answer: a.toLowerCase() };
    return `**퀴즈**\n${q}`;
  }

  if (cmd.startsWith("선택 ") || cmd.startsWith("랜덤 ")) {
    const body = cmd.split(/\s+/).slice(1).join(" ");
    const opts = body.split(",").map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) return `사용법: \`${config.PREFIX} 선택 A,B,C\``;
    return `**선택** → **${rand(opts)}**`;
  }

  if (cmd === "밸런스") {
    const pairs = [
      ["평생 피자만", "평생 치킨만"],
      ["시간여행", "순간이동"],
      ["모든 언어", "모든 악기"],
    ];
    const [a, b] = rand(pairs);
    return `**밸런스**\nA. ${a}\nB. ${b}`;
  }

  if (cmd === "미션") {
    const missions = [
      "오늘 물 한 잔 마시기",
      "스트레칭 1분",
      "감사한 일 하나 떠올리기",
      "방 정리 5분",
    ];
    return `**오늘의 미션**\n${rand(missions)}`;
  }

  if (cmd.startsWith("궁합 ")) {
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) return `사용법: \`${config.PREFIX} 궁합 이름1 이름2\``;
    const score = 40 + Math.floor(Math.random() * 56);
    return `**궁합** ${parts[1]} × ${parts[2]}\n${score}점 (재미용)`;
  }

  if (cmd.startsWith("타임캡슐 ")) {
    const m = cmd.match(/^타임캡슐\s+(\d+)\s+(.+)$/);
    if (!m) return `사용법: \`${config.PREFIX} 타임캡슐 [일수] [메시지]\``;
    const days = parseInt(m[1], 10);
    const message = m[2].trim();
    if (days < 1 || days > 365) return "일수 1~365";
    if (safety.isBad(message)) return safety.BLOCK_REPLY;
    const d = data.load();
    d.timecapsules.push({
      roomId: String(roomId),
      nick,
      message,
      openAt: Date.now() + days * 86400000,
    });
    data.save(d);
    return `**타임캡슐** ${days}일 후 개봉 예약`;
  }

  // ----- 유틸 -----
  if (cmd.startsWith("계산 ")) {
    const expr = cmd.slice(3).trim();
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) return "숫자와 연산자만 가능";
    try {
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict"; return (${expr})`)();
      return `**계산** ${expr} = ${v}`;
    } catch {
      return "수식 오류";
    }
  }

  if (cmd === "환율") {
    return "**환율 (참고)**\nUSD ≈ 1,380원\nJPY ≈ 9.2원\nEUR ≈ 1,500원";
  }

  if (cmd === "시간") {
    return `**시간** ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`;
  }

  if (cmd === "요일") {
    const w = ["일", "월", "화", "수", "목", "금", "토"];
    return `오늘은 **${w[new Date().getDay()]}요일**`;
  }

  if (cmd.startsWith("디데이 ")) {
    const s = cmd.slice(4).trim();
    const t = new Date(s + "T00:00:00");
    if (isNaN(t.getTime())) return "형식: YYYY-MM-DD";
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((t - now) / 86400000);
    if (diff > 0) return `**디데이** D-${diff}`;
    if (diff < 0) return `**디데이** D+${Math.abs(diff)}`;
    return "**디데이** 오늘";
  }

  if (cmd === "로또") {
    const nums = new Set();
    while (nums.size < 6) nums.add(1 + Math.floor(Math.random() * 45));
    return `**로또** ${[...nums].sort((a, b) => a - b).join(", ")}`;
  }

  if (cmd.startsWith("날씨 ")) {
    const region = cmd.slice(3).trim() || "서울";
    return `**날씨** ${region}\n(연동 준비) 맑음·기온 정보는 서버 연동 후 표시됩니다.`;
  }

  if (cmd.startsWith("번역 ")) {
    const q = cmd.slice(3).trim();
    if (!q) return "번역할 문장을 입력하세요.";
    if (safety.isBad(q)) return safety.BLOCK_REPLY;
    return `**번역** (연동 준비)\n원문: ${q}`;
  }

  if (cmd.startsWith("그림 ")) {
    const prompt = cmd.slice(3).trim();
    if (!prompt) return "그림 내용을 입력하세요.";
    if (safety.isBad(prompt) || safety.isImageBad(prompt)) return safety.BLOCK_REPLY;
    return `**이미지** 요청 접수 (안전 필터 통과)\n내용: ${prompt}\n실제 URL 연동은 설정 후 활성화됩니다.`;
  }

  // ----- 관리자 -----
  if (cmd.startsWith("어드민로그인 ")) {
    const pw = cmd.slice(8).trim();
    if (pw !== config.ADMIN_PASSWORD) return "비밀번호 오류";
    const d = data.load();
    if (!d.admins.includes(nick)) {
      d.admins.push(nick);
      data.save(d);
    }
    return `관리자 등록: ${nick}`;
  }

  if (data.isAdmin(nick)) {
    if (cmd.startsWith("포인트지급 ")) {
      const parts = cmd.split(/\s+/);
      if (parts.length < 3) return "사용법: 포인트지급 닉 금액";
      const amount = parseInt(parts[2], 10);
      data.addPoints(parts[1], amount);
      return `${parts[1]}에게 ${amount}P 지급`;
    }
    if (cmd.startsWith("포인트회수 ")) {
      const parts = cmd.split(/\s+/);
      if (parts.length < 3) return "사용법: 포인트회수 닉 금액";
      data.addPoints(parts[1], -parseInt(parts[2], 10));
      return `${parts[1]}에게서 회수`;
    }
    if (cmd === "방추가") {
      const d = data.load();
      const rid = String(roomId);
      if (!d.allowedRooms.map(String).includes(rid)) {
        d.allowedRooms.push(rid);
        data.save(d);
      }
      return `방 추가: ${rid}`;
    }
    if (cmd === "방삭제") {
      const d = data.load();
      d.allowedRooms = d.allowedRooms.filter((r) => String(r) !== String(roomId));
      data.save(d);
      return "방 삭제됨";
    }
    if (cmd === "방목록") {
      const rooms = data.load().allowedRooms;
      if (!rooms.length) return "현재 모든 방 허용 중";
      return "**허용 방**\n" + rooms.map((r) => `• ${r}`).join("\n");
    }
  }

  // 가르치기 매칭
  const taught = data.load().teach[String(roomId)] || {};
  if (taught[cmd]) {
    return safety.sanitizeOut(taught[cmd]);
  }

  return `알 수 없는 명령입니다. \`${config.PREFIX} 도움말\``;
}

module.exports = { handle };
