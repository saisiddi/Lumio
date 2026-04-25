"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { URLAnalyzerInput } from "./URLAnalyzerInput";
import { LiquidRevealFlow } from "./LiquidReveal";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShatterDisabled, setIsShatterDisabled] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Track scroll state for body-level side effects
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.25 && !isShatterDisabled) {
      setIsShatterDisabled(true);
    } else if (latest <= 0.25 && isShatterDisabled) {
      setIsShatterDisabled(false);
    }

    // Toggle body class to hide the body::after overlay and navbar
    if (latest > 0.6) {
      document.body.classList.add("hero-white-active");
    } else {
      document.body.classList.remove("hero-white-active");
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("hero-white-active");
    };
  }, []);

  // Background scrolling text parallax
  const xTextLeft = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"], { clamp: true });
  const xTextRight = useTransform(scrollYProgress, [0, 1], ["0%", "50%"], { clamp: true });
  const opacityBgText = useTransform(scrollYProgress, [0.3, 0.5], [1, 0], { clamp: true });
  
  // 1. Centerpiece shrinking and flying out
  const scaleCenterpiece = useTransform(scrollYProgress, [0, 0.25], [1, 0.6], { clamp: true });
  const opacityCenterpiece = useTransform(scrollYProgress, [0.15, 0.35], [1, 0], { clamp: true });
  const yCenterpiece = useTransform(scrollYProgress, [0.15, 0.35], [0, -1000], { clamp: true });

  // 2. LUMIO text fades in and slides up from bottom as centerpiece leaves, then zooms into the M
  const scaleLumio = useTransform(scrollYProgress, [0.35, 0.7], [1, 30], { clamp: true });
  const opacityLumio = useTransform(scrollYProgress, [0.15, 0.35, 0.6, 0.75], [0, 1, 1, 0], { clamp: true });
  const yLumio = useTransform(scrollYProgress, [0.15, 0.35], [300, 0], { clamp: true });

  // 3. White background takes over everything
  const opacityWhiteBg = useTransform(scrollYProgress, [0.55, 0.75], [0, 1], { clamp: true });

  // 4. Search Box appears on the white page
  const ySearch = useTransform(scrollYProgress, [0.75, 1], [150, 0], { clamp: true });
  const opacitySearch = useTransform(scrollYProgress, [0.75, 1], [0, 1], { clamp: true });

  return (
    <section ref={containerRef} style={{ position: 'relative', height: '200vh' }}>

      {/* === Dark background + parallax text === */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-brand-midnight" />
        <motion.div
          style={{ opacity: opacityBgText }}
          className="absolute inset-0 flex flex-col justify-center overflow-hidden select-none"
        >
          <motion.div style={{ x: xTextLeft }} className="whitespace-nowrap">
            <h1 className="text-[15vw] font-black uppercase text-stroke-white opacity-20 tracking-tighter leading-none">
              ACCESSIBILITY AUDITOR • ACCESSIBILITY AUDITOR • ACCESSIBILITY AUDITOR
            </h1>
          </motion.div>
          <motion.div style={{ x: xTextRight }} className="whitespace-nowrap -ml-[20vw]">
            <h1 className="text-[15vw] font-black uppercase text-stroke-electric opacity-20 tracking-tighter leading-none">
              LUMIO ENGINE • LUMIO ENGINE • LUMIO ENGINE
            </h1>
          </motion.div>
          <motion.div style={{ x: xTextLeft }} className="whitespace-nowrap mt-4">
            <h1 className="text-[15vw] font-black uppercase text-stroke-white opacity-20 tracking-tighter leading-none">
              ZERO COMPROMISE • ZERO COMPROMISE • ZERO COMPROMISE
            </h1>
          </motion.div>
        </motion.div>
      </div>

      {/* === Centerpiece (travel image) === */}
      <motion.div 
        className="fixed inset-0 flex items-center justify-center pt-32 px-6"
        style={{ scale: scaleCenterpiece, opacity: opacityCenterpiece, y: yCenterpiece, zIndex: 2 }}
      >
        <LiquidRevealFlow disableHover={isShatterDisabled} />
      </motion.div>

      {/* === LUMIO Text zoom === */}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none" style={{ zIndex: 3 }}>
        <motion.h1 
          style={{ scale: scaleLumio, opacity: opacityLumio, y: yLumio }}
          className="text-5xl md:text-7xl lg:text-[7rem] font-black uppercase text-white tracking-tighter leading-[0.85] origin-center"
        >
          LUMIO
        </motion.h1>
      </div>

      {/* === WHITE OVERLAY — uses zIndex: 90 to cover EVERYTHING including navbar (z-50) === */}
      <motion.div 
        style={{ opacity: opacityWhiteBg, zIndex: 90 }}
        className="fixed inset-0 bg-white pointer-events-none"
      />

      {/* === Search box + cards — on top of white at zIndex: 100 === */}
      <div className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none" style={{ zIndex: 100 }}>
        <motion.div 
          style={{ y: ySearch, opacity: opacitySearch }}
          className="w-full max-w-2xl pointer-events-auto space-y-12"
        >
          <URLAnalyzerInput />

          {/* Recent Analyses Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="w-full space-y-6 pt-12"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold tracking-[0.2em] text-brand-midnight/60 uppercase">Recent Analyses</h3>
              <div className="h-[1px] flex-1 mx-6 bg-brand-midnight/10" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { domain: "apple.com", score: 94, date: "2 mins ago" },
                { domain: "stripe.com", score: 88, date: "1 hour ago" },
                { domain: "nike.com", score: 72, date: "Yesterday" },
                { domain: "airbnb.com", score: 91, date: "2 days ago" },
              ].map((item, i) => (
                <motion.div
                  key={item.domain}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5, y: -2 }}
                  className="group relative bg-brand-midnight border border-brand-electric/20 hover:border-brand-electric/50 shadow-2xl p-5 rounded-2xl transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-electric/0 via-brand-electric/5 to-brand-electric/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white font-bold tracking-tight">{item.domain}</span>
                      <span className="text-xs text-zinc-500">{item.date}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-brand-electric font-mono font-bold text-xl">{item.score}</span>
                      <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Score</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
