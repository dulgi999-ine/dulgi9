const config = require("./config");

const HELP = `**${config.BOT_NAME} 전체 명령어**
시작: \`${config.PREFIX}\`

**기본**
\`${config.PREFIX} 도움말\`
\`${config.PREFIX} 가이드\`
\`${config.PREFIX} 처음\`
\`${config.PREFIX} 핑\`
\`${config.PREFIX} 정보\`

**경제 / 은행**
\`${config.PREFIX} 출석\`
\`${config.PREFIX} 잔액\`
\`${config.PREFIX} 은행\`
\`${config.PREFIX} 입금 [금액]\`
\`${config.PREFIX} 출금 [금액]\`
\`${config.PREFIX} 송금 [닉네임] [금액]\`
\`${config.PREFIX} 레벨\`
\`${config.PREFIX} 랭킹\`

**연동**
\`${config.PREFIX} 날씨 [지역]\`
\`${config.PREFIX} 환율\`
\`${config.PREFIX} 시간\`
\`${config.PREFIX} 요일\`
\`${config.PREFIX} 디데이 [YYYY-MM-DD]\`
\`${config.PREFIX} 계산 [수식]\`
\`${config.PREFIX} 번역 [문장]\`
\`${config.PREFIX} 로또\`
\`${config.PREFIX} 그림 [내용]\`

**가르치기**
\`${config.PREFIX} 가르치기 [말]==[대답]\`
\`${config.PREFIX} 배운거\`
\`${config.PREFIX} 가르치기삭제 [말]\`

**게임**
\`${config.PREFIX} 슬롯\`
\`${config.PREFIX} 룰렛 [빨강/검정/홀수/짝수] [금액]\`
\`${config.PREFIX} 하이로우 [하이/로우] [금액]\`
\`${config.PREFIX} 홀짝 [홀/짝] [금액]\`
\`${config.PREFIX} 주사위배팅 [1~6] [금액]\`
\`${config.PREFIX} 동전배팅 [앞/뒤] [금액]\`
\`${config.PREFIX} 업다운\`
\`${config.PREFIX} 숫자야구\`
\`${config.PREFIX} 가위바위보 [가위/바위/보]\`
\`${config.PREFIX} 주사위\`
\`${config.PREFIX} 동전\`
\`${config.PREFIX} 퀴즈\`
\`${config.PREFIX} 선택 A,B,C\`
\`${config.PREFIX} 밸런스\`
\`${config.PREFIX} 투표 [주제]\`

**재미**
\`${config.PREFIX} 궁합 [이름1] [이름2]\`
\`${config.PREFIX} 미션\`
\`${config.PREFIX} 타임캡슐 [일수] [메시지]\`
\`${config.PREFIX} 소설시작\`
\`${config.PREFIX} 소설 [내용]\`

**관리자**
\`${config.PREFIX} 어드민로그인 [비번]\`
\`${config.PREFIX} 포인트지급 [닉] [금액]\`
\`${config.PREFIX} 포인트회수 [닉] [금액]\`
\`${config.PREFIX} 방추가\`
\`${config.PREFIX} 방삭제\`
\`${config.PREFIX} 방목록\`

자세한 설명: \`${config.PREFIX} 가이드\``;

const GUIDE_HOME = `**${config.BOT_NAME} 가이드**

처음이면 → \`${config.PREFIX} 처음\`

세부 가이드:
\`${config.PREFIX} 가이드 경제\`
\`${config.PREFIX} 가이드 게임\`
\`${config.PREFIX} 가이드 연동\`
\`${config.PREFIX} 가이드 가르치기\`
\`${config.PREFIX} 가이드 맨션\`

명령 전체 목록: \`${config.PREFIX} 도움말\``;

const GUIDE_FIRST = `**처음 사용 안내**

1. 명령은 항상 \`${config.PREFIX}\` 로 시작합니다.
2. 예: \`${config.PREFIX} 출석\`
3. 포인트는 출석·게임으로 모읍니다.
4. 은행: \`${config.PREFIX} 입금 1000\`
5. 막히면 \`${config.PREFIX} 가이드\`

주의
- 욕설·정치·야한 내용은 처리하지 않습니다.
- 명령 사이 쿨다운이 있습니다.
- 송금 시 닉네임을 정확히 입력하세요.`;

const GUIDE_ECONOMY = `**경제 가이드**

\`${config.PREFIX} 출석\` — 하루 1회 포인트
\`${config.PREFIX} 잔액\` — 지갑·은행·레벨
\`${config.PREFIX} 입금 [금액]\` — 지갑 → 은행
\`${config.PREFIX} 출금 [금액]\` — 은행 → 지갑
\`${config.PREFIX} 송금 [닉네임] [금액]\` — 수수료 있음
\`${config.PREFIX} 랭킹\` — 지갑 순위

은행 이자는 출석 시 소량 지급됩니다.
도박은 기대값이 불리하게 설계되어 있습니다.`;

const GUIDE_GAME = `**게임 가이드**

베팅은 **선택 + 금액**이 필요합니다.
예: \`${config.PREFIX} 룰렛 빨강 100\`

미니게임:
- 업다운 / 숫자야구: 시작 후 숫자만 입력
- 가위바위보: 가위/바위/보 지정

포인트가 부족하면 실행되지 않습니다.`;

const GUIDE_LINK = `**연동 가이드**

\`${config.PREFIX} 날씨 서울\`
\`${config.PREFIX} 환율\`
\`${config.PREFIX} 계산 1+2*3\`
\`${config.PREFIX} 번역 안녕하세요\`
\`${config.PREFIX} 그림 귀여운 고양이\`
\`${config.PREFIX} 디데이 2026-12-25\`

외부 서비스 오류 시 잠시 후 다시 시도하세요.
이미지·AI는 안전 필터를 통과해야 합니다.`;

const GUIDE_TEACH = `**가르치기 가이드**

\`${config.PREFIX} 가르치기 안녕==안녕하세요!\`

규칙
- 방마다 따로 저장
- 개수 제한 / 금지어 불가 / 길이 제한
- 목록: \`${config.PREFIX} 배운거\`
- 삭제: \`${config.PREFIX} 가르치기삭제 안녕\`

악용 방지를 위해 제한이 강합니다.`;

const GUIDE_MENTION = `**맨션 안내**

LOCO 환경에서 가능하면 실제 맨션을 시도합니다.
안 될 경우:
- 닉네임을 정확히 입력
- 송금 등: \`${config.PREFIX} 송금 닉네임 1000\`
- \`${config.PREFIX} 최근\` 으로 최근 대화 닉네임 확인 가능`;

function guide(sub) {
  const s = (sub || "").trim();
  if (!s) return GUIDE_HOME;
  if (s === "경제") return GUIDE_ECONOMY;
  if (s === "게임") return GUIDE_GAME;
  if (s === "연동") return GUIDE_LINK;
  if (s === "가르치기") return GUIDE_TEACH;
  if (s === "맨션") return GUIDE_MENTION;
  return GUIDE_HOME;
}

module.exports = {
  HELP,
  GUIDE_FIRST,
  guide,
};
