"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export function Navbar() {
  const pathname = usePathname();

  const { isLoggedIn, logout } = useAuth();
  
  const links = [
    { name: "Home", path: "/" },
  ];

  if (!isLoggedIn) {
    links.push({ name: "Login", path: "/" });
  }

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-[110] glass border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); window.location.reload(); }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 group-hover:box-glow-blue transition-all duration-500">
            <Activity className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <span className="text-xl font-bold tracking-wider text-white">
            LUMIO
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#00E5FF]",
                pathname === link.path ? "text-[#00E5FF] text-glow-blue" : "text-zinc-400"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          {isLoggedIn && (
            <button 
              onClick={logout}
              className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
