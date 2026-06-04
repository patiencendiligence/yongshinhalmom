export type Language = "ko" | "en";

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

export const translations = {
  ko: {
    title: "용신할멈",
    subtitle: "Life Analysis",
    grandmother: "scary grandma",
    ancientOracle: "사주 분석",
    viewTodayFortune: "오늘 운세 보기",
    viewFullReport: "전체 리포트 보기",
    expandFullReport: "전체 리포트 펼치기",
    todayFortuneTitle: "오늘의 운세",
    todayFlow: "오늘의 전반적인 흐름",
    todayPrecautions: "오늘 조심할 것",
    todayEnergies: "오늘 좋은 기운",
    todaySuccessWealth: "오늘의 성공운/재물운",
    todayLove: "오늘의 애정운",
    todayLotto: "오늘의 로또운",
    luckyColor: "행운 색상",
    luckyItem: "행운 아이템",
    luckyFood: "행운 음식",
    since: `Since ${currentYear}`,
    traditionalWisdom: "Data Insights",
    landingQuote: "자네의 고유한 자취와 환경을 살펴주마.\n더 나은 하루를 위한 길잡이가 되어 줄 테니 잘 확인해보게.",
    enterOracle: "보러 가기",
    loadProfiles: "저장된 기록 불러오기",
    storedKnowledge: "Stored Analysis History",
    storedProfiles: "저장된 기록",
    noProfiles: "저장된 기록이 없구나.",
    browserStorageNote: "기록은 네 그릇(브라우저)에 소중히 담아두었느니라.",
    solar: "양력",
    lunar: "음력",
    registryTitle: "기초 정보 입력",
    registrySubtitle: "분석을 위해 정보를 남겨보게",
    clientName: "성명",
    namePlaceholder: "이름을 적어보거라",
    birthPlace: "지역 정보",
    placePlaceholder: "예: 서울, 부산",
    birthDate: "생년월일",
    birthTime: "출생시각",
    calendarType: "기록 방식",
    gender: "성별",
    male: "남성",
    female: "여성",
    checkData: "분석하기",
    missingFields: "빈틈없이 적어주어야 내 명확히 살펴줄 수 있느니라.",
    loadingSummary: "사주 분석 중...",
    loadingDetail: "자취를 훑어내려가고 있으니, 잠시 마음을 가다듬고 기다려보게.",
    yourLifestyleReport: "Your Lifestyle Report",
    authorizedRecipient: "Authorized Recipient",
    section: "Section",
    askSpirit: "AI 질문하기",
    askSpiritDetail: "리포트를 보고도 궁금한 게 남았다면 내게 물어보게나.\n정성을 다해 답해주마.",
    askPlaceholder: "또 무엇이 궁금한게냐?",
    bokchaeNote: "내 정성이 도움이 되었다면 작은 성의를 보여주게나",
    payBokchae: "복채내기",
    backToHome: "처음으로 돌아가기",
    errorMessage: "할멈이 잠시 자리를 비웠소. 조금 있다가 다시 오시게.",
    quotaExceeded: "찾아오는 이가 너무 많아 잠시 숨을 고르는 중이니 조금 뒤에 다시 오게.",
    halmeomSpirit: "AI Assistant",
    infoTitle: "분석 기술 및 기준",
    appIntro: "용신할멈은 사용자의 고유 데이터와 환경적 패턴을 분석하여 현대적인 라이프스타일 인사이트를 제공합니다.",
    calcStandards: "데이터 처리 기준",
    standard1: "1. 환경 보정: 지정된 지역의 지리적 특성과 시간대를 정밀하게 보정하여 계산합니다.",
    standard2: "2. 시간 보정: 시행된 모든 표준시 변경 사항을 자동으로 감지하여 보정합니다.",
    standard3: "3. 패턴 감지: 시간별 기운의 흐름을 엄격히 구분하여 분석합니다.",
    standard4: "4. 현대적 관점: 단순한 예측이 아닌, 현대인의 생산성과 심리에 맞춘 실행 가능한 통찰을 제공합니다.",
    diffInfo: "분석 결과에 오류가 있다면 내게 알려주게.",
    reportBtn: "제보하기",
    reportTitle: "기술 오류 제보",
    reportLabel: "제보 내용 (최소 15자)",
    reportPlaceholder: "결과가 예상과 다르거나 개선할 점이 있다면 적어주게.",
    submit: "보내기",
    cancel: "취소",
    reportSuccess: "제보를 잘 받았느니라.",
    reportError: "보내는 데 실패했구나.",
    minCharsError: "내용이 너무 짧구나. 조금 더 자세히 적어보게.",
    login: "로그인",
    logout: "로그아웃",
    signInWithGoogle: "Google로 로그인",
    premiumFeature: "연간 운세 심층 분석",
    unlockDetailedReport: "더 깊은 통찰이 필요한가?",
    unlockButton: "복채내기 ($0.99 USD)",
    paymentSuccess: "성의를 확인했으니, 이제 그대의 자취를 더 깊이 들여다봐 주마.",
    freeTaste: "요약 리포트",
    lockedSectionNote: "이 섹션은 정밀 분석 알고리즘이 적용된 유료 영역이니라.",
    premiumBadge: "Premium Report",
    thisYear: `올해의 운세 (${currentYear})`,
    nextYear: `내년의 운세 (${nextYear})`,
    selectYear: "분석 연도 선택",
    chooseLevel: "분석 수준 선택",
    levelSimple: "기본 요약",
    levelDetailed: "심층 운세 ($0.99 USD)",
    simpleLockNote: "성의를 보여야 더 깊은 곳까지 비춰줄 수 있는 법...",
    savePdf: "리포트 저장 (PDF)",
    manseRyeok: "Data Pattern",
    policy: "정책 및 약관",
    coffee: "복채는 커피면 되네",
    policyView: {
      back: "돌아가기",
      label: "고시",
      title: "용신할멈 라이프스타일 분석",
      intro: "본 리포트를 통해 개인의 라이프스타일 패턴을 확인해보세요. 이 서비스는 날짜와 관련된 패턴을 기반으로 일반적인 통찰을 제공하며, 습관, 성향 및 일상 루틴을 돌아보는 데 도움을 줍니다.",
      whatYouGet: "제공되는 내용:",
      items: [
        "개인 라이프스타일 패턴 개요",
        "습관 및 생산성 통찰",
        "자기 성찰을 위한 질문",
        "일상생활을 위한 일반적인 가이드"
      ],
      disclaimer: "본 리포트는 정보 제공 및 자기 성찰 목적으로만 제작되었습니다. 어떠한 예측이나 전문적인 조언도 제공하지 않습니다.",
      support: "고객 지원",
      responseTime: "24시간 이내 답변",
      refundTitle: "환불 정책",
      refundText: "디지털 제품의 특성상, 리포트가 생성된 후에는 모든 판매가 최종적이며 환불이 불가능합니다. 기술적인 문제가 발생할 경우 문의해 주세요.",
      cancelTitle: "취소 정책",
      cancelText: "본 서비스는 1회성 구매입니다. 구독이나 반복 결제는 포함되지 않습니다.",
      legalTitle: "법적 고지",
      legalText: "본 서비스는 그러한 콘텐츠가 제한된 지역에서는 이용이 불가능할 수 있습니다.",
      termsTitle: "이용 약관",
      termsText: "본 제품을 구매함으로써 귀하는 콘텐츠가 일반적인 정보 제공 목적으로만 제공되며 금융, 의료 또는 법적 조언을 구성하지 않음에 동의합니다."
    },
    pricingView: {
      back: "돌아가기",
      label: "프리미엄 서비스",
      title: "상세리포트보기",
      subtitle: "당신의 라이프스타일 패턴을 깊이 분석합니다.",
      price: "$0.99 USD",
      purchase: "구매하기",
      features: [
        "개인 라이프스타일 패턴 개요",
        "습관 및 생산성 통찰",
        "자기 성찰을 위한 실천 가이드"
      ],
      oneTime: "단회성 결제 (구독 없음)",
      disclaimer: "결제 즉시 분석이 시작되며 디지털 콘텐츠 특성상 환불이 불가능합니다."
    }
  },
 en: {
  title: "Yongshin Halmeom",
  subtitle: "Fortune & Fate Reading",
  viewTodayFortune: "View Today's Fortune",
  viewFullReport: "View Full Report",
  expandFullReport: "Expand Full Report",
  todayFortuneTitle: "Today's Fortune",
  todayFlow: "Today's Overall Flow",
  todayPrecautions: "What to Watch Out For Today",
  todayEnergies: "Good Energies of Today",
  todaySuccessWealth: "Today's Success & Wealth",
  todayLove: "Today's Love Fortune",
  todayLotto: "Today's Lotto Fortune",
  luckyColor: "Lucky Color",
  luckyItem: "Lucky Item",
  luckyFood: "Lucky Food",

  grandmother: "old oracle",
  ancientOracle: "Saju Reading",

  since: `Since ${currentYear}`,

  traditionalWisdom: "Eastern Wisdom",

  landingQuote:
    "Let this old halmeom look into the flow tied to your birth.\nThere are seasons when a person must push forward, and seasons when one must endure quietly.",

  enterOracle: "Enter Reading",

  loadProfiles: "Load Previous Readings",

  storedKnowledge: "Stored Readings",
  storedProfiles: "Saved Readings",

  noProfiles:
    "No old records remain here.",

  browserStorageNote:
    "The records are quietly kept within your own browser.",

  solar: "Solar",
  lunar: "Lunar",

  registryTitle: "Birth Information",
  registrySubtitle:
    "Leave your details so the old flow may be examined.",

  clientName: "Name",

  namePlaceholder:
    "Write the name here",

  birthPlace: "Birth Place",

  placePlaceholder:
    "e.g. Seoul, Busan, Tokyo",

  birthDate: "Birth Date",
  birthTime: "Birth Time",

  calendarType: "Calendar Type",

  gender: "Gender",

  male: "Male",
  female: "Female",

  checkData: "Begin Reading",

  missingFields:
    "One cannot read the flow clearly with missing pieces.",

  loadingSummary:
    "Reading the fate structure...",

  loadingDetail:
    "The old halmeom is tracing the hidden flow tied to your birth. Wait quietly for a moment.",

  yourLifestyleReport:
    "Your Fate Reading",

  authorizedRecipient:
    "For the One Who Requested the Reading",

  section: "Section",

  askSpirit: "Ask the Halmeom",

  askSpiritDetail:
    "If something still weighs on your mind after reading,\nask the halmeom directly.\nAnother layer may yet be revealed.",

  askPlaceholder:
    "What troubles your mind still?",

  bokchaeNote:
    "If the reading helped you, leave a small offering.",

  payBokchae: "Leave an Offering",

  backToHome: "Return",
  

  errorMessage:
    "The halmeom has stepped away for a moment. Return a little later.",

  quotaExceeded:
    "Too many have come seeking answers at once. Wait a little and return.",

  halmeomSpirit: "Halmeom",

  infoTitle: "Reading Principles",

  appIntro:
    "Yongshin Halmeom examines the flow carried within one's birth time and environment, interpreting the hidden tendencies tied to life, relationships, work, and fortune.",

  calcStandards: "Reading Standards",

  standard1:
    "1. Regional Correction: The reading reflects the actual longitude and time structure of the birthplace.",

  standard2:
    "2. Time Adjustment: Historical daylight saving periods and temporal corrections are considered where necessary.",

  standard3:
    "3. Flow Separation: Distinct energy flows across time periods are strictly separated and interpreted.",

  standard4:
    "4. Traditional Interpretation: The reading follows long-standing Eastern fortune reading principles rather than modern personality tests.",

  diffInfo:
    "If the reading feels incorrect, leave word for the halmeom.",

  reportBtn: "Report Error",

  reportTitle: "Report an Issue",

  reportLabel:
    "Details (minimum 15 characters)",

  reportPlaceholder:
    "Describe the issue in detail.",

  submit: "Send",

  cancel: "Cancel",

  reportSuccess:
    "The halmeom has received your words.",

  reportError:
    "The words failed to reach the halmeom.",

  minCharsError:
    "Too short. Speak more clearly.",

  login: "Login",
  logout: "Logout",

  signInWithGoogle:
    "Sign in with Google",

  premiumFeature:
    "Detailed Annual Fortune Reading",

  unlockDetailedReport:
    "Would you see deeper into the coming flow?",

  unlockButton:
    "Leave Offering ($0.99 USD)",

  paymentSuccess:
    "The offering has been received. The deeper reading shall now be opened.",

  freeTaste: "Brief Reading",

  lockedSectionNote:
    "This part of the reading is sealed until an offering is made.",

  premiumBadge:
    "Full Reading",

  thisYear:
    `${currentYear} Fortune Flow`,

  nextYear:
    `${nextYear} Fortune Flow`,

  selectYear:
    "Select Year",

  chooseLevel:
    "Select Reading Depth",

  levelSimple:
    "Brief Reading",

  levelDetailed:
    "Full Fortune Reading ($0.99 USD)",

  simpleLockNote:
    "The deeper layers remain hidden until an offering is given.",

  savePdf:
    "Save Reading (PDF)",

  manseRyeok:
    "Manse Calendar",

  policy:
    "Policies & Terms",
  coffee: "Buy me a coffee",
}
};
