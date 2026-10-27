
const config = require("./config");
const safety = require("./safety");
const dataStore = require("./data");
const { handle } = require("./commands");

let talkClient = null;

function stripPrefix(message) {
  if (typeof message !== "string") return null;

  const prefix = config.PREFIX;
  if (!message.startsWith(prefix)) return null;

  return message.slice(prefix.length).trim();
}

async function onMessage(roomId, nick, messageText, replyFn) {
  try {
    if (!messageText || typeof messageText !== "string") return;

    // 접두사가 없는 메시지는 모두 무시
    const body = stripPrefix(messageText);
    if (body === null || body.length === 0) return;

    dataStore.pushRecent(roomId, nick);

    if (!dataStore.isRoomAllowed(roomId)) return;

    if (safety.isBad(messageText)) {
      await replyFn(safety.BLOCK_REPLY);
      return;
    }

    let kind = "default";

    if (/^(그림|번역)/.test(body)) {
      kind = body.startsWith("그림") ? "image" : "ai";
    } else if (
      /^(슬롯|룰렛|하이로우|홀짝|배팅|업다운|숫자야구|주사위배팅|동전배팅)/.test(body)
    ) {
      kind = "game";
    } else if (body === "출석") {
      kind = "attendance";
    } else if (body.startsWith("가르치기")) {
      kind = "teach";
    }

    const cooldown = dataStore.checkCooldown(nick, kind);

    if (cooldown.blocked) {
      await replyFn(cooldown.msg);
      return;
    }

    let reply = handle({
      roomId,
      nick,
      text: body,
    });

    if (reply === null || reply === undefined) return;

    reply = safety.sanitizeOut(String(reply));
    if (!reply) return;

    const maxLength = Math.max(1, config.MAX_REPLY_LENGTH || 900);

    while (reply.length > maxLength) {
      let cut = reply.slice(0, maxLength);
      const newline = cut.lastIndexOf("\n");

      if (newline > 500) cut = cut.slice(0, newline);

      await replyFn(cut);
      reply = reply.slice(cut.length);
    }

    if (reply.trim()) await replyFn(reply);
  } catch (error) {
    console.error("[둘기봇] 메시지 처리 오류:", error.message);

    try {
      await replyFn("처리 중 오류가 발생했습니다.");
    } catch (_) {}
  }
}

async function tryLocoLogin() {
  if (!config.EMAIL || !config.PASSWORD || !config.DEVICE_UUID) {
    console.error("[둘기봇] 로그인 환경변수 누락");
    console.error(
      "필요한 변수: DULGI_EMAIL, DULGI_PASSWORD, DULGI_DEVICE_UUID"
    );
    return false;
  }

  try {
    const { AuthApiClient, TalkClient } = require("node-kakao");

    console.log("[둘기봇] 카카오 로그인 시도 중...");

    const api = await AuthApiClient.create(
      config.DEVICE_NAME,
      config.DEVICE_UUID
    );

    const loginRes = await api.login({
      email: config.EMAIL,
      password: config.PASSWORD,
      forced: true,
    });

    if (!loginRes || !loginRes.success) {
      console.error("[둘기봇] 로그인 실패");
      console.error(
        "[둘기봇] 상태 코드:",
        loginRes ? loginRes.status : "응답 없음"
      );
      return false;
    }

    talkClient = new TalkClient();

    const result = await talkClient.login(loginRes.result);

    if (!result || !result.success) {
      console.error(
        "[둘기봇] TalkClient 로그인 실패:",
        result ? result.status : "응답 없음"
      );
      talkClient = null;
      return false;
    }

    talkClient.on("chat", async (data, channel) => {
      try {
        const messageText = data.text || "";
        const nick =
          data.sender?.nickname ||
          data.sender?.userInfo?.nickname ||
          "user";

        const roomId = channel.channelId
          ? String(channel.channelId)
          : String(channel);

        const replyFn = async (message) => {
          if (typeof channel.sendChat === "function") {
            await channel.sendChat(message);
          } else if (typeof channel.sendText === "function") {
            await channel.sendText(message);
          } else {
            console.error("[둘기봇] 메시지 전송 메서드를 찾을 수 없습니다.");
          }
        };

        await onMessage(roomId, nick, messageText, replyFn);
      } catch (error) {
        console.error("[둘기봇] 채팅 이벤트 오류:", error.message);
      }
    });

    console.log("[둘기봇] LOCO 로그인 성공");
    return true;
  } catch (error) {
    console.error("[둘기봇] 로그인 오류:", error.message);
    return false;
  }
}

async function main() {
  console.log(`=== ${config.BOT_NAME} 시작 ===`);

  try {
    dataStore.save(dataStore.load());
  } catch (error) {
    console.error("[둘기봇] 데이터 초기화 오류:", error.message);
  }

  const connected = await tryLocoLogin();

  if (!connected) {
    console.error(
      "[둘기봇] 카카오 연결 실패. 로그의 로그인 오류를 확인해 주세요."
    );

    if (process.stdin.isTTY) {
      console.log("[둘기봇] 콘솔 테스트 모드");

      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on("line", async (line) => {
        await onMessage("test-room", "테스터", line.trim(), async (msg) => {
          console.log("봇 >", msg);
        });
      });
    } else {
      // 서버 프로세스 유지
      setInterval(() => {}, 60000);
    }
  }
}

main().catch((error) => {
  console.error("[둘기봇] 치명적 오류:", error.message);
  process.exitCode = 1;
});
