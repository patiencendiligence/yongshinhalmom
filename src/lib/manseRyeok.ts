import { Solar, Lunar } from 'lunar-javascript';

/**
 * Checks if a given date in Korea was during a Daylight Saving Time (DST) period.
 * Korean DST periods:
 * 1948–1951: May–September
 * 1955–1960: May–September
 * 1987–1988: May–October
 */
function isKoreanDST(year: number, month: number, day: number): boolean {
  if (year === 1987) {
    // 1987: May 10 to Oct 11
    if (month > 5 && month < 10) return true;
    if (month === 5 && day >= 10) return true;
    if (month === 10 && day <= 11) return true;
  }
  if (year === 1988) {
    // 1988: May 8 to Oct 9
    if (month > 5 && month < 10) return true;
    if (month === 5 && day >= 8) return true;
    if (month === 10 && day <= 9) return true;
  }
  // Other historical DSTs can be added here if needed, 
  // but 1987-1988 are the most common ones people notice errors in.
  return false;
}

export function getManseRyeok(birthDate: string, birthTime: string, isLunar: boolean) {
  try {
    const [year, month, day] = birthDate.split('-').map(Number);
    let [hour, minute] = birthTime.split(':').map(Number);

    // Adjust for Korean DST in 1987-1988
    if (!isLunar && isKoreanDST(year, month, day)) {
      hour -= 1;
      if (hour < 0) hour = 0; // Simplified boundary handling
    }

    let lunar: Lunar;
    if (isLunar) {
      lunar = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
    } else {
      const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
      lunar = solar.getLunar();
    }

    const eightChar = lunar.getEightChar();
    
    return {
      year: eightChar.getYear() + "년",
      month: eightChar.getMonth() + "월",
      day: eightChar.getDay() + "일",
      time: eightChar.getTime() + "시",
      full: `${eightChar.getYear()}년 ${eightChar.getMonth()}월 ${eightChar.getDay()}일 ${eightChar.getTime()}시`
    };
  } catch (error) {
    console.error("ManseRyeok calculation error:", error);
    return null;
  }
}
