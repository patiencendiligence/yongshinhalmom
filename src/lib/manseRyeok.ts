
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

/**
 * DST 여부
 */
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
 * 균시차(EOT)
 * 단위: 분
 */
function getEquationOfTime(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);

  const diffMs = date.getTime() - startOfYear.getTime();

  const dayOfYear =
    Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  const B =
    ((360 / 365) * (dayOfYear - 81)) *
    (Math.PI / 180);

  return (
    9.87 * Math.sin(2 * B) -
    7.53 * Math.cos(B) -
    1.5 * Math.sin(B)
  );
}

/**
 * 진태양시 보정
 */
function normalizeTrueSolarTime(params: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  longitude?: number;
}) {
  const {
    year,
    month,
    day,
    hour,
    minute,
    longitude = DEFAULT_LONGITUDE,
  } = params;

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0
  );

  // invalid date 방지
  if (isNaN(date.getTime())) {
    throw new Error('Invalid birth date/time');
  }

  /**
   * 1. DST 보정
   */
  if (isKoreanDST(date)) {
    date.setHours(date.getHours() - 1);
  }

  /**
   * 2. 경도 보정
   * 1도 = 4분
   */
  const longitudeOffset =
    (longitude - STANDARD_MERIDIAN) * 4;

  date.setMinutes(
    date.getMinutes() + longitudeOffset
  );

  /**
   * 3. 균시차(EOT)
   */
  const eot = getEquationOfTime(date);

  date.setMinutes(
    date.getMinutes() + Math.round(eot)
  );

  return date;
}

/**
 * 경계 시간 검사
 */
function isBoundaryTime(date: Date): boolean {
  const totalMinutes =
    date.getHours() * 60 + date.getMinutes();

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

  return boundaries.some((boundary) => {
    return Math.abs(totalMinutes - boundary) <= 40;
  });
}

export function getManseRyeok(
  birthDate: string,
  birthTime: string,
  isLunar = false,
  longitude = DEFAULT_LONGITUDE
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
     * 진태양시 보정
     */
    const correctedDate =
      normalizeTrueSolarTime({
        year,
        month,
        day,
        hour,
        minute,
        longitude,
      });

    /**
     * 경계값 경고
     */
    if (isBoundaryTime(correctedDate)) {
      console.warn(
        '[Manse] Boundary time detected:',
        correctedDate.toISOString()
      );
    }

    const y = correctedDate.getFullYear();
    const m = correctedDate.getMonth() + 1;
    const d = correctedDate.getDate();
    const h = correctedDate.getHours();
    const min = correctedDate.getMinutes();
    const sec = correctedDate.getSeconds();

    let lunar: Lunar;

    if (isLunar) {
      lunar = Lunar.fromYmdHms(
        y,
        m,
        d,
        h,
        min,
        sec
      );
    } else {
      const solar = Solar.fromYmdHms(
        y,
        m,
        d,
        h,
        min,
        sec
      );

      lunar = solar.getLunar();
    }

    const eightChar = lunar.getEightChar();

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
        year: eightChar.getYear(),
        month: eightChar.getMonth(),
        day: eightChar.getDay(),
        time: eightChar.getTime(),
      },

      full:
        `${eightChar.getYear()}년 ` +
        `${eightChar.getMonth()}월 ` +
        `${eightChar.getDay()}일 ` +
        `${eightChar.getTime()}시`,
    };
  } catch (error) {
    console.error(
      '[getManseRyeok Error]',
      error
    );

    return null;
  }
}
