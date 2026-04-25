"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { URLAnalyzerInput } from "./URLAnalyzerInput";
import { LiquidRevealFlow } from "./LiquidReveal";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShatterDisabled, setIsShatterDisabled] = useState(false);
  const [isSearchInteractive, setIsSearchInteractive] = useState(false);
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
          className={`w-full max-w-5xl space-y-8 ${isSearchInteractive ? "pointer-events-auto" : "pointer-events-none"}`}
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
            <URLAnalyzerInput />
            <p className="text-center text-xs text-slate-500 tracking-wide">
              Try: nike.com | stripe.com | airbnb.com
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full pt-4 grid grid-cols-1 lg:grid-cols-5 gap-5"
          >
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Live Scan Story
                </h3>
                <span className="text-[11px] text-brand-electric font-semibold">
                  Real-time pipeline
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                {flowSteps.map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.45 }}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                      {step.label}
                    </p>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {step.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.12)] space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                Before vs After
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-red-100 bg-red-50/70 p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-red-600">
                    Before
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>Missing aria-label on search input</li>
                    <li>Contrast ratio below WCAG AA</li>
                    <li>Invisible keyboard focus outline</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-emerald-600">
                    After
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>Accessible label and roles applied</li>
                    <li>Contrast elevated to AA-compliant</li>
                    <li>Keyboard focus styles restored</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-2 text-center"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {metric.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
