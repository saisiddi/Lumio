"use client";

import Link from "next/link";
import Image from "next/image";
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
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-8 h-8 md:w-9 md:h-9">
            <Image
              src="/logo.png"
              alt="Lumio Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-[0.2em] text-white font-mono uppercase group-hover:text-blue-400 transition-colors">
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
