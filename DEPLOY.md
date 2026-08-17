# 둘기봇 클라우드 배포 (PC 없이)

PC 대신 **무료 클라우드**에 Node 봇을 올리는 방법입니다.

---

## 중요 먼저 읽기

1. **서브 계정만** 사용하세요. 메인 계정 금지.
2. node-kakao는 오래되어 **로그인이 안 될 수 있습니다.**
3. 약관 위반·계정 정지 위험이 있습니다.
4. 로그인 실패 시 서버는 떠 있어도 카톡에 응답하지 않습니다.
5. 그때는 메신저봇 + Flask 백업으로 전환하는 게 맞습니다.

---

## 준비물 (폰만으로 가능)

- 카카오톡 **서브 계정** 이메일/비밀번호
- GitHub 계정 (코드 올리기)
- Railway 또는 Render 계정 (이메일 가입)

기기 UUID는 한 번 PC/에뮬레이터나 기존 도구로 만들어야 하는 경우가 많습니다.  
없으면 로그인 단계에서 막힐 수 있습니다.

---

## 방법 A: Railway (추천 난이도)

1. GitHub에 `dulgi-bot` 폴더를 저장소로 푸시
2. https://railway.app 가입
3. **New Project** → **Deploy from GitHub** → 저장소 선택
4. **Variables** 에 추가:
   - `DULGI_EMAIL`
   - `DULGI_PASSWORD`
   - `DULGI_DEVICE_UUID`
   - `DULGI_DEVICE_NAME` = `둘기봇`
5. Deploy 후 로그에서 `[둘기봇] LOCO 로그인 성공` 확인

무료 크레딧이 소진되면 멈출 수 있습니다.

---

## 방법 B: Render

1. GitHub에 코드 푸시
2. https://render.com → **New Web Service**
3. 저장소 연결
4. Build: `npm install`
5. Start: `node src/index.js`
6. Environment 에 위와 같은 변수 입력
7. Free 플랜은 **15분 무접속 시 슬립** → 카톡 봇으로는 불리함  
   (항상 켜 두려면 유료 또는 다른 플랫폼)

---

## 방법 C: Oracle Cloud 무료 티어

- 진짜 24시간 서버가 필요할 때
- 가입·설정이 더 김 (카드 등록 필요할 수 있음)
- 서버에 Node 설치 후 `npm start` + `pm2` 추천

---

## 배포 후 확인

로그에 다음이 보이면 연결됨:

```
[둘기봇] LOCO 로그인 성공
```

실패 예:

```
[둘기봇] 로그인 실패
[둘기봇] node-kakao 로드/로그인 오류
```

→ node-kakao 한계. 이 경우 **메신저봇(폰) + Flask** 으로 전환하는 게 맞습니다.

---

## 폰에서 GitHub 올리는 대략 흐름

1. 폰 브라우저로 GitHub 접속
2. 새 저장소 생성
3. 웹에서 파일 업로드 (또는 GitHub 앱)
4. Railway/Render에서 그 저장소 연결

코드가 많으면 PC 없는 환경에서는 파일 업로드가 번거로울 수 있습니다.

---

## LOCO가 막히면 (백업 계획)

같은 기능 로직을:

- 안드로이드 **메신저봇R** (폰)
- **Flask API** (Railway/Render에 파이썬으로)

으로 다시 붙입니다.  
맨션만 텍스트 방식이고, 나머지(경제·가이드·안전·게임)는 동일합니다.
