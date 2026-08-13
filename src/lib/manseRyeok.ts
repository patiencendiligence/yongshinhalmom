import { Solar, Lunar } from 'lunar-javascript';

const STANDARD_MERIDIAN = 135;
const DEFAULT_LONGITUDE = 126.9780; // 서울 기준

/**
 * 대한민국 DST(서머타임) 시행 기간
 *
 * - 1948~1951, 1987~1988: 표준시가 동경 135도(UTC+09:00)였던 시기의 서머타임
 * - 1955~1960: 표준시가 동경 127도30분(UTC+08:30)이었던 시기의 서머타임.
 *   이 기간은 표준시 자체가 현재와 30분 다르기 때문에, 순수 DST 보정(-1시간)만으로는
 *   부정확하다. 아래 OLD_MERIDIAN 로직과 함께 처리해야 한다.
 */
const KOREAN_DST_RANGES = [
  ['1948-06-01T00:00:00+09:00', '1948-09-12T23:59:59+09:00'],
  ['1949-04-03T00:00:00+09:00', '1949-09-11T23:59:59+09:00'],
  ['1950-04-01T00:00:00+09:00', '1950-09-10T23:59:59+09:00'],
  ['1951-05-06T00:00:00+09:00', '1951-09-09T23:59:59+09:00'],
  ['1955-05-05T00:00:00+09:00', '1955-09-08T23:59:59+09:00'],
  ['1956-05-20T00:00:00+09:00', '1956-09-30T23:59:59+09:00'],
  ['1957-05-05T00:00:00+09:00', '1957-09-22T23:59:59+09:00'],
  ['1958-05-04T00:00:00+09:00', '1958-09-21T23:59:59+09:00'],
  ['1959-05-03T00:00:00+09:00', '1959-09-20T23:59:59+09:00'],
  ['1960-05-01T00:00:00+09:00', '1960-09-18T23:59:59+09:00'],
  ['1987-05-10T02:00:00+09:00', '1987-10-11T02:59:59+09:00'],
  ['1988-05-08T02:00:00+09:00', '1988-10-09T02:59:59+09:00'],
] as const;

/**
 * 표준자오선이 동경 127도30분(UTC+08:30)이었던 구간.
 * 1954-03-21 0시부터 1961-08-10 0시30분(현재 +09:00 기준 표기) 직전까지.
 *
 * 출처: 대통령령 제876호(1954.3.17, 표준자오선변경에관한건),
 *       표준자오선변경에관한법률(1961.8.7, 법률 제676호)
 */
const OLD_MERIDIAN_START = '1954-03-21T00:00:00+09:00';
const OLD_MERIDIAN_END = '1961-08-10T00:30:00+09:00';

function isKoreanDST(date: Date): boolean {
  const time = date.getTime();

  return KOREAN_DST_RANGES.some(([start, end]) => {
    return (
      time >= new Date(start).getTime() &&
      time <= new Date(end).getTime()
    );
  });
}

/**
 * 1954-03-21 ~ 1961-08-09 사이(동경 127도30분, UTC+08:30 표준시 구간)인지 판별.
 * 위 KOREAN_DST_RANGES와 마찬가지로 "+09:00 표기"로 통일된 기준선과 비교한다.
 */
function isOldMeridianEra(date: Date): boolean {
  const time = date.getTime();
  return (
    time >= new Date(OLD_MERIDIAN_START).getTime() &&
    time < new Date(OLD_MERIDIAN_END).getTime()
  );
}

/**
 * 실무 한국 만세력 스타일 시간 보정
 *
 * 핵심:
 * - 1954~1961 구간의 표준자오선 변경(127도30분, UTC+08:30) 보정
 * - 그 구간 안에 있는 서머타임(1955~1960)은 "표준시(+08:30) + 1시간 DST" 이므로
 *   현재(UTC+09:00) 기준으로는 순수 -1시간이 아니라 -30분 보정이 되어야 함
 * - 1954, 1961년 1~8월처럼 서머타임이 아닌 구간은 현재 기준 +30분 보정
 * - 1948~1951, 1987~1988 서머타임은 원래 표준시가 UTC+09:00였으므로 기존처럼 -1시간
 * - 과도한 진태양시 보정 제거
 * - 경도/EOT 제거
 * - 한국 실무 역술 결과에 최대한 맞춤
 */
function normalizeKoreanManseTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): { year: number; month: number; day: number; hour: number; minute: number } {
  const date = new Date(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`
  );

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  const dst = isKoreanDST(date);
  const oldMeridian = isOldMeridianEra(date);

  if (oldMeridian) {
    /**
     * 1954-03-21 ~ 1961-08-09: 표준시가 동경 127도30분(UTC+08:30)이었던 구간.
     * 위에서 만든 date 객체는 편의상 "+09:00"으로 파싱했으므로, 실제 표준시와는
     * 항상 30분의 오차가 존재한다. 이를 보정해야 한다.
     */
    if (dst) {
      // 서머타임 중: 실제 시각은 UTC+09:30 (표준 08:30 + DST 1시간).
      // 현재(+09:00) 기준으로 보면 30분 "앞당겨진" 상태이므로 30분을 뺀다.
      date.setMinutes(date.getMinutes() - 30);
    } else {
      // 서머타임이 아닐 때: 실제 시각은 UTC+08:30.
      // 현재(+09:00) 기준보다 30분 "느렸던" 것이므로 30분을 더한다.
      date.setMinutes(date.getMinutes() + 30);
    }
  } else if (dst) {
    /**
     * 1948~1951, 1987~1988: 표준시가 이미 UTC+09:00였던 구간의 서머타임.
     * 서머타임 중에는 실제 시각이 UTC+10:00였으므로 1시간을 뺀다.
     */
    date.setHours(date.getHours() - 1);
  }

  // To extract the corrected components timezone-safely (KST = UTC + 9 hours),
  // we shift the timestamp by 9 hours and use UTC getters.
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);

  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth() + 1,
    day: kstDate.getUTCDate(),
    hour: kstDate.getUTCHours(),
    minute: kstDate.getUTCMinutes()
  };
}

/**
 * 경계값 로그
 */
function isBoundaryTime(hour: number, minute: number) {
  const total = hour * 60 + minute;

  const boundaries = [
    60,
    180,
    300,
    420,
    540,
    660,
    780,
    900,
    1020,
    1140,
    1260,
    1380,
  ];

  return boundaries.some(
    (b) => Math.abs(total - b) <= 40
  );
}

export function getManseRyeok(
  birthDate: string,
  birthTime: string,
  isLunar = false
) {
  try {
    if (!birthDate || !birthTime) {
      throw new Error('birthDate/birthTime required');
    }

    const [year, month, day] =
      birthDate.split('-').map(Number);

    const [hour, minute] =
      birthTime.split(':').map(Number);

    if (
      [year, month, day, hour, minute].some(
        (v) => Number.isNaN(v)
      )
    ) {
      throw new Error('Invalid numeric input');
    }

    /**
     * 실무 만세력 기준 시간 보정
     */
    const corrected =
      normalizeKoreanManseTime(
        year,
        month,
        day,
        hour,
        minute
      );

    const y = corrected.year;
    const m = corrected.month;
    const d = corrected.day;
    const h = corrected.hour;
    const min = corrected.minute;

    if (isBoundaryTime(h, min)) {
      console.warn(
        '[Manse] Boundary time:',
        `${h}:${min}`
      );
    }

    let lunarData: Lunar;

    if (isLunar) {
      lunarData = Lunar.fromYmdHms(
        y,
        m,
        d,
        h,
        min,
        0
      );
    } else {
      const solar = Solar.fromYmdHms(
        y,
        m,
        d,
        h,
        min,
        0
      );

      if (!solar) {
        throw new Error('Solar creation failed');
      }

      lunarData = solar.getLunar();
    }

    if (!lunarData) {
      throw new Error('Lunar conversion failed');
    }

    const ec = lunarData.getEightChar();

    const branch = ec.getYear().charAt(1);
    const BRANCH_TO_ZODIAC: Record<string, number> = {
      '子': 0, // 쥐 (Rat)
      '丑': 1, // 소 (Ox)
      '寅': 2, // 호랑이 (Tiger)
      '卯': 3, // 토끼 (Rabbit)
      '辰': 4, // 용 (Dragon)
      '巳': 5, // 뱀 (Snake)
      '午': 6, // 말 (Horse)
      '未': 7, // 양 (Sheep)
      '申': 8, // 원숭이 (Monkey)
      '酉': 9, // 닭 (Rooster)
      '戌': 10, // 개 (Dog)
      '亥': 11, // 돼지 (Pig)
    };
    const zodiacIndex = BRANCH_TO_ZODIAC[branch] !== undefined ? BRANCH_TO_ZODIAC[branch] : 0;

    return {
      zodiac: zodiacIndex,
      original: {
        birthDate,
        birthTime,
      },

      corrected: {
        date:
          `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        time:
          `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      },

      pillars: {
        year: ec.getYear(),
        month: ec.getMonth(),
        day: ec.getDay(),
        time: ec.getTime(),
      },

      full:
        `${ec.getYear()}년 ` +
        `${ec.getMonth()}월 ` +
        `${ec.getDay()}일 ` +
        `${ec.getTime()}시`,
    };
  } catch (error) {
    console.error(
      '[getManseRyeok Error]',
      error
    );

    return null;
  }
}

export function getTodayPillar(): string {
  try {
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(Date.now() + kstOffset);
    const y = kstDate.getUTCFullYear();
    const m = kstDate.getUTCMonth() + 1;
    const d = kstDate.getUTCDate();
    const h = kstDate.getUTCHours();
    const min = kstDate.getUTCMinutes();

    const corrected = normalizeKoreanManseTime(y, m, d, h, min);
    const cy = corrected.year;
    const cm = corrected.month;
    const cd = corrected.day;
    const ch = corrected.hour;
    const cmin = corrected.minute;

    const solar = Solar.fromYmdHms(cy, cm, cd, ch, cmin, 0);
    if (!solar) return "";
    const lunarData = solar.getLunar();
    if (!lunarData) return "";
    const ec = lunarData.getEightChar();
    if (!ec) return "";
    const hanjaPillar = ec.getDay();

    const HANJA_TO_KOREAN: Record<string, string> = {
      '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
      '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
      '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
      '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
      '戌': '술', '亥': '해'
    };

    return hanjaPillar.split("").map(char => HANJA_TO_KOREAN[char] || char).join("");
  } catch (error) {
    console.error('[getTodayPillar Error]', error);
    return "";
  }
}