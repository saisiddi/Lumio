"use client";

import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, FileCode, Hash } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CodeCompare } from "./CodeCompare";

interface Issue {
  id: string;
  title: string;
  severity: "critical" | "moderate" | "minor";
  impact: string;
  description: string;
  suggestedFix: string;
  codeSnippet?: { current: string; fixed: string };
  file: string;
  lineNumber: number;
  elementDescription: string;
  wcagRule: string;
  affectedUsers: number;
  businessPriority: "critical" | "high" | "medium" | "low";
  isDuplicate?: boolean;
  duplicateCount?: number;
  patch?: {
    language: string;
    title: string;
    code: string;
    commit_message: string;
    pr_summary: string;
  };
  pageUrl?: string;
  pageTitle?: string;
  aiExplanation?: string;
}

export function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityConfig = () => {
    switch (issue.severity) {
      case "critical":
        return { icon: AlertCircle, color: "text-status-error", bg: "bg-status-error/10", border: "border-status-error/20" };
      case "moderate":
        return { icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning/10", border: "border-status-warning/20" };
      case "minor":
        return { icon: Info, color: "text-brand-electric", bg: "bg-brand-electric/10", border: "border-brand-electric/20" };
    }
  };

  const { icon: Icon, color, bg, border } = getSeverityConfig();

  return (
    <div className={`glass rounded-xl overflow-hidden border transition-all duration-300 ${expanded ? border : "border-white/5"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>
                {issue.severity}
              </span>
              {issue.businessPriority && (
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-zinc-400">
                  {issue.businessPriority}
                </span>
              )}
              {issue.isDuplicate && issue.duplicateCount && (
                <span className="text-xs px-2 py-0.5 rounded bg-brand-violet/20 text-brand-violet">
                  {issue.duplicateCount}x across pages
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-zinc-500">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t border-white/5 space-y-6">
              {/* Location & Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {issue.file && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <FileCode className="w-4 h-4" />
                    <span>{issue.file}</span>
                  </div>
                )}
                {issue.lineNumber > 0 && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Hash className="w-4 h-4" />
                    <span>Line {issue.lineNumber}</span>
                  </div>
                )}
                {issue.wcagRule && (
                  <div className="flex items-center gap-2 text-brand-electric">
                    <span className="text-xs">{issue.wcagRule}</span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">{issue.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">User Impact</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">{issue.impact}</p>
                </div>
              </div>

              {issue.elementDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Affected Element</h4>
                  <p className="text-zinc-300 text-sm">{issue.elementDescription}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">AI Explanation</h4>
                <p className="text-brand-electric text-sm mb-4">{issue.aiExplanation || issue.suggestedFix}</p>

                {(issue.codeSnippet || issue.patch?.code) && (
                  <CodeCompare
                    current={issue.codeSnippet?.current || issue.patch?.code?.split("```")[1]?.split("\n").slice(1).join("\n") || ""}
                    fixed={issue.codeSnippet?.fixed || issue.patch?.code?.split("```")[2]?.trim() || issue.patch?.code || ""}
                  />
                )}
              </div>

              {issue.patch && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Developer Patch</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-zinc-500">Language: </span>
                      <span className="text-zinc-300">{issue.patch.language}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Title: </span>
                      <span className="text-zinc-300">{issue.patch.title}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-zinc-500">Commit: </span>
                      <code className="text-brand-electric text-xs">{issue.patch.commit_message}</code>
                    </div>
                  </div>
                </div>
              )}

              {issue.pageUrl && (
                <div className="text-xs text-zinc-500">
                  Found on: <span className="text-zinc-400">{issue.pageUrl}</span>
                  {issue.pageTitle && <span className="ml-2">({issue.pageTitle})</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}