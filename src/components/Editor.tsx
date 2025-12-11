import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Upload } from 'lucide-react';
import { Hat, PlacedHat } from '../types';

export interface EditorHandle {
  download: () => void;
  loadFile: (file: File) => void;
  copy: () => Promise<boolean>;
}

interface EditorProps {
  hatToAdd: Hat | null;
  onHatAdded: () => void;
  onImageStateChange?: (hasImage: boolean) => void;
}

// Interaction modes
type Mode = 'NONE' | 'DRAG' | 'ROTATE' | 'SCALE';

// Enforce a high resolution canvas workspace to ensure UI controls (buttons/lines) 
// are always sharp, even if the user uploads a low-res pixel art image.
const MIN_CANVAS_WIDTH = 2048;

const Editor = forwardRef<EditorHandle, EditorProps>(({ hatToAdd, onHatAdded, onImageStateChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [hats, setHats] = useState<PlacedHat[]>([]);
  const [selectedHatId, setSelectedHatId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Interaction State
  const [mode, setMode] = useState<Mode>('NONE');
  const [startInteraction, setStartInteraction] = useState({ 
    mouseX: 0, mouseY: 0, 
    startRotation: 0, startScale: 1,
    startX: 0, startY: 0
  });

  const BASE_HANDLE_RADIUS = 12; 

  // Notify parent about image state
  useEffect(() => {
    onImageStateChange?.(!!image);
  }, [image, onImageStateChange]);

  // Helper to determine the high-res working dimensions
  const getRenderDimensions = useCallback((img: HTMLImageElement) => {
    if (img.width >= MIN_CANVAS_WIDTH) {
      return { width: img.width, height: img.height };
    }
    const scale = MIN_CANVAS_WIDTH / img.width;
    return { width: MIN_CANVAS_WIDTH, height: img.height * scale };
  }, []);

  // Shared file processing logic
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setHats([]); // Clear hats on new image
        setSelectedHatId(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle Drag & Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  // Handle global paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            e.preventDefault(); // Prevent default paste behavior
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFile]);

  // Load user uploaded image from internal input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Preload hat image helper
  const loadHatImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (loadedImages[src]) {
        resolve(loadedImages[src]);
        return;
      }
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => ({ ...prev, [src]: img }));
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Add new hat when prop changes
  useEffect(() => {
    if (hatToAdd) {
      loadHatImage(hatToAdd.src).then((img) => {
        const newUid = Date.now().toString() + Math.random().toString().slice(2);
        
        let initialScale = 1;
        let initialX = 400;
        let initialY = 300;

        if (image) {
           // Use the High-Res Canvas Dimensions for positioning logic
           const { width: cvsW, height: cvsH } = getRenderDimensions(image);
           
           // Calculate target width relative to background (e.g. 35%)
           const targetWidth = cvsW * 0.35; 
           
           // RESTORED: Automatically scale hat to 35% of the canvas width
           initialScale = targetWidth / img.width;
           
           initialX = cvsW / 2;
           initialY = cvsH / 3;
           
           // Slight offset if adding multiple to avoid perfect overlap
           if (hats.length > 0) {
              initialX += (Math.random() - 0.5) * 40;
              initialY += (Math.random() - 0.5) * 40;
           }
        }

        const newHat: PlacedHat = {
          ...hatToAdd,
          uid: newUid,
          x: initialX,
          y: initialY,
          scale: initialScale,
          rotation: 0,
          isMirrored: false,
        };

        setHats(prev => [...prev, newHat]);
        setSelectedHatId(newUid);
        onHatAdded(); // Notify parent
      });
    }
  }, [hatToAdd, image, hats, onHatAdded, getRenderDimensions]);

  // Helper to get screen coordinates of corners for a specific hat
  const getTransformedCorners = useCallback((hat: PlacedHat) => {
    const img = loadedImages[hat.src];
    if (!img) return null;
    
    const w = img.width * hat.scale;
    const h = img.height * hat.scale;
    const rad = (hat.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Center x,y
    const cx = hat.x;
    const cy = hat.y;

    // Helper to rotate point
    const rotatePoint = (px: number, py: number) => ({
      x: px * cos - py * sin + cx,
      y: px * sin + py * cos + cy
    });

    const tr = rotatePoint(w/2, -h/2);  // Top Right
    const br = rotatePoint(w/2, h/2);   // Bottom Right
    const bl = rotatePoint(-w/2, h/2);  // Bottom Left
    const tl = rotatePoint(-w/2, -h/2); // Top Left

    return { tl, tr, br, bl, width: w, height: h };
  }, [loadedImages]);

  // Calculate scaling factor to ensure UI elements (handles) look consistent size
  // regardless of underlying image resolution.
  const getUiScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    // visual width (client rect) vs internal resolution (canvas.width)
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return 1;
    return canvas.width / rect.width;
  }, []);

  const drawHandle = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    color: string, 
    type: 'flip' | 'rotate' | 'scale' | 'delete',
    uiScale: number
  ) => {
      ctx.save();
      
      const radius = BASE_HANDLE_RADIUS * uiScale;
      const iconSize = (radius * 0.5); 
      
      // 1. Draw Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 4 * uiScale;
      ctx.shadowOffsetY = 2 * uiScale;

      // 2. Draw White Background Circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = type === 'delete' ? '#ff3b30' : '#ffffff';
      ctx.fill();
      
      // 3. Draw Stroke (Border)
      ctx.shadowColor = 'transparent'; 
      ctx.strokeStyle = type === 'delete' ? '#ff3b30' : '#e5e5e5';
      ctx.lineWidth = 1 * uiScale;
      ctx.stroke();

      // 4. Draw Icon (Vector Paths)
      ctx.translate(x, y); 
      ctx.strokeStyle = type === 'delete' ? '#ffffff' : color;
      ctx.lineWidth = 2 * uiScale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (type === 'rotate') {
        const r = iconSize;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.5); 
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r + (3*uiScale), -1*uiScale);
        ctx.lineTo(r, 3*uiScale);
        ctx.lineTo(r - (3*uiScale), -1*uiScale);
        ctx.stroke();
      } else if (type === 'scale') {
        ctx.rotate(Math.PI / 4);
        const s = iconSize;
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(s, 0);
        ctx.stroke();
        // Arrows
        ctx.beginPath();
        ctx.moveTo(-s + (3*uiScale), -3*uiScale);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s + (3*uiScale), 3*uiScale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s - (3*uiScale), -3*uiScale);
        ctx.lineTo(s, 0);
        ctx.lineTo(s - (3*uiScale), 3*uiScale);
        ctx.stroke();
      } else if (type === 'flip') {
        const w = iconSize;
        const yOffset = iconSize * 0.4;
        // Top arrow (Right)
        ctx.beginPath();
        ctx.moveTo(-w, -yOffset);
        ctx.lineTo(w, -yOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w - (2*uiScale), -yOffset - (2*uiScale));
        ctx.lineTo(w, -yOffset);
        ctx.lineTo(w - (2*uiScale), -yOffset + (2*uiScale));
        ctx.stroke();
        // Bottom arrow (Left)
        ctx.beginPath();
        ctx.moveTo(w, yOffset);
        ctx.lineTo(-w, yOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-w + (2*uiScale), yOffset - (2*uiScale));
        ctx.lineTo(-w, yOffset);
        ctx.lineTo(-w + (2*uiScale), yOffset + (2*uiScale));
        ctx.stroke();
      } else if (type === 'delete') {
         const s = iconSize * 0.8;
         ctx.beginPath();
         ctx.moveTo(-s, -s);
         ctx.lineTo(s, s);
         ctx.moveTo(s, -s);
         ctx.lineTo(-s, s);
         ctx.stroke();
      }

      ctx.restore();
  };

  const draw = useCallback((showControls = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate UI Scale for consistent handle sizes
    const uiScale = getUiScale();

    // 1. Clear & Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Enable High Quality Scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    if (image) {
       // Determine high-res canvas dimensions
       const { width: cvsW, height: cvsH } = getRenderDimensions(image);
       
       if (canvas.width !== cvsW || canvas.height !== cvsH) {
          canvas.width = cvsW;
          canvas.height = cvsH;
       }
       // Draw image scaled to fill the high-res canvas
       ctx.drawImage(image, 0, 0, cvsW, cvsH);
    } else {
       canvas.width = 800;
       canvas.height = 600;
       ctx.fillStyle = isDragging ? '#f2faff' : '#ffffff'; // Slight tint when dragging
       ctx.fillRect(0, 0, canvas.width, canvas.height);
       // REMOVED: "预览区域" text drawing block
    }

    // 2. Draw Hats
    hats.forEach(hat => {
      const img = loadedImages[hat.src];
      if (img) {
        ctx.save();
        ctx.translate(hat.x, hat.y);
        ctx.rotate((hat.rotation * Math.PI) / 180);
        if (hat.isMirrored) {
          ctx.scale(-1, 1);
        }
        const w = img.width * hat.scale;
        const h = img.height * hat.scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    });

    // 3. Draw Controls for Selected Hat
    if (showControls && image && selectedHatId) {
       const selectedHat = hats.find(h => h.uid === selectedHatId);
       if (selectedHat) {
         const corners = getTransformedCorners(selectedHat);
         if (corners) {
            // Draw Box
            ctx.beginPath();
            ctx.moveTo(corners.tl.x, corners.tl.y);
            ctx.lineTo(corners.tr.x, corners.tr.y);
            ctx.lineTo(corners.br.x, corners.br.y);
            ctx.lineTo(corners.bl.x, corners.bl.y);
            ctx.closePath();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2 * uiScale;
            ctx.stroke();

            ctx.strokeStyle = '#1d1d1f';
            ctx.lineWidth = 1 * uiScale;
            ctx.setLineDash([6 * uiScale, 4 * uiScale]); 
            ctx.stroke();
            ctx.setLineDash([]); 

            // Top-Left: Delete
            drawHandle(ctx, corners.tl.x, corners.tl.y, '#ff3b30', 'delete', uiScale);
            // Top-Right: Rotate
            drawHandle(ctx, corners.tr.x, corners.tr.y, '#0071e3', 'rotate', uiScale);
            // Bottom-Right: Scale
            drawHandle(ctx, corners.br.x, corners.br.y, '#1d1d1f', 'scale', uiScale);
            // Bottom-Left: Flip
            drawHandle(ctx, corners.bl.x, corners.bl.y, '#1d1d1f', 'flip', uiScale);
         }
       }
    }
  }, [image, hats, loadedImages, selectedHatId, getTransformedCorners, getUiScale, getRenderDimensions, isDragging]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Coordinate conversion
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Canvas resolution vs Display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const isPointInCircle = (px: number, py: number, cx: number, cy: number, radius: number) => {
     return Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2)) <= radius; 
  };

  const deleteSelectedHat = () => {
    if (selectedHatId) {
      setHats(prev => prev.filter(h => h.uid !== selectedHatId));
      setSelectedHatId(null);
      setMode('NONE');
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!image) return;
    const { x, y } = getCanvasCoords(e);
    const uiScale = getUiScale();
    const hitRadius = BASE_HANDLE_RADIUS * uiScale * 1.5; // Larger hit area

    // 1. Check controls of selected hat first
    if (selectedHatId) {
       const hat = hats.find(h => h.uid === selectedHatId);
       if (hat) {
          const corners = getTransformedCorners(hat);
          if (corners) {
            // Delete (TL)
            if (isPointInCircle(x, y, corners.tl.x, corners.tl.y, hitRadius)) {
               deleteSelectedHat();
               return;
            }
            // Rotate (TR)
            if (isPointInCircle(x, y, corners.tr.x, corners.tr.y, hitRadius)) {
               setMode('ROTATE');
               setStartInteraction({ mouseX: x, mouseY: y, startRotation: hat.rotation, startScale: hat.scale, startX: hat.x, startY: hat.y });
               return;
            }
            // Scale (BR)
            if (isPointInCircle(x, y, corners.br.x, corners.br.y, hitRadius)) {
               setMode('SCALE');
               setStartInteraction({ mouseX: x, mouseY: y, startRotation: hat.rotation, startScale: hat.scale, startX: hat.x, startY: hat.y });
               return;
            }
            // Flip (BL)
            if (isPointInCircle(x, y, corners.bl.x, corners.bl.y, hitRadius)) {
               // Toggle flip immediately
               setHats(prev => prev.map(h => h.uid === selectedHatId ? { ...h, isMirrored: !h.isMirrored } : h));
               return;
            }
          }
       }
    }

    // 2. Check Hit on any hat (Reverse order to check Topmost first)
    for (let i = hats.length - 1; i >= 0; i--) {
       const hat = hats[i];
       const img = loadedImages[hat.src];
       if (!img) continue;

       // Simple OBB (Oriented Bounding Box) hit test or simplified AABB logic
       // Transform click point to local hat space
       const dx = x - hat.x;
       const dy = y - hat.y;
       const rad = (-hat.rotation * Math.PI) / 180; // Negative for inverse rotate
       const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
       const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
       
       const w = img.width * hat.scale;
       const h = img.height * hat.scale;

       if (localX >= -w/2 && localX <= w/2 && localY >= -h/2 && localY <= h/2) {
          setSelectedHatId(hat.uid);
          // Bring to front: Remove and push to end
          setHats(prev => {
             const others = prev.filter(h => h.uid !== hat.uid);
             return [...others, hat];
          });
          
          setMode('DRAG');
          setStartInteraction({ mouseX: x, mouseY: y, startRotation: hat.rotation, startScale: hat.scale, startX: hat.x, startY: hat.y });
          return;
       }
    }
    
    // Clicked background -> Deselect
    setSelectedHatId(null);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode === 'NONE' || !selectedHatId) return;
    e.preventDefault(); 
    const { x, y } = getCanvasCoords(e);
    
    setHats(prev => prev.map(hat => {
       if (hat.uid !== selectedHatId) return hat;

       if (mode === 'DRAG') {
          const dx = x - startInteraction.mouseX;
          const dy = y - startInteraction.mouseY;
          return { ...hat, x: startInteraction.startX + dx, y: startInteraction.startY + dy };
       }
       
       if (mode === 'ROTATE') {
          const dx = x - hat.x;
          const dy = y - hat.y;
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          const startDx = startInteraction.mouseX - hat.x;
          const startDy = startInteraction.mouseY - hat.y;
          const startAngle = Math.atan2(startDy, startDx) * (180 / Math.PI);
          
          return { ...hat, rotation: startInteraction.startRotation + (angle - startAngle) };
       }

       if (mode === 'SCALE') {
          const dist = Math.sqrt(Math.pow(x - hat.x, 2) + Math.pow(y - hat.y, 2));
          const startDist = Math.sqrt(Math.pow(startInteraction.mouseX - hat.x, 2) + Math.pow(startInteraction.mouseY - hat.y, 2));
          const newScale = startInteraction.startScale * (dist / startDist);
          return { ...hat, scale: Math.max(0.1, newScale) };
       }

       return hat;
    }));
  };

  const handleMouseUp = () => {
    setMode('NONE');
  };

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    draw(false);
    const link = document.createElement('a');
    link.download = 'christmas-avatar.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    draw(true);
  }, [image, draw]);

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return false;
    
    draw(false); // Draw without controls
    
    try {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Failed to create blob");
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      draw(true); // Redraw with controls (if any selected)
      return true;
    } catch (err) {
      console.error("Copy failed", err);
      draw(true);
      return false;
    }
  }, [image, draw]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    download: handleDownload,
    loadFile: processFile,
    copy: handleCopy
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Canvas Area */}
      <div 
          ref={containerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-3xl overflow-hidden shadow-sm border flex items-center justify-center min-h-[400px] lg:min-h-[600px] transition-all touch-none select-none ${
             isDragging 
             ? 'border-[#0071e3] ring-4 ring-[#0071e3]/10 bg-[#f5f5f7]' 
             : 'border-[#d2d2d7] bg-white'
          }`}
      >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className={`max-w-full max-h-[70vh] object-contain w-full h-auto block ${!image ? 'pointer-events-none' : 'cursor-default'}`}
            style={{ cursor: mode === 'DRAG' ? 'move' : mode === 'ROTATE' ? 'crosshair' : mode === 'SCALE' ? 'nwse-resize' : !image ? 'default' : 'default' }}
          />
          
          {!image && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
                  <div className="text-[#86868b] text-center">
                    <p className="text-lg font-medium">尚未选择图片</p>
                    <p className="text-sm text-[#86868b]/70 mt-2">支持拖拽上传或 Ctrl+V 粘贴</p>
                  </div>
                  <div className="mt-4 px-6 py-3 bg-[#1d1d1f] text-white rounded-full font-medium text-sm flex items-center gap-2 pointer-events-auto cursor-pointer shadow-lg hover:scale-105 transition-transform" onClick={() => document.getElementById('file-upload')?.click()}>
                      <Upload className="w-4 h-4" />
                      上传头像
                  </div>
                  <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
          )}
          
          {/* Visual feedback overlay for Drag & Drop */}
          {isDragging && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-50 pointer-events-none border-4 border-dashed border-[#0071e3] rounded-3xl m-2">
                <div className="bg-[#0071e3] text-white px-6 py-3 rounded-full font-medium shadow-lg flex items-center gap-2 animate-bounce">
                   <Upload className="w-5 h-5" />
                   释放以添加图片
                </div>
             </div>
          )}
      </div>
    </div>
  );
});

export default Editor;