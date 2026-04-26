"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportScoreCard } from "@/components/ReportScoreCard";
import { IssueCard } from "@/components/IssueCard";
import { AISuggestionPanel } from "@/components/AISuggestionPanel";
import { GlowingButton } from "@/components/ui/GlowingButton";
import { motion } from "framer-motion";
import { Download, Share2, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface SourceLocation {
  file_path: string;
  line_number: number | null;
  framework: string;
  snippet: string;
  confidence: number;
}

interface DeveloperPatch {
  language: string;
  title: string;
  code: string;
  commit_message: string;
  pr_summary: string;
}

interface ViolationItem {
  id: string;
  impact: string | null;
  description: string;
  element_html: string;
  target: string[];
  failure_summary: string;
  help_url: string;
  page_url: string;
  page_title: string;
  wcag_tags: string[];
  affected_users: string[];
  business_priority: string;
  priority_score: number;
  duplicate_occurrences: number;
  source: SourceLocation;
  patch: DeveloperPatch;
  ai_explanation: string;
  ai_impact: string;
  ai_fix: string;
}

interface IssueGroup {
  key: string;
  id: string;
  description: string;
  impact: string | null;
  business_priority: string;
  affected_users: string[];
  wcag_tags: string[];
  total_occurrences: number;
  pages: string[];
  recommended_fix: string;
}

interface ScanResponse {
  url: string;
  scan_time: string;
  total_violations: number;
  scanned_pages: string[];
  severity_counts: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  grouped_issues: IssueGroup[];
  regressions: {
    new_issues: number;
    resolved_issues: number;
    unchanged_issues: number;
    previous_scan_time: string;
  };
  changelog: Array<{
    scan_time: string;
    total_violations: number;
    new_issues: number;
    resolved_issues: number;
  }>;
  violations: ViolationItem[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000";

function mapApiToIssues(violations: ViolationItem[]) {
  return violations.map((v) => ({
    id: v.id,
    title: v.description.slice(0, 80),
    severity: (v.impact as "critical" | "moderate" | "minor") || "moderate",
    impact: v.ai_impact || v.impact || "Unknown impact",
    description: v.failure_summary || v.description,
    suggestedFix: v.ai_fix || v.ai_explanation,
    codeSnippet: v.ai_fix
      ? { current: v.element_html || "", fixed: v.ai_fix }
      : undefined,
    file: v.source?.file_path || "",
    lineNumber: v.source?.line_number || 0,
    elementDescription: v.target?.join(", ") || v.description,
    wcagRule: v.wcag_tags?.join(", ") || "",
    affectedUsers: 0,
    businessPriority: (v.business_priority?.toLowerCase() as "critical" | "high" | "medium" | "low") || "medium",
    isDuplicate: v.duplicate_occurrences > 1,
    duplicateCount: v.duplicate_occurrences,
    patch: v.patch,
    pageUrl: v.page_url,
    pageTitle: v.page_title,
    aiExplanation: v.ai_explanation,
  }));
}

export default function ReportPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    url: string;
    scanTime: string;
    totalViolations: number;
    scannedPages: string[];
    severityCounts: { critical: number; serious: number; moderate: number; minor: number };
    groupedIssues: IssueGroup[];
    regressions: { new_issues: number; resolved_issues: number; unchanged_issues: number; previous_scan_time: string };
    changelog: Array<{ scan_time: string; total_violations: number; new_issues: number; resolved_issues: number }>;
    issues: ReturnType<typeof mapApiToIssues>;
    score: number;
    passedChecks: number;
    totalChecks: number;
    aiSuggestions: string[];
  } | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function fetchReport() {
      const pendingUrl = sessionStorage.getItem("pendingScanUrl");
      if (!pendingUrl) {
        setError("No URL found. Please start a new scan.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: pendingUrl, max_pages: 3 }),
        });

        if (!response.ok) {
          throw new Error(`Scan failed: ${response.statusText}`);
        }

        const data: ScanResponse = await response.json();
        sessionStorage.removeItem("pendingScanUrl");

        const issues = mapApiToIssues(data.violations || []);
        const passedChecks = Math.max(0, 50 - data.total_violations);

        setReportData({
          url: data.url,
          scanTime: data.scan_time,
          totalViolations: data.total_violations,
          scannedPages: data.scanned_pages || [],
          severityCounts: data.severity_counts || { critical: 0, serious: 0, moderate: 0, minor: 0 },
          groupedIssues: data.grouped_issues || [],
          regressions: data.regressions || { new_issues: 0, resolved_issues: 0, unchanged_issues: 0, previous_scan_time: "" },
          changelog: data.changelog || [],
          issues,
          score: Math.max(0, Math.round((passedChecks / 50) * 100)),
          passedChecks,
          totalChecks: 50,
          aiSuggestions: data.violations?.slice(0, 3).map((v) => v.ai_explanation) || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch report");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-midnight flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-electric animate-spin mb-4" />
        <p className="text-white text-xl">Generating your accessibility report...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-brand-midnight flex flex-col items-center justify-center">
        <p className="text-status-error text-xl mb-4">{error || "Failed to load report"}</p>
        <Link href="/" className="px-6 py-3 bg-brand-electric text-white rounded-xl">
          Start New Scan
        </Link>
      </div>
    );
  }

  const criticalIssues = reportData.issues.filter((i) => i.severity === "critical");
  const moderateIssues = reportData.issues.filter((i) => i.severity === "moderate");
  const minorIssues = reportData.issues.filter((i) => i.severity === "minor");

  return (
    <div className="min-h-screen bg-brand-midnight pb-24">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Header & Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-3">Developer-ready fixes</h1>
              <p className="text-xl text-zinc-400 font-light tracking-wide">
                Paste a URL. AI doesn't just score your site — it finds every WCAG violation, explains in plain English why it's broken and generates the exact code fix for that specific element. Not generic advice. Exportable as PDF report.
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Scanned: {reportData.url} | {reportData.scannedPages.length} pages | {reportData.totalViolations} violations
              </p>
              {reportData.regressions.new_issues > 0 && (
                <p className="text-sm text-status-warning mt-1">
                  {reportData.regressions.new_issues} new issues since last scan
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-medium bg-white/[0.02]">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-medium bg-white/[0.02]">
                <Download className="w-4 h-4" /> PDF Report
              </button>
            </div>
          </div>

          <ReportScoreCard
            report={{
              score: reportData.score,
              url: reportData.url,
              timestamp: reportData.scanTime,
              passedChecks: reportData.passedChecks,
              totalChecks: reportData.totalChecks,
              issues: reportData.issues,
              aiSuggestions: reportData.aiSuggestions,
              groupedIssues: reportData.groupedIssues,
              severityCounts: reportData.severityCounts,
            }}
          />
        </motion.div>

        {/* Grouped Issues Summary */}
        {reportData.groupedIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-3xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Proof and prioritization</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.groupedIssues.slice(0, 6).map((group, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      group.impact === "critical" ? "bg-status-error/20 text-status-error" :
                      group.impact === "serious" ? "bg-status-warning/20 text-status-warning" :
                      "bg-brand-electric/20 text-brand-electric"
                    }`}>
                      {group.business_priority || "P2"}
                    </span>
                    <span className="text-xs text-zinc-500">{group.total_occurrences}x</span>
                  </div>
                  <p className="text-sm text-white font-medium line-clamp-2">{group.description}</p>
                  <p className="text-xs text-zinc-400 mt-2">{group.pages?.length || 1} pages affected</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-400 mt-4">
              show impact, affected users, severity, WCAG rule, and business priority
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              group duplicate issues across pages
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              tell teams what to fix first
            </p>
            <p className="text-xs text-zinc-500 mt-4 pt-4 border-t border-white/10">
              Most accessibility tools overwhelm teams. Prioritization is a huge differentiator.
            </p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content - Issues List */}
          <div className="lg:col-span-2 space-y-12">
            {criticalIssues.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold flex items-center gap-3 text-white tracking-tight">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-error shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  Critical Issues <span className="text-zinc-500 font-normal">({criticalIssues.length})</span>
                </h2>
                <div className="space-y-4">
                  {criticalIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </motion.section>
            )}

            {moderateIssues.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold flex items-center gap-3 text-white tracking-tight">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-warning shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                  Moderate Issues <span className="text-zinc-500 font-normal">({moderateIssues.length})</span>
                </h2>
                <div className="space-y-4">
                  {moderateIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </motion.section>
            )}

            {minorIssues.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold flex items-center gap-3 text-white tracking-tight">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-electric shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  Minor Issues <span className="text-zinc-500 font-normal">({minorIssues.length})</span>
                </h2>
                <div className="space-y-4">
                  {minorIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <AISuggestionPanel suggestions={reportData.aiSuggestions} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-3xl p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-brand-electric" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">Fixed everything?</h3>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                scan staging/production automatically, compare before/after, alert only on new regressions, keep an accessibility changelog.
              </p>
              <Link href="/" className="block pt-4">
                <GlowingButton className="w-full">
                  Re-scan Target
                </GlowingButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}