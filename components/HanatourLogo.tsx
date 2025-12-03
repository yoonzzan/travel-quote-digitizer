
import React from 'react';

interface HanatourLogoProps {
  className?: string;
  showText?: boolean;
}

export const HanatourLogoIcon = () => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left Purple Bar */}
    <path d="M16 48V12H6V48H16Z" fill="#5E2B97"/>
    {/* Right Purple Bar */}
    <path d="M54 48V12H44V48H54Z" fill="#5E2B97"/>
    {/* Top Mint Shape */}
    <path d="M41 24L19 16V24H41Z" fill="#00D3C5"/>
    {/* Bottom Mint Shape */}
    <path d="M19 36L41 44V36H19Z" fill="#00D3C5"/>
  </svg>
);

const HanatourLogo: React.FC<HanatourLogoProps> = ({ className, showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-10 h-10 flex-shrink-0">
        <HanatourLogoIcon />
      </div>
      {showText && (
        <span className="font-bold text-2xl text-[#5e2b97] tracking-tight" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
          하나투어
        </span>
      )}
    </div>
  );
};

export default HanatourLogo;
