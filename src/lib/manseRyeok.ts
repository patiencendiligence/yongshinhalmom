import { Solar, Lunar } from 'lunar-javascript';

const STANDARD_MERIDIAN = 135;
const DEFAULT_LONGITUDE = 126.9780; // 서울

/**
 * 한국 DST 기간
 */
const KOREAN_DST_RANGES = [
  {
    start: '1948-06-01T00:00:00+09:00',
    end: '1948-09-12T23:59:59+09:00',
  },
  {
    start: '1949-04-03T00:00:00+09:00',
    end: '1949-09-11T23:59:59+09:00',
  },
  {
    start: '1950-04-01T00:00:00+09:00',
    end: '1950-09-10T23:59:59+09:00',
  },
  {
    start: '1951-05-06T00:00:00+09:00',
    end: '1951-09-09T23:59:59+09:00',
  },
  {
    start: '1955-05-05T00:00:00+09:00',
    end: '1955-09-08T23:59:59+09:00',
  },
  {
    start: '1956-05-20T00:00:00+09:00',
    end: '1956-09-30T23:59:59+09:00',
  },
  {
    start: '1957-05-05T00:00:00+09:00',
    end: '1957-09-22T23:59:59+09:00',
  },
  {
    start: '1958-05-04T00:00:00+09:00',
    end: '1958-09-21T23:59:59+09:00',
  },
  {
    start: '1959-05-03T00:00:00+09:00',
    end: '1959-09-20T23:59:59+09:00',
  },
  {
    start: '1960-05-01T00:00:00+09:00',
    end: '1960-09-18T23:59:59+09:00',
  },
  {
    start: '1987-05-10T02:00:00+09:00',
    end: '1987-10-11T02:59:59+09:00',
  },
  {
    start: '1988-05-08T02:00:00+09:00',
    end: '1988-10-09T02:59:59+09:00',
  },
];

function isKoreanDST(date: Date) {
  return KOREAN_DST_RANGES.some((range) => {
    const start = new Date(range.start);
    const end = new Date(range.end);

    return date >= start && date <= end;
  });
}

/**
 * 균시차(EOT) 근사 계산
 * 단위: 분
 */
function getEquationOfTime(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);

  const diff =
    date.getTime() - start.getTime();

  const oneDay = 1000 * 60 * 60 * 24;

  const dayOfYear = Math.floor(diff / oneDay);

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
 * 진태양시 계산
 */
function normalizeTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude = DEFAULT_LONGITUDE
) {
  const originalDate = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0
  );

  const correctedDate = new Date(originalDate);

  // DST 보정
  if (isKoreanDST(correctedDate)) {
    correctedDate.setHours(
      correctedDate.getHours() - 1
    );
  }

  // 경도 보정
  // 1도 = 4분
  const longitudeOffsetMinutes =
    (longitude - STANDARD_MERIDIAN) * 4;

  correctedDate.setMinutes(
    correctedDate.getMinutes() + longitudeOffsetMinutes
  );

  // 균시차(EOT)
  const eot = getEquationOfTime(correctedDate);

  correctedDate.setMinutes(
    correctedDate.getMinutes() + eot
  );

  return correctedDate;
}

/**
 * 경계값 검사
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
  isLunar: boolean,
  longitude = DEFAULT_LONGITUDE
) {
  try {
    const [year, month, day] = birthDate
      .split('-')
      .map(Number);

    const [hour, minute] = birthTime
      .split(':')
      .map(Number);

    const correctedDate = normalizeTrueSolarTime(
      year,
      month,
      day,
      hour,
      minute,
      longitude
    );

    // 경계값 로그
    if (isBoundaryTime(
      correctedDate.getHours(),
      correctedDate.getMinutes()
    )) {
      console.warn(
        'Boundary time detected. Revalidation recommended.'
      );
    }

    let lunar: Lunar;

    if (isLunar) {
      lunar = Lunar.fromYmdHms(
        correctedDate.getFullYear(),
        correctedDate.getMonth() + 1,
        correctedDate.getDate(),
        correctedDate.getHours(),
        correctedDate.getMinutes(),
        correctedDate.getSeconds()
      );
    } else {
      const solar = Solar.fromYmdHms(
        correctedDate.getFullYear(),
        correctedDate.getMonth() + 1,
        correctedDate.getDate(),
        correctedDate.getHours(),
        correctedDate.getMinutes(),
        correctedDate.getSeconds()
      );

      lunar = solar.getLunar();
    }

    const eightChar = lunar.getEightChar();

    return {
      originalTime: `${birthDate} ${birthTime}`,

      correctedTime:
        `${correctedDate.getFullYear()}-` +
        `${String(correctedDate.getMonth() + 1).padStart(2, '0')}-` +
        `${String(correctedDate.getDate()).padStart(2, '0')} ` +
        `${String(correctedDate.getHours()).padStart(2, '0')}:` +
        `${String(correctedDate.getMinutes()).padStart(2, '0')}`,

      year: eightChar.getYear() + '년',
      month: eightChar.getMonth() + '월',
      day: eightChar.getDay() + '일',
      time: eightChar.getTime() + '시',

      full:
        `${eightChar.getYear()}년 ` +
        `${eightChar.getMonth()}월 ` +
        `${eightChar.getDay()}일 ` +
        `${eightChar.getTime()}시`,
    };
  } catch (error) {
    console.error('ManseRyeok calculation error:', error);
    return null;
  }
}