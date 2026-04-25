"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function URLAnalyzerInput({ className }: { className?: string }) {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      router.push(`/scan?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={cn("w-full max-w-2xl mx-auto", className)}
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-brand-electric rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-brand-midnight/90 border border-brand-electric/30 rounded-2xl p-2 pl-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <Search className="w-6 h-6 text-brand-electric/70 mr-4" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-zinc-600 focus:ring-0"
            required
          />
          <button
            type="submit"
            className="ml-4 px-8 py-4 bg-brand-electric text-white rounded-xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-brand-violet transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95"
          >
            Analyze <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
