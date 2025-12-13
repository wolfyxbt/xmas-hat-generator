import React, { useState, useRef } from 'react';
import { Upload, Download, Copy, Check } from 'lucide-react';
import Editor, { EditorHandle } from './components/Editor';
import HatSelector from './components/HatSelector';
import { Hat } from './types';

const App: React.FC = () => {
  const [hatToAdd, setHatToAdd] = useState<Hat | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const editorRef = useRef<EditorHandle>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editorRef.current) {
      editorRef.current.loadFile(e.target.files[0]);
    }
  };

  const handleCopy = async () => {
    if (editorRef.current) {
      const success = await editorRef.current.copy();
      if (success) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans">
      <div className="max-w-[980px] mx-auto px-6 py-12 md:py-20">
        
        <main className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Editor - Occupies more space */}
          <div className="md:col-span-8 space-y-8">
             <Editor 
                ref={editorRef}
                hatToAdd={hatToAdd} 
                onHatAdded={() => setHatToAdd(null)}
                onImageStateChange={setHasImage}
             />
          </div>

          {/* Right Column: Title & Tools - Sticky on desktop */}
          <div className="md:col-span-4 space-y-10 md:sticky md:top-24">
            
            {/* 1. Header & Social Links */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1d1d1f] mb-4">
                  圣诞帽生成器
                </h1>
                <p className="text-lg md:text-xl leading-relaxed font-medium text-[#1d1d1f]">
                  上传头像，一键试戴。<br/>
                  <span className="text-[#86868b]">定制你的专属节日形象。</span>
                </p>
              </div>

              {/* Social Buttons - Redesigned for better visibility */}
              <div className="flex gap-3 mt-6">
                <a 
                  href="https://github.com/wolfyxbt/xmas-hat-generator" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#d2d2d7] rounded-xl text-sm font-semibold text-[#1d1d1f] hover:border-[#86868b] hover:bg-[#fafafa] hover:shadow-sm transition-all active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#1d1d1f]">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                    <path d="M9 18c-4.51 2-5-2-7-2"/>
                  </svg>
                  <span>GitHub</span>
                </a>
                <a 
                  href="https://x.com/wolfyxbt" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-black text-white border border-transparent rounded-xl text-sm font-semibold hover:bg-[#333] hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Follow</span>
                </a>
              </div>
            </div>

            {/* 2. Style Selector */}
            <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-4">选择样式</h2>
                  <HatSelector 
                    onSelect={setHatToAdd} 
                    selectedHatId={hatToAdd?.id} 
                  />
                </div>
            </div>

            {/* 3. Actions Module */}
            <div className="pt-6 border-t border-[#d2d2d7]">
               <div className="flex flex-col gap-3">
                 <label className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all cursor-pointer ${hasImage ? 'bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]' : 'bg-[#e5e5e5] text-[#86868b] cursor-not-allowed'}`}>
                    <Upload className="w-5 h-5" />
                    <span>{hasImage ? '更换底图' : '上传底图'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                 </label>

                 <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleCopy}
                        disabled={!hasImage}
                        className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
                          isCopied 
                          ? 'bg-[#e5fcf5] text-[#00a368]' 
                          : 'bg-white hover:bg-[#fafafa] text-[#1d1d1f] disabled:bg-[#f5f5f7] disabled:text-[#86868b] disabled:cursor-not-allowed border border-[#d2d2d7] hover:border-[#86868b]'
                        }`}
                    >
                        {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        {isCopied ? '已复制' : '复制图片'}
                    </button>

                    <button 
                        onClick={() => editorRef.current?.download()}
                        disabled={!hasImage}
                        className="w-full py-4 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <Download className="w-5 h-5" />
                        保存图片
                    </button>
                 </div>
               </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default App;