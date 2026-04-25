"use client"; 

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PuzzleAnalysis } from "@/components/PuzzleAnalysis";
import { scanSteps } from "@/mock/scan";
import { motion } from "framer-motion";

import { useAuth } from "@/components/AuthProvider";

export default function ScanPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const totalDuration = 15000;
    const intervalTime = 50;
    const stepsCount = totalDuration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(100, (currentStep / stepsCount) * 100);
      setProgress(newProgress);

      const newStepIndex = Math.floor((newProgress / 100) * scanSteps.length);
      setStepIndex(Math.min(newStepIndex, scanSteps.length - 1));

      if (newProgress >= 100) {
        clearInterval(timer);
        setTimeout(() => router.push("/report"), 1000);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 space-y-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-2xl mt-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
          Analyzing Domain
        </h1>
        <p className="text-xl text-zinc-400 font-light tracking-wide">
          Our agents are crawling the DOM, simulating screen readers, and finding hidden accessibility issues.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <PuzzleAnalysis progress={progress} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto"
      >
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]" viewBox="0 0 100 100">
            <circle
              className="text-white/5 stroke-current"
              strokeWidth="2"
              cx="50"
              cy="50"
              r="46"
              fill="transparent"
            />
            <motion.circle
              className="text-brand-blue stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="46"
              fill="transparent"
              initial={{ strokeDasharray: "0 289" }}
              animate={{ strokeDasharray: `${(progress / 100) * 289} 289` }}
              transition={{ duration: 0.1 }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-light text-white tracking-tighter">
              {Math.round(progress)}<span className="text-xl text-zinc-500">%</span>
            </span>
          </div>
        </div>

        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-brand-blue font-mono text-sm uppercase tracking-[0.2em] text-glow-blue h-6"
        >
          {scanSteps[stepIndex]}
        </motion.div>
      </motion.div>
    </div>
  );
}

