"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Code2, Cpu, Globe, Search, Shield, Zap, 
  Activity, Database, Layout, Layers,
  Terminal, Share2, GitBranch, Settings
} from "lucide-react";

const GRID_SIZE = 5;
const ICONS = [
  Code2, Cpu, Globe, Search, Shield, Zap, 
  Activity, Database, Layout, Layers,
  Terminal, Share2, GitBranch, Settings
];

const TECH_TERMS = [
  "DOM", "ARIA", "WCAG", "NODE", "TREE", "ALT", "CONTRAST", "FOCUS", 
  "ROLE", "STATE", "FLOW", "GRID", "HINT", "LABEL", "TAB", "WAI",
  "A11Y", "SCROLL", "MODAL", "INPUT", "FORM", "BUTTON", "LINK", "IMG"
];

export function PuzzleAnalysis({ progress }: { progress: number }) {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    const indices = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const newPieces = Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => ({
      id: i,
      solveOrder: indices[i],
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 500,
      rotate: (Math.random() - 0.5) * 180,
      label: TECH_TERMS[Math.floor(Math.random() * TECH_TERMS.length)],
      Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
      hasTree: Math.random() > 0.7,
      color: Math.random() > 0.5 ? "#00E5FF" : "#8B5CF6",
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className={`relative w-full max-w-4xl aspect-video mx-auto bg-brand-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border transition-all duration-1000 flex items-center justify-center ${progress === 100 ? "border-brand-neon/50 shadow-[0_0_80px_rgba(217,255,0,0.1)]" : "border-white/5"}`}>
      
      {/* Dynamic Circuitry Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full stroke-white/5 fill-none" viewBox="0 0 800 450">
          <path d="M0,225 L800,225 M400,0 L400,450 M200,0 L200,450 M600,0 L600,450" strokeWidth="0.5" />
          <circle cx="400" cy="225" r="100" strokeWidth="0.5" />
          <circle cx="400" cy="225" r="200" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="relative grid gap-2 p-6 w-[90%] h-[90%]" style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      }}>
        {pieces.map((piece) => {
          const isSolved = (piece.solveOrder / (GRID_SIZE * GRID_SIZE)) * 100 < progress;
          const { Icon } = piece;

          return (
            <motion.div
              key={piece.id}
              initial={{ 
                x: piece.x, 
                y: piece.y, 
                rotate: piece.rotate,
                opacity: 0,
                scale: 0.3
              }}
              animate={{ 
                x: isSolved ? 0 : piece.x, 
                y: isSolved ? 0 : piece.y, 
                rotate: isSolved ? 0 : piece.rotate,
                opacity: 1,
                scale: isSolved ? 1 : 0.6,
                borderColor: isSolved ? piece.color + "60" : "rgba(255, 255, 255, 0.05)",
                backgroundColor: isSolved ? piece.color + "15" : "rgba(255, 255, 255, 0.02)"
              }}
              transition={{ 
                type: "spring", 
                stiffness: 120, 
                damping: 25,
                mass: 0.8
              }}
              className="relative rounded-xl border flex flex-col items-center justify-center overflow-hidden group glass-card shadow-2xl"
            >
              {isSolved && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5] }}
                  className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                />
              )}
              
              <div className="relative z-10 flex flex-col items-center gap-1">
                {piece.hasTree && isSolved ? (
                  <div className="w-8 h-8 flex items-center justify-center opacity-40">
                    <svg className="w-full h-full stroke-current text-white/50" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4L12 8 M12 8L6 14 M12 8L18 14 M6 14L4 18 M6 14L8 18 M18 14L16 18 M18 14L20 18" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 transition-colors duration-500 ${isSolved ? "text-white" : "text-white/10"}`} />
                )}
                
                <span className={`text-[8px] font-mono font-black tracking-[0.2em] uppercase transition-colors duration-500 ${isSolved ? "text-white" : "text-white/5"}`}>
                  {piece.label}
                </span>
              </div>

              {/* Decorative Corner */}
              <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-white/10" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-white/10" />
            </motion.div>
          );
        })}
      </div>

      {/* Progress Info Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="text-brand-neon font-mono text-sm tracking-widest uppercase font-bold">
          Assembling Intelligence Matrix: {Math.round(progress)}%
        </div>
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-brand-neon"
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
