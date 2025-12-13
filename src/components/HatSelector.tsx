import React from 'react';
import { Hat } from '../types';
import { STATIC_HATS } from '../constants';

interface HatSelectorProps {
  onSelect: (hat: Hat) => void;
  selectedHatId?: string;
}

const HatSelector: React.FC<HatSelectorProps> = ({ onSelect, selectedHatId }) => {
  // 直接使用生成的静态列表，无需等待加载
  const allHats = STATIC_HATS;

  return (
    <div className="grid grid-cols-4 gap-4">
      {allHats.map((hat) => (
        <button
          key={hat.id}
          onClick={() => onSelect(hat)}
          className={`
            relative p-3 rounded-2xl transition-all duration-300 aspect-square flex items-center justify-center bg-white shadow-sm overflow-hidden border
            ${selectedHatId === hat.id 
              ? 'ring-2 ring-[#0071e3] border-[#0071e3] scale-105 z-10' 
              : 'border-transparent hover:border-[#d2d2d7] hover:scale-105 hover:shadow-md'}
          `}
        >
          <img 
            src={hat.src} 
            alt={hat.name} 
            loading="lazy"
            className="w-full h-full object-contain pointer-events-none select-none" 
          />
        </button>
      ))}
    </div>
  );
};

export default HatSelector;