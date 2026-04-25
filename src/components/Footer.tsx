"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  
  if (pathname === "/") return null;

  return (
    <footer className="border-t border-white/5 bg-brand-graphite py-12 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Activity className="w-5 h-5 text-brand-electric" />
          <span className="text-xl font-bold tracking-wider text-white">
            LUMIO
          </span>
        </div>
        
        <div className="flex gap-6 text-sm text-zinc-400">
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
        </div>
        
        <div className="text-sm text-zinc-500 mt-4 md:mt-0">
          &copy; {new Date().getFullYear()} Lumio. Built for the hackathon.
        </div>
      </div>
    </footer>
  );
}
