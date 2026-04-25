"use client";

import { mockReportData } from "@/mock/report";
import { ReportScoreCard } from "@/components/ReportScoreCard";
import { IssueCard } from "@/components/IssueCard";
import { AISuggestionPanel } from "@/components/AISuggestionPanel";
import { GlowingButton } from "@/components/ui/GlowingButton";
import { motion } from "framer-motion";
import { Download, Share2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";

export default function ReportPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  const criticalIssues = mockReportData.issues.filter(i => i.severity === "critical");
  const moderateIssues = mockReportData.issues.filter(i => i.severity === "moderate");
  const minorIssues = mockReportData.issues.filter(i => i.severity === "minor");

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Header & Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 border-b border-white/10 pb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-3">Accessibility Report</h1>
              <p className="text-xl text-zinc-400 font-light tracking-wide">Analysis complete. Review issues and deploy fixes instantly.</p>
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

          <ReportScoreCard report={mockReportData} />
        </motion.div>

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
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  Critical Issues <span className="text-zinc-500 font-normal">({criticalIssues.length})</span>
                </h2>
                <div className="space-y-4">
                  {criticalIssues.map(issue => (
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
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                  Moderate Issues <span className="text-zinc-500 font-normal">({moderateIssues.length})</span>
                </h2>
                <div className="space-y-4">
                  {moderateIssues.map(issue => (
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
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  Minor Issues <span className="text-zinc-500 font-normal">({minorIssues.length})</span>
                </h2>
                <div className="space-y-4">
                  {minorIssues.map(issue => (
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
              <AISuggestionPanel suggestions={mockReportData.aiSuggestions} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-3xl p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">Fixed everything?</h3>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                Deploy your changes and run another scan to verify your accessibility improvements.
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
