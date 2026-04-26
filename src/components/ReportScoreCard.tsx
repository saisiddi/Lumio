"use client";

import { motion } from "framer-motion";

interface ReportData {
  score: number;
  url: string;
  timestamp: string;
  passedChecks: number;
  totalChecks: number;
  issues: unknown[];
  aiSuggestions: string[];
  groupedIssues?: unknown[];
  severityCounts?: { critical: number; serious: number; moderate: number; minor: number };
}

export function ReportScoreCard({ report }: { report: ReportData }) {
  // Determine grade
  let grade = "A";
  let gradeColor = "text-green-400";
  let glowColor = "shadow-[0_0_30px_rgba(34,197,94,0.3)]";
  
  if (report.score < 90 && report.score >= 80) {
    grade = "B";
    gradeColor = "text-[#00E5FF]";
    glowColor = "shadow-[0_0_30px_rgba(0,229,255,0.3)]";
  } else if (report.score < 80 && report.score >= 70) {
    grade = "C";
    gradeColor = "text-yellow-400";
    glowColor = "shadow-[0_0_30px_rgba(250,204,21,0.3)]";
  } else if (report.score < 70) {
    grade = "F";
    gradeColor = "text-red-400";
    glowColor = "shadow-[0_0_30px_rgba(239,68,68,0.3)]";
  }

  return (
    <div className={`glass-card rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between border border-white/5 ${glowColor} transition-all duration-500`}>
      <div className="flex flex-col mb-8 md:mb-0">
        <h2 className="text-zinc-400 font-medium mb-2 uppercase tracking-wider">Accessibility Score</h2>
        <div className="flex items-end gap-4">
          <div className="text-6xl font-bold tracking-tight">{report.score}</div>
          <div className="text-2xl text-zinc-500 mb-1">/ 100</div>
        </div>
        <div className="mt-4 text-sm text-zinc-400">
          Target URL: <span className="text-white">{report.url}</span>
        </div>
        <div className="text-sm text-zinc-400">
          Scanned at: <span className="text-white">{new Date(report.timestamp).toLocaleString()}</span>
        </div>
        {report.severityCounts && (
          <div className="mt-4 flex gap-4">
            {report.severityCounts.critical > 0 && (
              <span className="text-status-error">{report.severityCounts.critical} critical</span>
            )}
            {report.severityCounts.serious > 0 && (
              <span className="text-status-warning">{report.severityCounts.serious} serious</span>
            )}
            {report.severityCounts.moderate > 0 && (
              <span className="text-yellow-500">{report.severityCounts.moderate} moderate</span>
            )}
            {report.severityCounts.minor > 0 && (
              <span className="text-brand-electric">{report.severityCounts.minor} minor</span>
            )}
          </div>
        )}
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Animated Circular Meter */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-white/5 stroke-current"
            strokeWidth="8"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
          />
          <motion.circle
            className={`${gradeColor} stroke-current`}
            strokeWidth="8"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            initial={{ strokeDasharray: "0 251.2" }}
            animate={{ strokeDasharray: `${(report.score / 100) * 251.2} 251.2` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-5xl font-black ${gradeColor}`}>{grade}</span>
          <span className="text-xs text-zinc-500 font-bold tracking-widest mt-1">GRADE</span>
        </div>
      </div>
    </div>
  );
}
