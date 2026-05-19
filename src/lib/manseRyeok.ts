
import { Solar, Lunar } from 'lunar-javascript';

const STANDARD_MERIDIAN = 135;
const DEFAULT_LONGITUDE = 126.9780; // 서울 기준

/**
 * 대한민국 DST 기간
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
 * 실무 한국 만세력 스타일 시간 보정
 *
 * 핵심:
 * - DST만 반영
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
): Date {
  const date = new Date(
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`
  );

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  /**
   * 한국 DST만 적용
   */
  if (isKoreanDST(date)) {
    date.setHours(date.getHours() - 1);
  }

  return date;
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
    const correctedDate =
      normalizeKoreanManseTime(
        year,
        month,
        day,
        hour,
        minute
      );

    const y = correctedDate.getFullYear();
    const m = correctedDate.getMonth() + 1;
    const d = correctedDate.getDate();
    const h = correctedDate.getHours();
    const min = correctedDate.getMinutes();

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

    return {
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