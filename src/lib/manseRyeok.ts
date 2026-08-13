import { Solar, Lunar } from 'lunar-javascript';

const STANDARD_MERIDIAN = 135;
const DEFAULT_LONGITUDE = 126.9780; // 서울 기준

/**
 * 실무 관행: 서머타임(일광절약시간) / 1954~1961년 127도30분 표준시 구간에 대해
 * 별도의 보정을 하지 않는다.
 *
 * 역사적으로는 1948~51, 1955~60, 1987~88년에 서머타임이 있었고,
 * 1954~1961년에는 표준시 자체가 UTC+08:30이었던 시기도 있었지만,
 * 시중 대부분의 만세력 프로그램/책은 출생신고서 등에 기록된 시각을
 * 그대로 사용하고 이런 역사적 보정을 하지 않는 것이 일반적인 관행이다.
 * 이 앱도 그 관행을 따라 입력된 시각을 그대로 사용한다.
 */

/**
 * 경계값 로그 (시주가 바뀌는 경계 근처인지 참고용으로만 표시, 계산 자체에는 영향 없음)
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

    if (isBoundaryTime(hour, minute)) {
      console.warn(
        '[Manse] Boundary time:',
        `${hour}:${minute}`
      );
    }

    let lunarData: Lunar;

    if (isLunar) {
      lunarData = Lunar.fromYmdHms(
        year,
        month,
        day,
        hour,
        minute,
        0
      );
    } else {
      const solar = Solar.fromYmdHms(
        year,
        month,
        day,
        hour,
        minute,
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
          `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        time:
          `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
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

    const solar = Solar.fromYmdHms(y, m, d, h, min, 0);
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