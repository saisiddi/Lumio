"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence
} from "framer-motion";
import { URLAnalyzerInput } from "./URLAnalyzerInput";
import { LiquidRevealFlow } from "./LiquidReveal";
import { PuzzleAnalysis } from "./PuzzleAnalysis";
import { CheckCircle, Activity, FileText, Code, GitPullRequest } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShatterDisabled, setIsShatterDisabled] = useState(false);
  const [isSearchInteractive, setIsSearchInteractive] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportData, setReportData] = useState<any>(null);

  const handleScan = async (url: string) => {
    setIsScanning(true);
    setScanComplete(false);
    setProgress(0);
    setReportData(null);
    
    let currentStep = 0;
    const progressTimer = setInterval(() => {
      currentStep++;
      setProgress(Math.min(90, currentStep * 4)); // Progresses up to 90%
    }, 100);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      
      clearInterval(progressTimer);
      setProgress(100);
      setReportData(data.data);

      setTimeout(() => {
         setIsScanning(false);
         setScanComplete(true);
      }, 800);
    } catch (e) {
      clearInterval(progressTimer);
      setIsScanning(false);
      console.error(e);
    }
  };
  const proofBadges = [
    "Detects contrast, ARIA, keyboard traps, semantic issues",
    "Prioritized by criticality and user impact",
    "AI-ready fix snippets with implementation guidance",
  ];
  const flowSteps = [
    { label: "1. URL", value: "lumio.dev" },
    { label: "2. Scan", value: "DOM + WCAG pass" },
    { label: "3. Score", value: "74 -> 93" },
    { label: "4. Fix", value: "12 suggestions generated" },
    { label: "5. Verify", value: "Re-scan and export report" },
  ];
  const metrics = [
    { label: "Avg scan", value: "8s" },
    { label: "Critical detection", value: "95%+" },
    { label: "Fix suggestions", value: "1-click" },
  ];
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

    if (latest > 0.82 && !isSearchInteractive) {
      setIsSearchInteractive(true);
    } else if (latest <= 0.82 && isSearchInteractive) {
      setIsSearchInteractive(false);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("hero-white-active");
    };
  }, []);

  // Background scrolling text parallax
  const xTextLeft = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"], {
    clamp: true,
  });
  const xTextRight = useTransform(scrollYProgress, [0, 1], ["0%", "50%"], {
    clamp: true,
  });
  const opacityBgText = useTransform(scrollYProgress, [0.3, 0.5], [1, 0], {
    clamp: true,
  });

  // 1. Centerpiece shrinking and flying out
  const scaleCenterpiece = useTransform(scrollYProgress, [0, 0.25], [1, 0.6], {
    clamp: true,
  });
  const opacityCenterpiece = useTransform(
    scrollYProgress,
    [0.15, 0.35],
    [1, 0],
    { clamp: true },
  );
  const yCenterpiece = useTransform(scrollYProgress, [0.15, 0.35], [0, -1000], {
    clamp: true,
  });

  // 2. LUMIO text fades in and slides up from bottom as centerpiece leaves, then zooms into the M
  const scaleLumio = useTransform(scrollYProgress, [0.35, 0.7], [1, 30], {
    clamp: true,
  });
  const opacityLumio = useTransform(
    scrollYProgress,
    [0.15, 0.35, 0.6, 0.75],
    [0, 1, 1, 0],
    { clamp: true },
  );
  const yLumio = useTransform(scrollYProgress, [0.15, 0.35], [300, 0], {
    clamp: true,
  });

  // 3. White background takes over everything
  const opacityWhiteBg = useTransform(scrollYProgress, [0.55, 0.75], [0, 1], {
    clamp: true,
  });

  // 4. Search Box appears on the white page
  const ySearch = useTransform(scrollYProgress, [0.75, 1], [150, 0], {
    clamp: true,
  });
  const opacitySearch = useTransform(scrollYProgress, [0.75, 1], [0, 1], {
    clamp: true,
  });

  return (
    <section
      ref={containerRef}
      style={{ position: "relative", height: "200vh" }}
    >
      {/* === Dark background + parallax text === */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-brand-midnight" />
        <motion.div
          style={{ opacity: opacityBgText }}
          className="absolute inset-0 flex flex-col justify-center overflow-hidden select-none"
        >
          <motion.div style={{ x: xTextLeft }} className="whitespace-nowrap">
            <h1 className="text-[14vw] font-black uppercase text-stroke-white opacity-15 tracking-tight leading-none">
              PRECISION AUDITS • HUMAN-FIRST WEB • PRECISION AUDITS •
            </h1>
          </motion.div>
          <motion.div
            style={{ x: xTextRight }}
            className="whitespace-nowrap -ml-[20vw]"
          >
            <h1 className="text-[14vw] font-black uppercase text-stroke-electric opacity-20 tracking-tight leading-none">
              LUMIO STUDIO • LUMIO STUDIO • LUMIO STUDIO
            </h1>
          </motion.div>
          <motion.div
            style={{ x: xTextLeft }}
            className="whitespace-nowrap mt-4"
          >
            <h1 className="text-[14vw] font-black uppercase text-stroke-white opacity-15 tracking-tight leading-none">
              READABLE. RELIABLE. REMARKABLE. •
            </h1>
          </motion.div>
        </motion.div>
      </div>

      {/* === Centerpiece (travel image) === */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center pt-32 px-6"
        style={{
          scale: scaleCenterpiece,
          opacity: opacityCenterpiece,
          y: yCenterpiece,
          zIndex: 2,
        }}
      >
        <LiquidRevealFlow disableHover={isShatterDisabled} />
      </motion.div>

      {/* === LUMIO Text zoom === */}
      <div
        className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ zIndex: 3 }}
      >
        <motion.h1
          style={{ scale: scaleLumio, opacity: opacityLumio, y: yLumio }}
          className="text-5xl md:text-7xl lg:text-[7rem] font-black uppercase text-white tracking-[-0.04em] leading-[0.85] origin-center drop-shadow-[0_20px_32px_rgba(2,8,21,0.45)]"
        >
          LUMIO
        </motion.h1>
      </div>

      {/* === WHITE OVERLAY — uses zIndex: 90 to cover EVERYTHING including navbar (z-50) === */}
      <motion.div
        style={{ opacity: opacityWhiteBg, zIndex: 90 }}
        className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_15%,rgba(47,114,235,0.1)_0%,transparent_40%),radial-gradient(circle_at_82%_12%,rgba(54,167,196,0.1)_0%,transparent_38%),linear-gradient(180deg,#f7faff_0%,#eaf1fb_100%)]"
      />

      {/* === Search box + cards — on top of white at zIndex: 100 === */}
      <div
        className="fixed inset-0 flex items-center justify-center px-6 pointer-events-none"
        style={{ zIndex: 100 }}
      >
        <motion.div
          style={{ y: ySearch, opacity: opacitySearch }}
          className={`w-full max-w-5xl space-y-8 ${isSearchInteractive ? "pointer-events-auto" : "pointer-events-none"} ${scanComplete ? 'max-h-screen overflow-y-auto pb-20 pt-10 scrollbar-hide' : ''}`}
        >
          <div className="space-y-4 text-center max-w-3xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-brand-electric/80">
              AI Accessibility Intelligence
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-slate-900 leading-[0.95]">
              Ship Accessibility Fixes in Minutes, Not Sprints
            </h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              Scan any URL, uncover critical blockers, and get prioritized
              AI-generated remediation you can ship immediately.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <URLAnalyzerInput onScan={handleScan} />
            <p className="text-center text-xs text-slate-500 tracking-wide">
              Try: nike.com | stripe.com | airbnb.com
            </p>
          </div>

          <div className="w-full pt-4">
            <AnimatePresence mode="wait">
              {!isScanning && !scanComplete && (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {proofBadges.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + index * 0.08, duration: 0.45 }}
                      className="rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-xs md:text-sm text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                    >
                      {item}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {isScanning && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="w-full flex justify-center"
                >
                  <PuzzleAnalysis progress={progress} />
                </motion.div>
              )}

              {scanComplete && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-5xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 pointer-events-auto text-left"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-slate-100 pb-6 gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Accessibility Scan Complete</h2>
                      <p className="text-slate-600 text-sm md:text-base max-w-2xl">
                        AI doesn't just score your site — it finds every WCAG violation, explains in plain English why it's broken, and generates the exact code fix for that specific element. Not generic advice.
                      </p>
                    </div>
                    <button className="whitespace-nowrap px-4 py-2 flex items-center gap-2 bg-brand-midnight hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-md">
                      <FileText className="w-4 h-4" /> Export PDF Report
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <Code className="w-5 h-5 text-brand-electric" /> Developer-ready fixes
                      </h3>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{reportData?.issues?.[0]?.severity || "Critical"} Issue</span>
                          <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{reportData?.issues?.[0]?.wcagRule?.split(" - ")[0] || "WCAG 4.1.2"}</span>
                        </div>
                        <p className="text-slate-800 font-medium mb-2 leading-relaxed">
                          "Line {reportData?.issues?.[0]?.lineNumber || "47"} of your homepage — {reportData?.issues?.[0]?.title || "this button has no ARIA label"}. Here's the fixed HTML."
                        </p>
                        
                        <div className="bg-[#0D1117] rounded-lg p-4 mt-4 overflow-x-auto relative group">
                          <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-medium transition-colors">
                              Copy Patch
                            </button>
                            <button className="px-3 py-1.5 bg-brand-electric hover:bg-brand-blue text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5">
                              <GitPullRequest className="w-3.5 h-3.5" /> Open PR
                            </button>
                          </div>
                          <pre className="text-[13px] text-slate-300 font-mono mt-2 leading-relaxed whitespace-pre-wrap">
                            <code>
<span className="text-red-400">- {reportData?.issues?.[0]?.codeSnippet?.current || `<button class="cart-btn" onClick={add}></button>`}</span>
<br/>
<span className="text-emerald-400">+ {reportData?.issues?.[0]?.codeSnippet?.fixed || `<button class="cart-btn" aria-label="Add item to cart" onClick={add}></button>`}</span>
                            </code>
                          </pre>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{reportData?.issues?.[0]?.file || "components/cart.tsx"}:{reportData?.issues?.[0]?.lineNumber || "47"}</span>
                          <span>File + line mapping for local repos</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 italic border-l-2 border-brand-electric pl-3 py-1 bg-slate-50 rounded-r-md">
                        This is the real pain point: people don't need more scores, they need faster fixes.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" /> Proof and prioritization
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                          <li className="flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 shrink-0" /> Show impact, affected users, severity, WCAG rule, and business priority</li>
                          <li className="flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 shrink-0" /> Group duplicate issues across pages</li>
                          <li className="flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 shrink-0" /> Tell teams what to fix first</li>
                        </ul>
                        <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                          Most accessibility tools overwhelm teams. Prioritization is a huge differentiator.
                        </p>
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-brand-electric" /> Continuous monitoring
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                          <li className="flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 shrink-0" /> Scan staging/production automatically</li>
                          <li className="flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 shrink-0" /> Compare before/after</li>
                          <li className="flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 shrink-0" /> Alert only on new regressions</li>
                          <li className="flex items-start"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 shrink-0" /> Keep an accessibility changelog</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
