"use client";

import { Sparkles } from "lucide-react";

export function AISuggestionPanel({ suggestions }: { suggestions: string[] }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-[#8B5CF6]/30 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#8B5CF6]/20 transition-all duration-700" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center p-[1px]">
          <div className="w-full h-full bg-brand-slate rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" fill="currentColor" />
          </div>
        </div>
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
          Lumio AI Insights
        </h3>
      </div>

      <div className="space-y-4 relative z-10">
        {suggestions.map((suggestion, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
            <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
