"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { URLAnalyzerInput } from "./URLAnalyzerInput";
import { LiquidRevealFlow } from "./LiquidReveal";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShatterDisabled, setIsShatterDisabled] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.25 && !isShatterDisabled) {
      setIsShatterDisabled(true);
    } else if (latest <= 0.25 && isShatterDisabled) {
      setIsShatterDisabled(false);
    }
  });

  // Background scrolling text parallax
  const xTextLeft = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const xTextRight = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  // Centerpiece shrinking and text fading on scroll
  const scaleCenterpiece = useTransform(scrollYProgress, [0, 0.4], [1, 0.6]);
  const opacityText = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Search Box fly-in on scroll (happens AFTER text fades)
  const ySearch = useTransform(scrollYProgress, [0.3, 0.6], [200, 0]);
  const opacitySearch = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);

  return (
    <section ref={containerRef} className="relative h-[250vh] bg-brand-black">
      
      {/* MASSIVE SCROLLING BACKGROUND TEXT */}
      <div className="fixed inset-0 pointer-events-none flex flex-col justify-center overflow-hidden z-0 select-none">
        <motion.div style={{ x: xTextLeft }} className="whitespace-nowrap">
          <h1 className="text-[15vw] font-black uppercase text-stroke-white opacity-20 tracking-tighter leading-none">
            ACCESSIBILITY AUDITOR • ACCESSIBILITY AUDITOR • ACCESSIBILITY AUDITOR
          </h1>
        </motion.div>
        <motion.div style={{ x: xTextRight }} className="whitespace-nowrap -ml-[20vw]">
          <h1 className="text-[15vw] font-black uppercase text-stroke-neon opacity-20 tracking-tighter leading-none">
            LUMION ENGINE • LUMION ENGINE • LUMION ENGINE
          </h1>
        </motion.div>
        <motion.div style={{ x: xTextLeft }} className="whitespace-nowrap mt-4">
          <h1 className="text-[15vw] font-black uppercase text-stroke-white opacity-20 tracking-tighter leading-none">
            ZERO COMPROMISE • ZERO COMPROMISE • ZERO COMPROMISE
          </h1>
        </motion.div>
      </div>

      {/* FIXED CONTAINER FOR HERO CONTENT */}
      <div className="fixed top-0 left-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden z-10 pt-20 pointer-events-none">
        
        {/* The Interactive Liquid Flow Reveal Centerpiece */}
        <motion.div 
          style={{ scale: scaleCenterpiece }}
          className="absolute inset-0 flex items-center justify-center pt-32 px-6 pointer-events-auto"
        >
          <LiquidRevealFlow disableHover={isShatterDisabled} />
        </motion.div>

        {/* Center Content: Typography & Input */}
        <div className="relative z-40 flex flex-col items-center w-full px-6 pointer-events-none">
          <motion.div
            style={{ opacity: opacityText }}
            className="text-center flex flex-col items-center pointer-events-none"
          >
            <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black uppercase text-white tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl mix-blend-difference">
              Reveal What <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon to-brand-blue text-glow-neon mix-blend-normal">
                Beautiful Websites Hide
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-300 font-medium tracking-wide max-w-2xl drop-shadow-lg mix-blend-difference">
              AI-powered accessibility intelligence that uncovers hidden issues and generates instant fixes.
            </p>
          </motion.div>
          
          <motion.div 
            style={{ y: ySearch, opacity: opacitySearch }}
            className="absolute top-1/2 -translate-y-1/2 w-full max-w-2xl pointer-events-auto space-y-12"
          >
            <URLAnalyzerInput />

            {/* Recent Analyses Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="w-full space-y-6 pt-12"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold tracking-[0.2em] text-white/50 uppercase">Recent Analyses</h3>
                <div className="h-[1px] flex-1 mx-6 bg-white/10" />
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
                    className="group relative glass-card p-5 rounded-2xl border border-white/5 hover:border-brand-neon/40 hover:shadow-[0_10px_30px_rgba(217,255,0,0.1)] transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-neon/0 via-brand-neon/5 to-brand-neon/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white font-bold tracking-tight">{item.domain}</span>
                        <span className="text-xs text-zinc-500">{item.date}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-brand-neon font-mono font-bold text-xl">{item.score}</span>
                        <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Score</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

