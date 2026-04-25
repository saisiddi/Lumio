import { useMemo, useState } from "react";
import { DemoOne } from "./components/DemoOne";

type SourceLocation = {
  file_path?: string;
  line_number?: number | null;
  framework?: string;
  confidence?: number;
};

type DeveloperPatch = {
  language?: string;
  title?: string;
  code?: string;
  commit_message?: string;
  pr_summary?: string;
};

type ViolationItem = {
  id: string;
  impact?: string | null;
  description: string;
  page_url?: string;
  wcag_tags?: string[];
  affected_users?: string[];
  business_priority?: string;
  duplicate_occurrences?: number;
  ai_explanation?: string;
  ai_impact?: string;
  ai_fix?: string;
  source?: SourceLocation;
  patch?: DeveloperPatch;
};

type IssueGroup = {
  id: string;
  description: string;
  impact?: string | null;
  business_priority?: string;
  affected_users?: string[];
  wcag_tags?: string[];
  total_occurrences?: number;
  pages?: string[];
  recommended_fix?: string;
};

type RegressionSummary = {
  new_issues?: number;
  resolved_issues?: number;
  unchanged_issues?: number;
  previous_scan_time?: string;
};

type ChangelogEntry = {
  scan_time: string;
  total_violations: number;
  new_issues: number;
  resolved_issues: number;
};

type ScanResult = {
  total_violations?: number;
  scanned_pages?: string[];
  grouped_issues?: IssueGroup[];
  violations?: ViolationItem[];
  regressions?: RegressionSummary;
  changelog?: ChangelogEntry[];
};

const PAGE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const IMPACT_WEIGHT: Record<string, number> = {
  critical: 25,
  serious: 15,
  moderate: 8,
  minor: 3,
};

const PRIORITY_WEIGHT: Record<string, number> = {
  P0: 4,
  P1: 3,
  P2: 2,
  P3: 1,
};

function App() {
  const [url, setUrl] = useState("");
  const [repoPath, setRepoPath] = useState("");
  const [maxPages, setMaxPages] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copiedPatchIndex, setCopiedPatchIndex] = useState<number | null>(null);
  const [prDraftStatus, setPrDraftStatus] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const backendBaseUrl = useMemo(() => {
    return "http://localhost:8080";
  }, []);

  const goToScanSection = () => {
    const section = document.getElementById("scan-section");
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runScan = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${backendBaseUrl}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: trimmed,
          repo_path: repoPath.trim() || undefined,
          max_pages: maxPages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Scan failed. Please try again.";
        throw new Error(message);
      }

      setResult(data);
    } catch (scanError) {
      const message =
        scanError instanceof Error
          ? scanError.message
          : "Something went wrong while scanning.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPatch = async (violation: ViolationItem, index: number) => {
    const patchTitle = violation.patch?.title || "Fix";
    const patchCode =
      violation.patch?.code || violation.ai_fix || "No code fix generated.";
    const payload = `${patchTitle}\n\n${patchCode}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedPatchIndex(index);
      setTimeout(() => setCopiedPatchIndex(null), 1600);
    } catch {
      setError("Could not copy patch to clipboard.");
    }
  };

  const copyLocation = async (violation: ViolationItem) => {
    const filePath = violation.source?.file_path || "unknown-file";
    const line =
      typeof violation.source?.line_number === "number"
        ? violation.source.line_number
        : "n/a";
    try {
      await navigator.clipboard.writeText(`${filePath}:${line}`);
      setPrDraftStatus("File + line copied to clipboard.");
    } catch {
      setError("Could not copy file + line.");
    }
  };

  const exportPdfReport = () => {
    window.print();
  };

  const openPrWithFixes = async () => {
    if (!result?.violations?.length) {
      setPrDraftStatus("Run a scan first to generate a PR-ready fix draft.");
      return;
    }

    const draftLines: string[] = [];
    draftLines.push("# Lumio Accessibility Fix PR");
    draftLines.push("");
    draftLines.push(`Target URL: ${url}`);
    draftLines.push(`Pages scanned: ${result.scanned_pages?.length ?? 0}`);
    draftLines.push(`Total violations: ${result.total_violations ?? 0}`);
    draftLines.push("");
    draftLines.push("## Included Fixes");
    draftLines.push("");

    result.violations.slice(0, 12).forEach((violation, idx) => {
      const filePath = violation.source?.file_path || "unknown-file";
      const line = violation.source?.line_number ?? "n/a";
      const commitMessage =
        violation.patch?.commit_message ||
        `fix(a11y): ${violation.id} on ${filePath}`;

      draftLines.push(`### ${idx + 1}. ${violation.id}`);
      draftLines.push(`- Severity: ${violation.impact || "unknown"}`);
      draftLines.push(
        `- Business priority: ${violation.business_priority || "P3"}`,
      );
      draftLines.push(`- File + line: ${filePath}:${line}`);
      draftLines.push(`- Commit message: ${commitMessage}`);
      draftLines.push("- Patch:");
      draftLines.push("```html");
      draftLines.push(
        violation.patch?.code || violation.ai_fix || "No generated patch",
      );
      draftLines.push("```");
      draftLines.push("");
    });

    const draft = draftLines.join("\n");
    try {
      await navigator.clipboard.writeText(draft);
      setPrDraftStatus(
        "PR draft copied. Paste it into your GitHub PR description.",
      );
    } catch {
      setPrDraftStatus("Could not copy PR draft to clipboard.");
    }
  };

  const allViolations = result?.violations || [];
  const topIssues = result?.grouped_issues?.slice(0, 5) || [];
  const severityCounts = {
    critical: allViolations.filter((v) => v.impact === "critical").length,
    serious: allViolations.filter((v) => v.impact === "serious").length,
    moderate: allViolations.filter((v) => v.impact === "moderate").length,
    minor: allViolations.filter((v) => v.impact === "minor").length,
  };

  const weightedPenalty = allViolations.reduce((total, violation) => {
    const impact = violation.impact || "minor";
    const duplicates = violation.duplicate_occurrences || 1;
    return total + (IMPACT_WEIGHT[impact] || 2) * Math.min(duplicates, 3);
  }, 0);

  const accessibilityScore = Math.max(0, 100 - weightedPenalty);
  const scoreGrade =
    accessibilityScore >= 90
      ? "A"
      : accessibilityScore >= 80
        ? "B"
        : accessibilityScore >= 70
          ? "C"
          : accessibilityScore >= 60
            ? "D"
            : "F";

  const fixFirstQueue = [...allViolations]
    .sort((a, b) => {
      const aPriority = PRIORITY_WEIGHT[a.business_priority || "P3"] || 1;
      const bPriority = PRIORITY_WEIGHT[b.business_priority || "P3"] || 1;
      const aImpact = IMPACT_WEIGHT[a.impact || "minor"] || 1;
      const bImpact = IMPACT_WEIGHT[b.impact || "minor"] || 1;
      const aDup = a.duplicate_occurrences || 1;
      const bDup = b.duplicate_occurrences || 1;
      return (
        bPriority * 100 +
        bImpact * 10 +
        bDup -
        (aPriority * 100 + aImpact * 10 + aDup)
      );
    })
    .slice(0, 5);

  const filteredViolations = allViolations.filter((violation) => {
    if (severityFilter === "all") return true;
    return (violation.impact || "unknown") === severityFilter;
  });

  const topViolations = filteredViolations.slice(0, 12);

  return (
    <div className="w-full bg-black text-white">
      <DemoOne onLetsGo={goToScanSection} />

      <section
        id="scan-section"
        className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-24 lg:px-10"
      >
        <div className="rounded-3xl border border-zinc-700 bg-zinc-950/90 p-6 md:p-10 lg:p-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Start A Lumio Scan
          </h2>
          <p className="mt-2 text-sm text-zinc-400 md:text-base">
            Paste a URL. AI does not just score your site - it finds every WCAG
            violation, explains in plain English why it is broken, and generates
            the exact code fix for that specific element.
          </p>
          <p className="mt-2 text-xs text-zinc-500 md:text-sm">
            Not generic advice. "Line 47 of your homepage - this button has no
            ARIA label. Here is the fixed HTML."
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="h-12 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500 md:col-span-3"
            />
            <select
              value={maxPages}
              onChange={(event) => setMaxPages(Number(event.target.value))}
              className="h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-zinc-500"
              aria-label="Max pages to scan"
            >
              {PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} page{option > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={runScan}
              disabled={isLoading}
              className="h-12 rounded-lg border border-zinc-600 bg-white px-6 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Scanning..." : "Run Scan"}
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              type="text"
              value={repoPath}
              onChange={(event) => setRepoPath(event.target.value)}
              placeholder="Optional local repo path for file+line mapping"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-xs text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500 md:col-span-2"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportPdfReport}
                className="h-11 flex-1 rounded-lg border border-zinc-600 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900"
              >
                Export PDF report
              </button>
              <button
                type="button"
                onClick={openPrWithFixes}
                className="h-11 flex-1 rounded-lg border border-emerald-500/60 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
              >
                Open PR with fixes
              </button>
            </div>
          </div>

          {prDraftStatus ? (
            <p className="mt-3 text-xs text-zinc-400">{prDraftStatus}</p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
              <p className="font-semibold">
                Scan complete: {result.total_violations ?? 0} violations found.
              </p>
              <p className="mt-1 text-emerald-100/90">
                Pages scanned: {result.scanned_pages?.length ?? 0}
              </p>
            </div>
          ) : null}

          {result ? (
            <div className="mt-5 grid gap-4 md:grid-cols-5 responsive-grid">
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-5 md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Accessibility score
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {accessibilityScore}
                  <span className="ml-1 text-lg font-semibold text-zinc-400">
                    /100
                  </span>
                </p>
                <p className="mt-1 text-sm text-zinc-300">Grade {scoreGrade}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Developer focus: fix the queue below from top to bottom to
                  improve this score quickly.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
                <p className="text-xs text-zinc-400">Critical</p>
                <p className="mt-1 text-2xl font-bold text-red-400">
                  {severityCounts.critical}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
                <p className="text-xs text-zinc-400">Serious</p>
                <p className="mt-1 text-2xl font-bold text-orange-300">
                  {severityCounts.serious}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-5">
                <p className="text-xs text-zinc-400">Moderate + Minor</p>
                <p className="mt-1 text-2xl font-bold text-yellow-300">
                  {severityCounts.moderate + severityCounts.minor}
                </p>
              </div>
            </div>
          ) : null}

          {fixFirstQueue.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Fix-first queue
                </h3>
                <p className="text-xs text-zinc-500">
                  Start here for fastest impact
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {fixFirstQueue.map((violation, idx) => (
                  <div
                    key={`queue-${violation.id}-${idx}`}
                    className="rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                  >
                    <p className="text-sm text-zinc-100">
                      {idx + 1}. {violation.id} -{" "}
                      {violation.business_priority || "P3"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {violation.source?.file_path || "not mapped"}
                      {typeof violation.source?.line_number === "number"
                        ? `:${violation.source.line_number}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 responsive-two-col">
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Proof and prioritization
                </h3>
                <p className="mt-2 text-xs text-zinc-400">
                  Impact, affected users, severity, WCAG rule, and business
                  priority. Duplicate issues are grouped so teams know what to
                  fix first.
                </p>
                <div className="mt-3 space-y-3">
                  {topIssues.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No grouped issues yet.
                    </p>
                  ) : (
                    topIssues.map((issue, idx) => (
                      <div
                        key={`${issue.id}-${idx}`}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3"
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {issue.id} · {issue.business_priority || "P3"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {issue.description}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Severity: {issue.impact || "unknown"} | Occurrences:{" "}
                          {issue.total_occurrences || 0}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Continuous monitoring
                </h3>
                <p className="mt-2 text-xs text-zinc-400">
                  Scan staging and production, compare before and after, alert
                  only on new regressions, and maintain an accessibility
                  changelog.
                </p>
                <div className="mt-3 space-y-2 text-xs text-zinc-300">
                  <p>New regressions: {result.regressions?.new_issues ?? 0}</p>
                  <p>
                    Resolved issues: {result.regressions?.resolved_issues ?? 0}
                  </p>
                  <p>
                    Unchanged issues:{" "}
                    {result.regressions?.unchanged_issues ?? 0}
                  </p>
                </div>
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-xs font-semibold text-zinc-300">
                    Recent changelog
                  </p>
                  {(result.changelog || []).slice(0, 3).map((entry, idx) => (
                    <p
                      key={`${entry.scan_time}-${idx}`}
                      className="mt-1 text-xs text-zinc-500"
                    >
                      {new Date(entry.scan_time).toLocaleString()} - total{" "}
                      {entry.total_violations}, new {entry.new_issues}, resolved{" "}
                      {entry.resolved_issues}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {topViolations.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Developer-ready fixes
                </h3>
                <select
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                  className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none"
                >
                  <option value="all">All severities</option>
                  <option value="critical">Critical only</option>
                  <option value="serious">Serious only</option>
                  <option value="moderate">Moderate only</option>
                  <option value="minor">Minor only</option>
                </select>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Copy-paste patch for React, Next.js, or HTML with file + line
                mapping from your local repo path.
              </p>

              <div className="mt-4 space-y-3">
                {topViolations.map((violation, index) => (
                  <article
                    key={`${violation.id}-${index}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-100">
                        {violation.id}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {violation.business_priority || "P3"} |{" "}
                        {violation.impact || "unknown"}
                      </p>
                    </div>

                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="rounded-md border border-zinc-800 bg-black/30 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                          What is broken
                        </p>
                        <p className="mt-1 text-xs text-zinc-300">
                          {violation.description}
                        </p>
                      </div>
                      <div className="rounded-md border border-zinc-800 bg-black/30 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                          Why this matters
                        </p>
                        <p className="mt-1 text-xs text-zinc-300">
                          {violation.ai_explanation ||
                            "No explanation generated."}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-zinc-500">
                      File + line mapping:{" "}
                      {violation.source?.file_path || "not mapped"}
                      {typeof violation.source?.line_number === "number"
                        ? `:${violation.source.line_number}`
                        : ""}
                    </p>

                    {violation.wcag_tags?.length ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        WCAG: {violation.wcag_tags.join(", ")}
                      </p>
                    ) : null}

                    {violation.affected_users?.length ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Affected users: {violation.affected_users.join(", ")}
                      </p>
                    ) : null}

                    <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-zinc-800 bg-black p-3 text-[11px] leading-5 text-emerald-300">
                      {violation.patch?.code ||
                        violation.ai_fix ||
                        "No code fix generated."}
                    </pre>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyPatch(violation, index)}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-900"
                      >
                        {copiedPatchIndex === index ? "Copied" : "Copy patch"}
                      </button>

                      <button
                        type="button"
                        onClick={() => copyLocation(violation)}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-900"
                      >
                        Copy file + line
                      </button>

                      {violation.page_url ? (
                        <a
                          href={violation.page_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-zinc-400 underline decoration-zinc-600 underline-offset-2"
                        >
                          Open affected page
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default App;
