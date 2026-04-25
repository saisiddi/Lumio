"use client";

import { Issue } from "@/mock/report";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CodeCompare } from "./CodeCompare";

export function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityConfig = () => {
    switch (issue.severity) {
      case "critical":
        return { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
      case "moderate":
        return { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
      case "minor":
        return { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    }
  };

  const { icon: Icon, color, bg, border } = getSeverityConfig();

  return (
    <div className={`glass rounded-xl overflow-hidden border transition-all duration-300 ${expanded ? border : 'border-white/5'}`}>
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
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>
                {issue.severity}
              </span>
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

              <div>
                <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Suggested Fix</h4>
                <p className="text-brand-blue text-sm mb-4">{issue.suggestedFix}</p>
                
                {issue.codeSnippet && (
                  <CodeCompare 
                    current={issue.codeSnippet.current} 
                    fixed={issue.codeSnippet.fixed} 
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
