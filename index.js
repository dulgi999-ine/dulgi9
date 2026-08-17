/**
 * 둘기봇 진입점
 * LOCO(node-kakao) 우선 시도.
 * 로그인 정보가 없거나 실패하면 콘솔에 안내만 하고,
 * 동일 명령 처리기는 테스트 모드로도 동작 가능.
 */

const config = require("./config");
const safety = require("./safety");
const dataStore = require("./data");
const { handle } = require("./commands");

let talkClient = null;

function stripPrefix(msg) {
  const p = config.PREFIX;
  if (!msg.startsWith(p)) return null;
  return msg.slice(p.length).trim();
}

async function onMessage(roomId, nick, messageText, replyFn) {
  try {
    if (!messageText) return;
    dataStore.pushRecent(roomId, nick);

    if (!dataStore.isRoomAllowed(roomId)) return;

    if (safety.isBad(messageText)) {
      await replyFn(safety.BLOCK_REPLY);
      return;
    }

    const body = stripPrefix(messageText);
    if (body === null) {
      // prefix 없는 일반 채팅: 가르치기 키 매칭만
      const taught = dataStore.load().teach[String(roomId)] || {};
      if (taught[messageText.trim()]) {
        const out = safety.sanitizeOut(taught[messageText.trim()]);
        if (out) await replyFn(out);
      }
      return;
    }

    // 쿨다운 종류 추정
    let kind = "default";
    if (/^(그림|번역)/.test(body)) kind = body.startsWith("그림") ? "image" : "ai";
    else if (/^(슬롯|룰렛|하이로우|홀짝|배팅|업다운|숫자야구)/.test(body)) kind = "game";
    else if (body === "출석") kind = "attendance";
    else if (body.startsWith("가르치기")) kind = "teach";

    const cd = dataStore.checkCooldown(nick, kind);
    if (cd.blocked) {
      await replyFn(cd.msg);
      return;
    }

    let reply = handle({ roomId, nick, text: body });
    reply = safety.sanitizeOut(reply);
    if (!reply) return;

    // 긴 메시지 분할
    while (reply.length > config.MAX_REPLY_LENGTH) {
      let cut = reply.slice(0, config.MAX_REPLY_LENGTH);
      const idx = cut.lastIndexOf("\n");
      if (idx > 500) cut = cut.slice(0, idx);
      await replyFn(cut);
      reply = reply.slice(cut.length);
    }
    if (reply.trim()) await replyFn(reply);
  } catch (e) {
    console.error("onMessage error", e);
    try {
      await replyFn("처리 중 오류가 발생했습니다.");
    } catch (_) {}
  }
}

async function tryLocoLogin() {
  if (!config.EMAIL || !config.PASSWORD || !config.DEVICE_UUID) {
    console.log("[둘기봇] LOCO 로그인 정보 없음 → config.js 또는 환경변수 설정 필요");
    console.log("  DULGI_EMAIL, DULGI_PASSWORD, DULGI_DEVICE_UUID");
    return false;
  }

  try {
    const { AuthApiClient, TalkClient } = require("node-kakao");
    const api = await AuthApiClient.create(config.DEVICE_NAME, config.DEVICE_UUID);
    const loginRes = await api.login({
      email: config.EMAIL,
      password: config.PASSWORD,
      forced: true,
    });
    if (!loginRes.success) {
      console.error("[둘기봇] 로그인 실패", loginRes.status);
      return false;
    }

    talkClient = new TalkClient();
    const res = await talkClient.login(loginRes.result);
    if (!res.success) {
      console.error("[둘기봇] TalkClient 로그인 실패", res.status);
      return false;
    }

    talkClient.on("chat", async (data, channel) => {
      try {
        const text = data.text || "";
        const nick =
          (data.sender && (data.sender.nickname || data.sender.userInfo?.nickname)) ||
          "user";
        const roomId = channel.channelId
          ? channel.channelId.toString()
          : String(channel);

        const replyFn = async (msg) => {
          // 맨션 시도 (라이브러리 API에 따라 조정)
          try {
            if (channel.sendChat) await channel.sendChat(msg);
            else if (channel.sendText) await channel.sendText(msg);
          } catch (e) {
            console.error("send error", e.message);
          }
        };

        await onMessage(roomId, nick, text, replyFn);
      } catch (e) {
        console.error("chat handler", e);
      }
    });

    console.log("[둘기봇] LOCO 로그인 성공");
    return true;
  } catch (e) {
    console.error("[둘기봇] node-kakao 로드/로그인 오류:", e.message);
    console.log("→ node-kakao가 동작하지 않으면 최신 LOCO 구현(KiwiTalk 등)으로 교체 필요");
    return false;
  }
}

/** 로컬 테스트용 stdin */
function startTestMode() {
  console.log("[둘기봇] 테스트 모드 (입력: /둘기봇 도움말)");
  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const roomId = "test-room";
  const nick = "테스터";
  rl.on("line", async (line) => {
    await onMessage(roomId, nick, line.trim(), async (msg) => {
      console.log("봇>", msg);
    });
  });
}

async function main() {
  console.log(`=== ${config.BOT_NAME} 시작 ===`);
  dataStore.save(dataStore.load());

  const ok = await tryLocoLogin();
  if (!ok) {
    if (process.stdin.isTTY) {
      console.log("LOCO 연결 없이 테스트 모드로 전환합니다.");
      startTestMode();
    } else {
      console.log("LOCO 로그인 실패. 클라우드에서 프로세스 유지 중(로그 확인).");
      console.log("→ 계정/DEVICE_UUID 확인 또는 메신저봇+Flask 백업 검토");
      setInterval(() => {}, 1 << 30);
    }
  }
}

main();
