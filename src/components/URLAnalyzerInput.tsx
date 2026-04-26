"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function URLAnalyzerInput({ className, onScan }: { className?: string, onScan?: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      if (onScan) {
        onScan(url);
      } else {
        router.push(`/scan?url=${encodeURIComponent(url)}`);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={cn("w-full max-w-2xl mx-auto", className)}
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-electric/40 via-brand-blue/30 to-brand-violet/35 blur-md opacity-30 group-hover:opacity-60 transition duration-500" />
        <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-white/92 p-2 pl-6 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl">
          <Search className="w-6 h-6 text-brand-electric mr-4" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 text-lg placeholder:text-slate-400 focus:ring-0"
            required
          />
          <button
            type="submit"
            className="ml-4 px-8 py-4 rounded-xl font-black uppercase tracking-[0.14em] text-white flex items-center gap-3 bg-gradient-to-r from-brand-electric to-[#2f6cd8] hover:from-[#2f6cd8] hover:to-brand-electric transition-all duration-300 shadow-[0_12px_24px_rgba(59,130,246,0.35)] hover:shadow-[0_16px_30px_rgba(59,130,246,0.42)] hover:-translate-y-[1px] active:translate-y-0"
          >
            Scan URL <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
