"use client";

import { useAuth } from "@/components/AuthProvider";
import { HeroSection } from "@/components/HeroSection";
import { AuthForm } from "@/components/AuthForm";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { isLoggedIn, login } = useAuth();

  if (isLoggedIn) {
    // Render HeroSection directly — no wrapper divs that create stacking contexts
    return <HeroSection />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-midnight">
      <AnimatePresence mode="wait">
        <motion.div 
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex items-center justify-center px-6 py-20 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_100%)]"
        >
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Authentication Required</h2>
              <p className="text-zinc-400 text-sm">Sign in to access the Lumio Accessibility Engine</p>
            </div>
            <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl">
              <AuthForm type="login" onSuccess={login} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
