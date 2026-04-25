"use client";

import { Check, X } from "lucide-react";

export function CodeCompare({ current, fixed }: { current: string, fixed: string }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Current Code (Bad) */}
      <div className="rounded-xl overflow-hidden border border-red-500/20 bg-[#1E1E1E]">
        <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20 flex items-center gap-2">
          <X className="w-4 h-4 text-red-400" />
          <span className="text-xs font-mono text-red-400">Current Code</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-zinc-300">
            <code>{current}</code>
          </pre>
        </div>
      </div>

      {/* Fixed Code (Good) */}
      <div className="rounded-xl overflow-hidden border border-green-500/20 bg-[#1E1E1E]">
        <div className="bg-green-500/10 px-4 py-2 border-b border-green-500/20 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-xs font-mono text-green-400">Suggested Fix</span>
        </div>
        <div className="p-4 overflow-x-auto relative">
          <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
          <pre className="text-sm font-mono text-zinc-300">
            <code>{fixed}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
