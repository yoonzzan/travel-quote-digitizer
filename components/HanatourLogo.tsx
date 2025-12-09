
import React from 'react';

interface HanatourLogoProps {
  className?: string;
  showText?: boolean;
}

const HanatourLogo: React.FC<HanatourLogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-start overflow-hidden w-48 h-16 ${className}`}>
      <img
        src="/hanatour_logo.png"
        alt="Hanatour Logo"
        className="w-full h-full object-contain transform scale-[3.5] -translate-x-3"
      />
    </div>
  );
};

export default HanatourLogo;
