"use client";

import { motion } from "framer-motion";
import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-midnight flex">
      {/* Left Premium Graphic Panel */}
      <div className="hidden lg:flex w-1/2 relative bg-[#020617] overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-electric/10 via-brand-graphite to-[#020617]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 glass-card p-12 rounded-3xl max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.1)] border border-brand-electric/20"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-electric to-brand-violet flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <span className="text-3xl font-bold text-white tracking-tighter">L</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight leading-[1.2]">
            Ensure compliance.<br/>Ship with confidence.
          </h2>
          <p className="text-zinc-400 leading-relaxed font-light">
            Join the world's most innovative teams using Lumio to automate accessibility audits directly into their CI/CD pipeline.
          </p>
          <div className="mt-10 flex gap-4">
            <div className="flex-1 border border-white/10 rounded-xl p-4 bg-white/[0.02]">
              <div className="text-2xl font-bold text-brand-electric mb-1">99%</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">WCAG Coverage</div>
            </div>
            <div className="flex-1 border border-white/10 rounded-xl p-4 bg-white/[0.02]">
              <div className="text-2xl font-bold text-brand-violet mb-1">&lt;2s</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Scan Speed</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-8 left-8 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-zinc-400 font-light">Enter your credentials to access your dashboard.</p>
          </div>

          <AuthForm type="login" />

          <p className="text-center text-sm text-zinc-500 mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-white hover:text-brand-electric transition-colors font-medium">
              Create one now
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
