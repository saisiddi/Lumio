"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { URLAnalyzerInput } from "./URLAnalyzerInput";
import { LiquidRevealFlow } from "./LiquidReveal";
import { PuzzleAnalysis } from "./PuzzleAnalysis";
import { ParticleNetwork } from "./ParticleNetwork";
import { ScanCharts } from "./ScanCharts";
import { generateAccessibilityPDF } from "@/lib/generatePDF";
import {
  CheckCircle,
  Activity,
  FileText,
  Code,
  GitPullRequest,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Clipboard,
  Check,
  AlertTriangle,
  Wrench,
  Home,
  RefreshCw,
  ArrowUp,
  Shield,
  Zap,
  Cpu,
} from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShatterDisabled, setIsShatterDisabled] = useState(false);
  const [isSearchInteractive, setIsSearchInteractive] = useState(false);
  const [particleColorProgress, setParticleColorProgress] = useState(0);

  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportData, setReportData] = useState<any>(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set([0]));
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const handleRescan = () => {
    setScanComplete(false);
    setIsScanning(false);
    setProgress(0);
    setReportData(null);
    setScannedUrl("");
    setScanError(null);
  };

  const scrollToTop = () => {
    resultsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleIssue = (idx: number) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getDifficulty = (issue: any) => {
    if (issue.severity === "minor") return { label: "Easy fix", time: "~1 min", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (issue.severity === "moderate") return { label: "Medium fix", time: "~5 min", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { label: "Important fix", time: "~10 min", color: "text-red-600 bg-red-50 border-red-200" };
  };

  const handleScan = async (url: string, maxPages: number = 1) => {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return;

    setIsScanning(true);
    setScanComplete(false);
    setProgress(0);
    setReportData(null);
    setScanError(null);
    setScannedUrl(normalizedUrl);

    // Auto-scroll to the bottom of the hero section so the white overlay
    // and scanning animation are fully visible.
    if (containerRef.current) {
      const sectionBottom = containerRef.current.offsetTop + containerRef.current.offsetHeight;
      window.scrollTo({ top: sectionBottom, behavior: "smooth" });
    }

    let currentProgress = 0;
    const progressTimer = setInterval(() => {
      // Asymptotic curve: each tick adds 5% of the remaining distance to 90.
      // This gives fast initial progress that naturally decelerates,
      // reaching ~50% at ~14s, ~75% at ~28s, ~85% at ~40s, ~89% at ~60s.
      currentProgress += (90 - currentProgress) * 0.05;
      setProgress(Math.round(currentProgress));
    }, 1000);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl, max_pages: maxPages }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      if (!res.ok) {
        throw new Error((data && data.error) || "Scan request failed");
      }

      if (!data?.success || !data?.data) {
        throw new Error((data && data.error) || "Invalid scan response");
      }

      clearInterval(progressTimer);
      setProgress(100);
      setScannedUrl(data.data.url || normalizedUrl);
      console.log("[Frontend] Scan response data:", JSON.stringify(data.data, null, 2));
      setReportData(data.data);

      setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
      }, 800);
    } catch (e: any) {
      clearInterval(progressTimer);
      setIsScanning(false);
      setScanError(e.message || "Scan failed. Please check the URL and try again.");
      console.error(e);
    }
  };
  const proofBadges = [
    { text: "Comprehensive WCAG, ARIA & Semantic audits", icon: Shield, color: "text-blue-500" },
    { text: "Prioritized criticality & user impact scoring", icon: Zap, color: "text-amber-500" },
    { text: "AI-powered remediation with code-ready fixes", icon: Cpu, color: "text-purple-500" },
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

    // Particle color: white→black as background goes white
    const pColor = Math.min(1, Math.max(0, (latest - 0.55) / 0.2));
    setParticleColorProgress(pColor);

    if (latest > 0.82 && !isSearchInteractive) {
      setIsSearchInteractive(true);
    } else if (latest <= 0.82 && isSearchInteractive) {
      setIsSearchInteractive(false);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    // Ensure reload/navigation starts at the opening hero frame instead of a
    // restored mid-scroll state where animated layers can be fully transparent.
    window.scrollTo({ top: 0, behavior: "auto" });

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
          zIndex: 95,
        }}
      >
        <LiquidRevealFlow disableHover={isShatterDisabled} />
      </motion.div>

      {/* === LUMIO Text zoom === */}
      <div
        className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ zIndex: 96 }}
      >
        <motion.h1
          style={{ scale: scaleLumio, opacity: opacityLumio, y: yLumio }}
          className="text-5xl md:text-7xl lg:text-[7rem] font-black uppercase text-white tracking-[-0.04em] leading-[0.85] origin-center drop-shadow-[0_20px_32px_rgba(2,8,21,0.45)]"
        >
          LUMIO
        </motion.h1>
      </div>

      {/* === WHITE OVERLAY === */}
      <motion.div
        style={{ opacity: opacityWhiteBg, zIndex: 90 }}
        className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_15%,rgba(47,114,235,0.1)_0%,transparent_40%),radial-gradient(circle_at_82%_12%,rgba(54,167,196,0.1)_0%,transparent_38%),linear-gradient(180deg,#f7faff_0%,#eaf1fb_100%)]"
      />

      {/* === Particle Network — now always visible but interactive logic moved to prop === */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 91 }}>
        <ParticleNetwork 
          colorProgress={particleColorProgress} 
          disableMouseInteraction={isScanning || scanComplete}
        />
      </div>

      {/* === Search box + cards === */}
      <div
        className="fixed inset-0 flex items-start justify-center px-4 md:px-8 pt-8 pointer-events-none"
        style={{ zIndex: 100 }}
      >
        <motion.div
          ref={resultsContainerRef}
          style={{ y: ySearch, opacity: opacitySearch }}
          data-lenis-prevent
          className={`w-full max-w-7xl space-y-8 ${isSearchInteractive ? "pointer-events-auto" : "pointer-events-none"} ${isScanning || scanComplete ? "max-h-[96vh] overflow-y-auto pb-16 pt-4 pr-1 scrollbar-hide" : "flex flex-col items-center justify-center min-h-[80vh]"}`}
        >
          {/* Header card — hidden during scanning/results to avoid overlapping the puzzle */}
          {!isScanning && !scanComplete && (
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-slate-200/60">
              {/* Home button */}
              <div className="flex justify-start mb-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-electric transition-colors group"
                >
                  <Home className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Home
                </button>
              </div>
              <div className="space-y-4 text-center max-w-3xl mx-auto">
                <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-brand-electric">
                  AI Accessibility Intelligence
                </p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-slate-900 leading-[0.95]">
                  Paste a URL.
                </h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
                  AI doesn&apos;t just score your site — it finds every WCAG violation,
                  explains in plain English why it&apos;s broken and generates the exact
                  code fix for that specific element. Not generic advice.
                </p>
              </div>

              <div className="space-y-3 max-w-3xl mx-auto mt-6">
                <URLAnalyzerInput onScan={handleScan} />
                <p className="text-center text-xs text-slate-500 tracking-wide">
                  Try: https://www.nike.com | https://www.stripe.com | https://www.airbnb.com
                </p>
              </div>
            </div>
          )}

          <div className="w-full pt-4">
            {scanError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {scanError}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!isScanning && !scanComplete && (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {proofBadges.map((badge, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.18 + index * 0.08,
                        duration: 0.45,
                      }}
                      className="group flex items-center gap-3 rounded-xl border border-white/40 bg-white/30 p-2.5 pr-4 shadow-sm backdrop-blur-md transition-all hover:bg-white/50 hover:shadow-md"
                    >
                      <div className={`flex items-center justify-center rounded-lg bg-white/80 p-2 shadow-sm ${badge.color}`}>
                        <badge.icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] font-semibold tracking-wide text-slate-500 group-hover:text-slate-800 transition-colors uppercase">
                        {badge.text}
                      </p>
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
                  className="w-full flex flex-col items-center gap-8"
                >
                  <div className="w-full max-w-4xl">
                    <PuzzleAnalysis progress={progress} />
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 text-center animate-pulse">
                    Analyzing: <span className="font-semibold text-brand-electric break-all">{scannedUrl}</span>
                  </p>
                </motion.div>
              )}

              {scanComplete && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-7xl mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-200 pointer-events-auto text-left"
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-slate-100 pb-6 gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                        Accessibility Scan Complete
                      </h2>
                      <div className="flex items-center gap-2 mb-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 max-w-fit">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Scanned URL</span>
                        <a
                          href={reportData?.url || scannedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-electric font-mono text-sm font-bold hover:underline"
                        >
                          {reportData?.url || scannedUrl}
                        </a>
                      </div>
                      <p className="text-slate-600 text-sm md:text-base max-w-2xl">
                        AI doesn&apos;t just score your site — it finds every WCAG
                        violation, explains in plain English why it&apos;s broken and
                        generates the exact code fix for that specific element.
                        Not generic advice. Exportable as PDF report.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleRescan}
                        className="whitespace-nowrap px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all border border-slate-200"
                      >
                        <RefreshCw className="w-4 h-4" /> New Scan
                      </button>
                      <button
                        onClick={() => generateAccessibilityPDF(reportData, scannedUrl)}
                        className="whitespace-nowrap px-4 py-2 flex items-center gap-2 bg-brand-midnight hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <FileText className="w-4 h-4" /> Export PDF Report
                      </button>
                    </div>
                  </div>

                  {/* Score Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-brand-electric/10 to-brand-blue/5 rounded-xl p-4 border border-brand-electric/20 text-center">
                      <p className="text-3xl font-black text-brand-electric">{reportData?.score ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">Score</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
                      <p className="text-3xl font-black text-red-600">{reportData?.issues?.filter((i: any) => i.severity === "critical").length ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">Critical</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                      <p className="text-3xl font-black text-amber-600">{reportData?.issues?.filter((i: any) => i.severity === "moderate").length ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">Moderate</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                      <p className="text-3xl font-black text-emerald-600">{reportData?.issues?.filter((i: any) => i.severity === "minor").length ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">Minor</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: All Developer-ready fixes */}
                    <div className="md:col-span-2 space-y-6">
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <Code className="w-5 h-5 text-brand-electric" />{" "}
                        Developer-ready fixes
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          ({reportData?.issues?.length ?? 0} issues found)
                        </span>
                      </h3>

                      {/* Render ALL issues — beginner-friendly cards */}
                      {reportData?.issues?.map((issue: any, idx: number) => {
                        const severityColors: Record<string, { bg: string; border: string; badge: string; accent: string }> = {
                          critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", accent: "border-l-red-500" },
                          moderate: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", accent: "border-l-amber-500" },
                          minor: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", accent: "border-l-blue-500" },
                        };
                        const colors = severityColors[issue.severity] || severityColors.moderate;
                        const difficulty = getDifficulty(issue);
                        const isExpanded = expandedIssues.has(idx);
                        const totalIssues = reportData?.issues?.length ?? 0;

                        return (
                          <div key={`issue-${idx}`} className={`${colors.bg} border ${colors.border} border-l-4 ${colors.accent} rounded-xl shadow-sm overflow-hidden transition-all duration-300`}>
                            {/* Clickable header — always visible */}
                            <button
                              onClick={() => toggleIssue(idx)}
                              className="w-full text-left p-5 flex items-start justify-between gap-3 hover:bg-black/[0.02] transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                {/* Issue number + severity + difficulty */}
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <span className="bg-slate-800 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    #{idx + 1} of {totalIssues}
                                  </span>
                                  <span className={`${colors.badge} px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                                    {issue.severity}
                                  </span>
                                  <span className={`${difficulty.color} px-2.5 py-0.5 rounded-full text-[10px] font-bold border`}>
                                    {difficulty.label}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                    <Clock className="w-3 h-3" /> {difficulty.time}
                                  </span>
                                </div>

                                {/* Plain English title */}
                                <p className="text-slate-900 font-semibold text-base leading-snug">
                                  {issue.title}
                                </p>

                                {/* Quick summary — always visible */}
                                <p className="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-2">
                                  {issue.suggestedFix}
                                </p>
                              </div>

                              <div className="shrink-0 mt-1">
                                {isExpanded
                                  ? <ChevronUp className="w-5 h-5 text-slate-400" />
                                  : <ChevronDown className="w-5 h-5 text-slate-400" />
                                }
                              </div>
                            </button>

                            {/* Expandable detail section */}
                            {isExpanded && (
                              <div className="px-5 pb-5 space-y-4 border-t border-black/5">
                                {/* Who is affected */}
                                <div className="bg-white/70 rounded-lg p-3 mt-4">
                                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-brand-electric" /> Who is affected?
                                  </p>
                                  <p className="text-sm text-slate-600 leading-relaxed">
                                    {issue.impact}
                                  </p>
                                </div>

                                {/* Step-by-step How to Fix */}
                                <div className="bg-white/70 rounded-lg p-3">
                                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Wrench className="w-3.5 h-3.5 text-brand-electric" /> How to fix (step by step)
                                  </p>
                                  <ol className="space-y-2 text-sm text-slate-700">
                                    {issue.file && issue.file !== "Unknown file" && (
                                      <li className="flex items-start gap-2">
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-brand-electric text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
                                        <span>Open <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{issue.file}</code>{issue.lineNumber > 0 && <> at line <strong>{issue.lineNumber}</strong></>}</span>
                                      </li>
                                    )}
                                    <li className="flex items-start gap-2">
                                      <span className="shrink-0 w-5 h-5 rounded-full bg-brand-electric text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{issue.file && issue.file !== "Unknown file" ? "2" : "1"}</span>
                                      <span>Find this code in your file:</span>
                                    </li>
                                  </ol>
                                </div>

                                {/* Code diff — before/after */}
                                {(issue.codeSnippet?.current || issue.codeSnippet?.fixed) && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Code className="w-3.5 h-3.5 text-brand-electric" /> Before → After
                                      </p>
                                    </div>
                                    <div className="bg-[#0D1117] rounded-lg overflow-hidden">
                                      {issue.codeSnippet.current && (
                                        <div className="px-4 py-3 border-b border-white/10">
                                          <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-1">❌ Current (broken)</p>
                                          <pre className="text-[13px] text-red-300 font-mono whitespace-pre-wrap leading-relaxed">{issue.codeSnippet.current}</pre>
                                        </div>
                                      )}
                                      {issue.codeSnippet.fixed && (
                                        <div className="px-4 py-3">
                                          <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1">✅ Fixed (copy this)</p>
                                          <pre className="text-[13px] text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed">{issue.codeSnippet.fixed}</pre>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                      {issue.codeSnippet.fixed && (
                                        <button
                                          onClick={() => copyToClipboard(issue.codeSnippet.fixed, idx)}
                                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                            copiedIdx === idx
                                              ? "bg-emerald-500 text-white"
                                              : "bg-slate-800 hover:bg-slate-700 text-white"
                                          }`}
                                        >
                                          {copiedIdx === idx ? (
                                            <><Check className="w-3.5 h-3.5" /> Copied!</>
                                          ) : (
                                            <><Clipboard className="w-3.5 h-3.5" /> Copy fixed code</>
                                          )}
                                        </button>
                                      )}
                                      <div className="relative group/pr">
                                        <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-electric/60 text-white rounded-lg text-xs font-semibold transition-colors cursor-default opacity-80">
                                          <GitPullRequest className="w-3.5 h-3.5" /> Open PR with fix
                                        </button>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover/pr:opacity-100 transition-opacity pointer-events-none">
                                          🚀 Coming soon
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-slate-800 rotate-45" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* The final step */}
                                <div className="bg-white/70 rounded-lg p-3">
                                  <ol className="space-y-2 text-sm text-slate-700" start={issue.file && issue.file !== "Unknown file" ? 3 : 2}>
                                    <li className="flex items-start gap-2">
                                      <span className="shrink-0 w-5 h-5 rounded-full bg-brand-electric text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{issue.file && issue.file !== "Unknown file" ? "3" : "2"}</span>
                                      <span>Replace the broken code with the <strong className="text-emerald-600">green version above</strong>, save, and refresh your page.</span>
                                    </li>
                                  </ol>
                                </div>

                                {/* WCAG + metadata footer */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap pt-1">
                                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-500">
                                    {issue.wcagRule}
                                  </span>
                                  {issue.isDuplicate && (
                                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-500">
                                      Found {issue.duplicateCount}× across pages
                                    </span>
                                  )}
                                  <span className="uppercase tracking-wider font-semibold">
                                    {issue.businessPriority} priority
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <p className="text-sm text-slate-600 italic border-l-2 border-brand-electric pl-3 py-1 bg-slate-50 rounded-r-md">
                        This is the real pain point: people don&apos;t need more
                        scores, they need faster fixes.
                      </p>
                    </div>

                    {/* Right sidebar — Charts & Visualizations */}
                    <div className="space-y-6">
                      <ScanCharts reportData={reportData} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      {/* Floating Scroll to Top Button */}
      {scanComplete && (
        <button
          onClick={() => window.location.reload()}
          className="fixed bottom-8 right-8 z-[120] p-4 bg-brand-midnight text-white rounded-full shadow-2xl hover:bg-brand-electric hover:scale-110 active:scale-95 transition-all group"
          title="Back to Landing Page"
        >
          <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </section>
  );
}
