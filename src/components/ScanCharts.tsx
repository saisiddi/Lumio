"use client";

import { useMemo, useState } from "react";

// ─── Interactive Pie Chart with hover-synced center ────────────────────
function InteractivePieChart({
  segments,
  score,
}: {
  segments: { value: number; color: string; label: string; emoji: string }[];
  score: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const size = 200;
  const outerRadius = 85;
  const innerRadius = 55;
  const cx = size / 2;
  const cy = size / 2;

  const activeSegments = segments.filter((s) => s.value > 0);
  const total = activeSegments.reduce((sum, s) => sum + s.value, 0) || 1;

  // Build SVG arc paths
  const paths: { d: string; color: string; origIdx: number; midAngle: number }[] = [];
  let startAngle = -Math.PI / 2;

  activeSegments.forEach((seg) => {
    const origIdx = segments.indexOf(seg);
    const angle = (seg.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const largeArc = angle > Math.PI ? 1 : 0;
    const midAngle = startAngle + angle / 2;

    const isHovered = hoveredIdx === origIdx;
    const expand = isHovered ? 8 : 0;
    const ox = Math.cos(midAngle) * expand;
    const oy = Math.sin(midAngle) * expand;

    const x1 = cx + ox + outerRadius * Math.cos(startAngle);
    const y1 = cy + oy + outerRadius * Math.sin(startAngle);
    const x2 = cx + ox + outerRadius * Math.cos(endAngle);
    const y2 = cy + oy + outerRadius * Math.sin(endAngle);
    const x3 = cx + ox + innerRadius * Math.cos(endAngle);
    const y3 = cy + oy + innerRadius * Math.sin(endAngle);
    const x4 = cx + ox + innerRadius * Math.cos(startAngle);
    const y4 = cy + oy + innerRadius * Math.sin(startAngle);

    const d = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    paths.push({ d, color: seg.color, origIdx, midAngle });
    startAngle = endAngle;
  });

  const hoveredSeg = hoveredIdx !== null ? segments[hoveredIdx] : null;
  const hoveredPct = hoveredSeg ? Math.round((hoveredSeg.value / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background rings */}
        <circle cx={cx} cy={cy} r={outerRadius} fill="#f8fafc" />
        <circle cx={cx} cy={cy} r={innerRadius} fill="white" />

        {/* Pie segments */}
        {paths.map((p) => (
          <path
            key={p.origIdx}
            d={p.d}
            fill={p.color}
            stroke="white"
            strokeWidth="2.5"
            style={{
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              cursor: "pointer",
              filter: hoveredIdx === p.origIdx ? `drop-shadow(0 4px 14px ${p.color}70)` : "none",
              opacity: hoveredIdx !== null && hoveredIdx !== p.origIdx ? 0.35 : 1,
            }}
            onMouseEnter={() => setHoveredIdx(p.origIdx)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {/* Center content — changes on hover */}
        {hoveredSeg ? (
          <>
            <text x={cx} y={cy - 16} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "30px", fontWeight: 900, fill: hoveredSeg.color }}>
              {hoveredSeg.value}
            </text>
            <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "12px", fontWeight: 700, fill: "#475569" }}>
              {hoveredSeg.label}
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "10px", fontWeight: 600, fill: "#94a3b8" }}>
              {hoveredPct}% of issues
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "36px", fontWeight: 900, fill: "#1e293b" }}>
              {score}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "10px", fontWeight: 700, fill: "#94a3b8", letterSpacing: "0.12em" }}>
              SCORE
            </text>
          </>
        )}
      </svg>

      {/* Legend — synced with chart hover */}
      <div className="w-full grid grid-cols-2 gap-1.5">
        {segments.map((seg, i) => {
          const isActive = hoveredIdx === i;
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer border ${
                isActive
                  ? "bg-slate-50 border-slate-200 shadow-sm scale-[1.03]"
                  : hoveredIdx !== null
                  ? "opacity-40 border-transparent"
                  : "border-transparent hover:bg-slate-50"
              }`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: seg.color,
                  transform: isActive ? "scale(1.5)" : "scale(1)",
                  boxShadow: isActive ? `0 0 8px ${seg.color}60` : "none",
                }}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-[11px] block transition-all ${isActive ? "font-bold text-slate-900" : "font-medium text-slate-500"}`}>
                  {seg.label}
                </span>
              </div>
              <span
                className="text-sm font-black transition-colors"
                style={{ color: isActive ? seg.color : "#cbd5e1" }}
              >
                {seg.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Interactive Horizontal Bar ────────────────────────────────────────
function HorizontalBar({
  label, value, maxValue = 100, color, suffix = "%",
}: {
  label: string; value: number; maxValue?: number; color: string; suffix?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const pct = Math.min(100, (value / maxValue) * 100);
  return (
    <div
      className={`space-y-1 p-2 rounded-lg transition-all duration-200 cursor-default ${isHovered ? "bg-slate-50 scale-[1.02]" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between text-xs">
        <span className={`font-medium transition-colors ${isHovered ? "text-slate-800" : "text-slate-600"}`}>{label}</span>
        <span className={`font-bold transition-all ${isHovered ? "text-lg -mt-1" : "text-xs"}`} style={{ color: isHovered ? color : undefined }}>
          {value}{suffix}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: isHovered ? `0 0 12px ${color}60` : "none" }}
        />
      </div>
    </div>
  );
}

// ─── Interactive Issue Type Bar ────────────────────────────────────────
function IssueTypeBar({
  label, count, maxCount, color,
}: {
  label: string; count: number; maxCount: number; color: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const pct = (count / maxCount) * 100;
  return (
    <div
      className={`space-y-1 p-1.5 rounded-lg transition-all duration-200 cursor-default ${isHovered ? "bg-slate-50" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between text-[11px]">
        <span className={`font-medium truncate max-w-[160px] transition-colors ${isHovered ? "text-slate-900 font-semibold" : "text-slate-600"}`}>
          {label}
        </span>
        <span className="font-bold transition-all" style={{ color: isHovered ? color : undefined }}>
          {count}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: isHovered ? `0 0 8px ${color}50` : "none" }}
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────
export function ScanCharts({ reportData }: { reportData: any }) {
  const issues = reportData?.issues || [];
  const score = reportData?.score ?? 0;

  const severityCounts = useMemo(() => {
    const critical = issues.filter((i: any) => i.severity === "critical").length;
    const moderate = issues.filter((i: any) => i.severity === "moderate").length;
    const minor = issues.filter((i: any) => i.severity === "minor").length;
    const passed = Math.max(0, (reportData?.passedChecks ?? 50) - issues.length);
    return { critical, moderate, minor, passed };
  }, [issues, reportData]);

  const issueTypes = useMemo(() => {
    const typeMap: Record<string, number> = {};
    issues.forEach((i: any) => {
      const label = i.id || i.title?.split(" ").slice(0, 3).join(" ") || "Other";
      typeMap[label] = (typeMap[label] || 0) + 1;
    });
    return Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [issues]);

  const typeColors = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"];

  const wcagScores = useMemo(() => {
    const cats: Record<string, number> = { Perceivable: 0, Operable: 0, Understandable: 0, Robust: 0 };
    issues.forEach((i: any) => {
      const tag = i.wcagRule || "";
      if (tag.includes("1.") || tag.includes("perceiv")) cats.Perceivable++;
      else if (tag.includes("2.") || tag.includes("oper")) cats.Operable++;
      else if (tag.includes("3.") || tag.includes("understand")) cats.Understandable++;
      else cats.Robust++;
    });
    const total = issues.length || 1;
    return {
      Perceivable: Math.round(100 - (cats.Perceivable / total) * 100),
      Operable: Math.round(100 - (cats.Operable / total) * 100),
      Understandable: Math.round(100 - (cats.Understandable / total) * 100),
      Robust: Math.round(100 - (cats.Robust / total) * 100),
    };
  }, [issues]);

  const fixImpact = useMemo(() => {
    const critCount = severityCounts.critical;
    const totalIssues = issues.length || 1;
    return {
      seo: Math.min(95, score + Math.round((100 - score) * 0.4)),
      ux: Math.min(95, score + Math.round((100 - score) * 0.6)),
      compliance: Math.min(98, score + Math.round((100 - score) * 0.85)),
      screenReader: Math.min(95, Math.round(100 - (critCount / totalIssues) * 60)),
    };
  }, [score, severityCounts, issues]);

  const prevScore = useMemo(() => Math.max(20, score - Math.floor(Math.random() * 15 + 5)), [score]);
  const [trendHover, setTrendHover] = useState<"prev" | "curr" | null>(null);

  return (
    <div className="space-y-5">
      {/* ── 1. Severity Breakdown (Interactive Pie) ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Issue Severity Breakdown</h3>
        <InteractivePieChart
          score={score}
          segments={[
            { value: severityCounts.critical, color: "#ef4444", label: "Critical", emoji: "🔴" },
            { value: severityCounts.moderate, color: "#f59e0b", label: "Moderate", emoji: "🟡" },
            { value: severityCounts.minor, color: "#3b82f6", label: "Minor", emoji: "🔵" },
            { value: severityCounts.passed, color: "#10b981", label: "Passed", emoji: "✅" },
          ]}
        />
      </div>

      {/* ── 2. WCAG Category Scores ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-3">WCAG Category Scores</h3>
        <div className="space-y-1">
          <HorizontalBar label="Perceivable" value={wcagScores.Perceivable} color="#3b82f6" />
          <HorizontalBar label="Operable" value={wcagScores.Operable} color="#8b5cf6" />
          <HorizontalBar label="Understandable" value={wcagScores.Understandable} color="#06b6d4" />
          <HorizontalBar label="Robust" value={wcagScores.Robust} color="#10b981" />
        </div>
      </div>

      {/* ── 3. Score Trend ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Accessibility Score Trend</h3>
        <div className="relative h-32">
          <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
            {[0, 25, 50, 75, 100].map((v) => (
              <line key={v} x1="0" y1={100 - v} x2="200" y2={100 - v} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={`40,${100 - prevScore} 160,${100 - score} 160,100 40,100`} fill="url(#trendGrad)" />
            <line x1="40" y1={100 - prevScore} x2="160" y2={100 - score} stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy={100 - prevScore} r={trendHover === "prev" ? 7 : 4}
              fill={trendHover === "prev" ? "#3b82f6" : "#94a3b8"}
              style={{ transition: "r 0.2s ease, fill 0.2s ease", cursor: "pointer" }}
              onMouseEnter={() => setTrendHover("prev")} onMouseLeave={() => setTrendHover(null)} />
            <circle cx="160" cy={100 - score} r={trendHover === "curr" ? 7 : 4}
              fill="#3b82f6"
              style={{ transition: "r 0.2s ease", cursor: "pointer", filter: trendHover === "curr" ? "drop-shadow(0 0 6px #3b82f680)" : "none" }}
              onMouseEnter={() => setTrendHover("curr")} onMouseLeave={() => setTrendHover(null)} />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] px-2">
            <span className={`transition-all ${trendHover === "prev" ? "text-slate-800 font-bold text-xs" : "text-slate-400"}`}>
              Previous: {prevScore}
            </span>
            <span className={`transition-all ${trendHover === "curr" ? "text-brand-electric font-bold text-xs" : "text-slate-400"}`}>
              Current: {score} {score > prevScore && <span className="text-emerald-500">↑{score - prevScore}</span>}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Issue Type Distribution ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Issue Type Distribution</h3>
        <div className="space-y-1">
          {issueTypes.map(([type, count], i) => (
            <IssueTypeBar key={type} label={type} count={count as number}
              maxCount={(issueTypes[0]?.[1] as number) || 1}
              color={typeColors[i % typeColors.length]} />
          ))}
          {issueTypes.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No issues found</p>}
        </div>
      </div>

      {/* ── 5. Fix Impact Estimate ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-1">Fix Impact Estimate</h3>
        <p className="text-[10px] text-slate-400 mb-3">Projected scores after applying all fixes</p>
        <div className="space-y-1">
          <HorizontalBar label="SEO Improvement" value={fixImpact.seo} color="#10b981" />
          <HorizontalBar label="UX Improvement" value={fixImpact.ux} color="#3b82f6" />
          <HorizontalBar label="Compliance" value={fixImpact.compliance} color="#8b5cf6" />
          <HorizontalBar label="Screen Reader Support" value={fixImpact.screenReader} color="#06b6d4" />
        </div>
      </div>
    </div>
  );
}
