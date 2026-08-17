/**
 * 민감 / 정지 위험 / 욕설 / 정치 / 야한 내용 전면 차단
 * 입력·출력 모두 검사
 */

const BAD = [
  // 욕설·비하
  "씨발", "시발", "ㅅㅂ", "병신", "새끼", "지랄", "꺼져", "닥쳐", "죽어", "뒤져",
  "fuck", "shit", "bitch", "느금", "니애미", "니애비", "애미", "애비",
  "장애인", "한남", "한녀", "틀딱", "쪽바리", "급식충", "한남충",
  // 위험
  "자살", "자해", "목매", "투신", "마약", "필로폰", "히로뽕", "살인", "테러",
  // 개인정보·보안
  "주민번호", "주민등록", "전화번호", "휴대폰", "핸드폰번호", "집주소", "계좌번호",
  "카드번호", "비밀번호", "비번알려", "아이피", "ip주소",
  // 성인
  "야한", "섹스", "성관계", "누드", "자위", "야동", "포르노", "porn", "nude",
  "가슴만", "유방", "엉덩이만", "팬티만", "브라만", "노출", "야설",
  // 정치
  "대통령", "윤석열", "이재명", "문재인", "민주당", "국힘", "국민의힘",
  "좌파", "우파", "탄핵", "대선", "총선", "정치인",
  // 카카오/제재 위험 유도
  "계정정지", "제재우회", "도배해라", "신고해라", "매크로", "자동도배",
  "해킹방법", "피싱", "사기치", "불법거래",
];

const IMAGE_BAD = [
  "가슴", "유방", "엉덩이", "속옷", "브라", "팬티", "누드", "노출", "벗은",
  "몸매", "글래머", "섹시", "야한", "란제리", "비키니", "nsfw", "nude", "naked",
  "breast", "boob", "ass", "lingerie", "hentai",
];

function normalize(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_./\\]/g, "");
}

function isBad(text) {
  if (!text || String(text).trim().length < 2) return false;
  const n = normalize(text);
  return BAD.some((w) => n.includes(normalize(w)));
}

function isImageBad(text) {
  if (!text) return false;
  const n = normalize(text);
  return IMAGE_BAD.some((w) => n.includes(normalize(w)));
}

/** 출력 직전 최종 검사. 위험하면 대체 문구 */
function sanitizeOut(text) {
  if (!text) return "";
  if (isBad(text)) return "해당 내용은 답변할 수 없습니다.";
  return text;
}

const BLOCK_REPLY = "해당 내용은 처리할 수 없습니다.";

module.exports = {
  isBad,
  isImageBad,
  sanitizeOut,
  BLOCK_REPLY,
  BAD,
  IMAGE_BAD,
};
