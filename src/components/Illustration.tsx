import React from "react";

const zodiacGuardians = "/assets/zodiac_guardians.png";

interface IllustrationProps {
  zodiac: number;
  className?: string;
}

export default function Illustration({ zodiac, className = "" }: IllustrationProps) {
  const col = zodiac % 6;
  const row = Math.floor(zodiac / 6);
  
  return (
    <div 
      role="img"
      aria-label="용신할멈 AI 사주 분석 - 12지신 수호신 캐릭터 일러스트"
      className={`w-32 h-44 border border-white/10 rounded-lg zodiac-illustration shadow-2xl ${className}`}
      data-col={col}
      data-row={row}
      style={{
        backgroundImage: `url("${zodiacGuardians}")`,
        backgroundSize: "600% 200%",
        backgroundPosition: `${col * 20.2}% ${row * 100}%`,
        backgroundRepeat: "no-repeat"
      }}
    />
  );
}
