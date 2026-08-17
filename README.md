# 둘기봇

LOCO 계열(node-kakao 우선) 카카오톡 봇.  
명령 시작: `/둘기봇`

## 주의

- **서브 계정만** 사용하세요. 메인 계정 금지.
- node-kakao는 공식 중단된 라이브러리입니다. 로그인이 안 되면 KiwiTalk 등 최신 LOCO 구현으로 교체가 필요합니다.
- 약관 위반·계정 정지 위험이 있습니다. 사용 책임은 사용자에게 있습니다.
- 욕설·정치·야한 내용·개인정보 등 민감 발화는 입출력 모두 차단합니다.

## 설정

```bash
cd dulgi-bot
npm install
```

환경변수 또는 `src/config.js`:

- `DULGI_EMAIL`
- `DULGI_PASSWORD`
- `DULGI_DEVICE_UUID` (기기 UUID, base64 등 라이브러리 요구 형식)
- `DULGI_DEVICE_NAME` (기본: 둘기봇)

## 실행

```bash
npm start
```

로그인 정보가 없으면 **테스트 모드**(터미널 입력)로 동작합니다.

```
/둘기봇 도움말
/둘기봇 처음
/둘기봇 출석
```

## 구조

- `src/config.js` — 설정
- `src/safety.js` — 민감·정지 위험 필터
- `src/data.js` — JSON 저장
- `src/help.js` — 도움말·가이드
- `src/commands.js` — 명령 처리
- `src/index.js` — LOCO 로그인 + 라우팅

## 맨션

LOCO에서 지원되면 전송 API에 맨션을 붙이도록 확장합니다.  
실패 시 `/둘기봇 송금 닉네임 금액`, `/둘기봇 최근` 으로 대체합니다.
