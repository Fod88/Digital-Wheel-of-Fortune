/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, RotateCw, Settings2, Trophy, X, Hash, History, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#14b8a6', '#6366f1', '#a855f7', '#d946ef'
];

export default function App() {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(20); // Default to a smaller range for better initial look
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate slices based on range - one slice per number
  const slices = useMemo(() => {
    const items = [];
    const range = max - min + 1;
    
    // We'll render every number. If the range is huge, it will be dense.
    // We cap at 300 to prevent extreme browser lag, which is plenty for a wheel.
    const displayCount = Math.min(range, 300); 
    
    for (let i = 0; i < displayCount; i++) {
      const value = min + i;
      items.push({ 
        label: `${value}`, 
        color: COLORS[i % COLORS.length], 
        start: value, 
        end: value 
      });
    }
    return items;
  }, [min, max]);

  // Draw the wheel on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    // Draw background image if exists
    if (bgImage) {
      const img = new Image();
      img.src = bgImage;
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        ctx.restore();
        drawSlices(true);
      };
    } else {
      drawSlices(false);
    }

    function drawSlices(hasBg: boolean) {
      const sliceAngle = (Math.PI * 2) / slices.length;

      slices.forEach((slice, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        
        if (hasBg) {
          ctx.fillStyle = `${slice.color}33`; // Semi-transparent color over background image
        } else {
          ctx.fillStyle = slice.color;
        }
        
        ctx.fill();
        
        // Clear divisions - white lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw text - adjust font size based on number of slices
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        const fontSize = slices.length > 50 ? '10px' : slices.length > 20 ? '12px' : '16px';
        ctx.font = `bold ${fontSize} Inter`;
        
        ctx.fillText(slice.label, radius - 25, 5);
        ctx.restore();
      });

      // Outer border
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }, [slices, bgImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;
    if (min >= max) {
      alert('يرجى التأكد من أن الحد الأدنى أصغر من الحد الأقصى');
      return;
    }

    setIsSpinning(true);
    setResult(null);
    
    // Pick a random slice from the ones currently on the wheel
    const randomIndex = Math.floor(Math.random() * slices.length);
    const targetSlice = slices[randomIndex];
    
    // The winning number is within that slice (for us, start and end are the same)
    const winningNumber = Math.floor(Math.random() * (targetSlice.end - targetSlice.start + 1)) + targetSlice.start;
    
    const sliceAngle = 360 / slices.length;
    
    // Calculate rotation to land on the slice
    const baseRotation = 360 * 5; // 5 full spins
    const sliceOffset = Math.random() * (sliceAngle * 0.8) + (sliceAngle * 0.1); 
    const targetRotation = 360 - (randomIndex * sliceAngle + sliceOffset) + 270;
    
    const totalRotation = rotation + baseRotation + (targetRotation % 360);
    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(winningNumber);
      setHistory(prev => [winningNumber, ...prev].slice(0, 5));
      setShowResultModal(true);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#FFD700']
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden" dir="rtl">
      {/* Immersive Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/20 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/4 w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12 flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 min-h-screen items-center">
        
        {/* Left Section: Controls & History (Col 1-4) */}
        <div className="w-full lg:col-span-4 space-y-6 order-2 lg:order-1">
          <div className="space-y-3 text-center lg:text-right">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/10"
            >
              <Sparkles size={14} />
              <span>الإصدار الملون 2.5</span>
            </motion.div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              عجلة الحظ <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">المتطورة</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-md mx-auto lg:mx-0 font-medium">
              استمتع بتجربة سحب مفعمة بالألوان مع نظام تقسيم ذكي لكل رقم.
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-6 sm:p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-emerald-500/20 transition-colors" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-400">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Settings2 size={20} />
                  </div>
                  <h2 className="font-bold text-xl text-white">إعدادات السحب</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">الحد الأدنى</label>
                  <div className="relative group/input">
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-emerald-500 transition-colors" size={16} />
                    <input 
                      type="number" 
                      value={min}
                      onChange={(e) => setMin(Number(e.target.value))}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-white font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">الحد الأقصى</label>
                  <div className="relative group/input">
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-emerald-500 transition-colors" size={16} />
                    <input 
                      type="number" 
                      value={max}
                      onChange={(e) => setMax(Number(e.target.value))}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">خلفية مخصصة</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 bg-slate-950/30 border-2 border-dashed border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all rounded-3xl py-6 group/upload"
                >
                  {bgImage ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-400">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/30">
                        <img src={bgImage} className="w-full h-full object-cover" alt="preview" />
                      </div>
                      <span className="text-xs font-bold">تم تحديث الخلفية</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover/upload:text-emerald-400 group-hover/upload:scale-110 transition-all">
                        <Upload size={24} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">اسحب صورة أو اضغط هنا</span>
                    </>
                  )}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              <button 
                onClick={spinWheel}
                disabled={isSpinning}
                className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl ${
                  isSpinning 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 text-white hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95'
                }`}
              >
                <RotateCw className={`${isSpinning ? 'animate-spin' : ''}`} size={28} />
                {isSpinning ? 'جاري السحب...' : 'لف العجلة'}
              </button>
            </div>
          </div>

          {/* History Widget */}
          {history.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-xl"
            >
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <History size={18} />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">آخر السحوبات</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {history.map((num, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center font-mono font-black text-xl text-emerald-400 shadow-lg"
                  >
                    {num}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Center Section: The Wheel (Col 5-12) */}
        <div className="w-full lg:col-span-8 flex flex-col items-center justify-center order-1 lg:order-2 py-8">
          <div className="relative group">
            {/* Premium Needle */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40">
              <div className="relative">
                <div className="w-10 h-14 bg-gradient-to-b from-red-500 to-red-700 shadow-[0_10px_20px_rgba(239,68,68,0.4)]" 
                     style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/20 rounded-full blur-sm" />
              </div>
            </div>

            {/* Decorative Rings */}
            <div className="absolute inset-[-30px] border-[20px] border-white/[0.02] rounded-full z-0" />
            <div className="absolute inset-[-60px] border-[1px] border-white/[0.05] rounded-full z-0 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-[-90px] border-[1px] border-dashed border-white/[0.03] rounded-full z-0 animate-[spin_30s_linear_infinite_reverse]" />

            {/* Glowing Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-blue-500/20 to-purple-500/20 blur-[100px] rounded-full z-0 opacity-50 group-hover:opacity-100 transition-opacity" />

            {/* The Wheel Container */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[320px] h-[320px] sm:w-[520px] sm:h-[520px] rounded-full border-[16px] border-slate-900 shadow-[0_0_100px_rgba(16,185,129,0.3)] overflow-hidden bg-slate-950 z-10 ring-4 ring-white/5"
            >
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={600} 
                className="w-full h-full"
              />
              
              {/* Center Hub */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="w-20 h-20 bg-slate-900 rounded-full border-4 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.6)] flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping shadow-[0_0_10px_white]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResultModal(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              className="relative bg-slate-900 border border-white/20 p-10 sm:p-16 rounded-[4rem] shadow-[0_0_150px_rgba(16,185,129,0.3)] max-w-lg w-full text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 animate-gradient-x" />
              
              <button 
                onClick={() => setShowResultModal(false)}
                className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
              >
                <X size={28} />
              </button>

              <div className="relative z-10 space-y-8">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-[2.5rem] text-emerald-400 mb-2 shadow-2xl border border-white/10"
                >
                  <Trophy size={56} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </motion.div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500 uppercase tracking-[0.4em]">الفائز المحظوظ</h3>
                  <motion.div 
                    initial={{ scale: 0.5, filter: 'blur(10px)' }}
                    animate={{ scale: 1, filter: 'blur(0px)' }}
                    className="text-[10rem] leading-none font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] tabular-nums"
                  >
                    {result}
                  </motion.div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => setShowResultModal(false)}
                    className="w-full py-6 bg-gradient-to-r from-emerald-500 to-blue-600 text-slate-950 font-black text-2xl rounded-3xl hover:from-emerald-400 hover:to-blue-500 transition-all shadow-2xl shadow-emerald-500/30 active:scale-95"
                  >
                    استمرار السحب
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
