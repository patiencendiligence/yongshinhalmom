
export function getReportHash(userData: any): string {
  if (!userData) return "";
  const { name, birthDate, birthTime, isLunar, gender, targetYear } = userData;
  const hashBase = `${name}|${birthDate}|${birthTime}|${isLunar}|${gender}|${targetYear}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashBase.length; i++) {
    const char = hashBase.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
