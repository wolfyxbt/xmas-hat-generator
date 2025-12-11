import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { generateChristmasGreeting } from '../services/geminiService';

const GreetingGenerator: React.FC = () => {
  const [greeting, setGreeting] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generateChristmasGreeting();
    setGreeting(text);
    setLoading(false);
    setCopied(false);
  };

  const handleCopy = () => {
    if (greeting) {
      navigator.clipboard.writeText(greeting);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-[#0071e3] hover:bg-[#0077ed] disabled:bg-[#f5f5f7] disabled:text-[#86868b] text-white font-medium text-sm py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <span>正在思考...</span>
        ) : (
          <>
            <span>生成祝福语</span>
            <Sparkles className="w-4 h-4" />
          </>
        )}
      </button>

      {greeting && (
         <div 
            onClick={handleCopy}
            className="group cursor-pointer bg-white p-6 rounded-3xl shadow-sm border border-[#d2d2d7] relative transition-all hover:shadow-md"
         >
            <p className="text-[#1d1d1f] text-lg font-medium leading-relaxed text-center">
                "{greeting}"
            </p>
            
            <div className="absolute top-4 right-4 text-[#86868b] opacity-0 group-hover:opacity-100 transition-opacity">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </div>
            <p className="text-center text-[10px] uppercase tracking-wider text-[#86868b] mt-4 font-semibold">
                点击复制
            </p>
         </div>
      )}
    </div>
  );
};

export default GreetingGenerator;