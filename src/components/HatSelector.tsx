import React, { useState, useEffect } from 'react';
import { Hat } from '../types';

interface HatSelectorProps {
  onSelect: (hat: Hat) => void;
  selectedHatId?: string;
}

const HatSelector: React.FC<HatSelectorProps> = ({ onSelect, selectedHatId }) => {
  const [localHats, setLocalHats] = useState<Hat[]>([]);

  // Only use dynamically loaded local hats, no static SVGs
  const allHats = localHats;

  useEffect(() => {
    let active = true;
    let currentIndex = 1;
    const maxIndex = 50; // Safety limit

    const loadNextImage = () => {
      if (!active || currentIndex > maxIndex) return;

      const img = new Image();
      // Expecting images named 1.png, 2.png, etc. in the public/hats directory
      const src = `./hats/${currentIndex}.png`;
      
      img.onload = () => {
        if (!active) return;
        
        setLocalHats(prev => [
          ...prev, 
          { id: `local-${currentIndex}`, name: `款式 ${currentIndex}`, src }
        ]);
        
        currentIndex++;
        loadNextImage();
      };

      img.onerror = () => {
        // Stop loading when a file is not found
      };

      img.src = src;
    };

    loadNextImage();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4">
      {allHats.length === 0 && (
         <div className="col-span-4 text-center text-[#86868b] text-sm py-8 bg-white rounded-2xl border border-dashed border-[#d2d2d7]">
            正在加载素材...
         </div>
      )}
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
            className="w-full h-full object-contain pointer-events-none select-none" 
          />
        </button>
      ))}
    </div>
  );
};

export default HatSelector;