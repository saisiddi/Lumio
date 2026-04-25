import { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const cardBase = {
  background: "rgba(255,255,255,0.9)",
  border: "1px solid #d9e2f2",
  borderRadius: "20px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

function App() {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleScan = async () => {
    if (!url.trim()) {
      setError("Paste a URL first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/scan`, {
        url: url.trim(),
        max_pages: Number(maxPages),
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Scan failed.");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    window.print();
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroCopy}>
            <div style={styles.eyebrow}>Lumio</div>
            <h1 style={styles.title}>
              Paste a URL. Get exact accessibility fixes, mapped back to real code.
            </h1>
            <p style={styles.subtitle}>
              Lumio scans multiple pages, groups duplicate WCAG issues, explains impact in plain English,
              suggests developer-ready patches, compares regressions with the last scan, and prints a report
              your team can save as PDF.
            </p>
          </div>

          <div style={styles.formCard}>
            <label style={styles.label}>Website URL</label>
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              style={styles.input}
            />

            <label style={styles.label}>Pages to scan</label>
            <select
              value={maxPages}
              onChange={(event) => setMaxPages(event.target.value)}
              style={styles.input}
            >
              <option value={1}>1 page</option>
              <option value={3}>3 pages</option>
              <option value={5}>5 pages</option>
            </select>

            <div style={styles.actions}>
              <button onClick={handleScan} disabled={loading} style={styles.primaryButton}>
                {loading ? "Scanning..." : "Run scan"}
              </button>
              <button
                onClick={exportReport}
                type="button"
                style={styles.secondaryButton}
                disabled={!result}
              >
                Export PDF report
              </button>
            </div>

            {error && <p style={styles.error}>{error}</p>}
          </div>
        </section>

        {result && (
          <main id="report-root" style={styles.report}>
            <section style={styles.summaryGrid}>
              <SummaryCard
                title="Detected issues"
                value={result.total_violations}
                detail={`${result.scanned_pages.length} pages scanned`}
              />
              <SummaryCard
                title="New regressions"
                value={result.regressions.new_issues}
                detail={
                  result.regressions.previous_scan_time
                    ? `Compared with ${new Date(result.regressions.previous_scan_time).toLocaleString()}`
                    : "No previous baseline yet"
                }
              />
              <SummaryCard
                title="Resolved issues"
                value={result.regressions.resolved_issues}
                detail={`${result.regressions.unchanged_issues} unchanged`}
              />
              <SummaryCard
                title="Priority mix"
                value={`${result.severity_counts.serious || 0} serious`}
                detail={`${result.severity_counts.moderate || 0} moderate, ${result.severity_counts.minor || 0} minor`}
              />
            </section>

            <section style={styles.panel}>
              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Proof and prioritization</h2>
                  <p style={styles.sectionSubtle}>
                    Lumio groups duplicate issues across pages and helps teams fix the highest-value problems first.
                  </p>
                </div>
              </div>

              <div style={styles.groupList}>
                {(result.grouped_issues || []).map((group) => (
                  <article key={group.key} style={styles.groupCard}>
                    <div style={styles.groupTopline}>
                      <span style={styles.priorityBadge(group.business_priority)}>
                        {group.business_priority || "P3"}
                      </span>
                      <span style={styles.impactBadge(group.impact)}>{group.impact || "unknown"}</span>
                    </div>
                    <h3 style={styles.groupTitle}>{group.id}</h3>
                    <p style={styles.groupDescription}>{group.description}</p>
                    <p style={styles.metaLine}>
                      <strong>Occurrences:</strong> {group.total_occurrences} across {group.pages.length} pages
                    </p>
                    <p style={styles.metaLine}>
                      <strong>Affected users:</strong> {(group.affected_users || []).join(", ")}
                    </p>
                    <p style={styles.metaLine}>
                      <strong>WCAG tags:</strong> {(group.wcag_tags || []).join(", ") || "Not mapped"}
                    </p>
                    {!!group.pages?.length && (
                      <p style={styles.metaLine}>
                        <strong>Pages:</strong> {group.pages.join(" | ")}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Monitoring and changelog</h2>
              <div style={styles.changelogGrid}>
                {(result.changelog || []).map((entry) => (
                  <article key={entry.scan_time} style={styles.changelogCard}>
                    <div style={styles.changelogDate}>{new Date(entry.scan_time).toLocaleString()}</div>
                    <div style={styles.changelogNumbers}>
                      <span>{entry.total_violations} issues</span>
                      <span>{entry.new_issues} new</span>
                      <span>{entry.resolved_issues} resolved</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>Developer-ready fixes</h2>
              <div style={styles.violationList}>
                {(result.violations || []).map((violation, index) => (
                  <article key={`${violation.page_url}-${violation.id}-${index}`} style={styles.violationCard}>
                    <div style={styles.violationHeader}>
                      <div>
                        <div style={styles.violationTopline}>
                          <span style={styles.priorityBadge(violation.business_priority)}>
                            {violation.business_priority}
                          </span>
                          <span style={styles.impactBadge(violation.impact)}>{violation.impact || "unknown"}</span>
                          <span style={styles.countBadge}>
                            {violation.duplicate_occurrences} occurrence
                            {violation.duplicate_occurrences > 1 ? "s" : ""}
                          </span>
                        </div>
                        <h3 style={styles.violationTitle}>{violation.id}</h3>
                      </div>
                      <div style={styles.scoreCard}>
                        <div style={styles.scoreLabel}>Priority score</div>
                        <div style={styles.scoreValue}>{violation.priority_score}</div>
                      </div>
                    </div>

                    <p style={styles.metaLine}>
                      <strong>Page:</strong> {violation.page_title || "Untitled"}{" "}
                      {violation.page_url ? `(${violation.page_url})` : ""}
                    </p>
                    <p style={styles.metaLine}>
                      <strong>Description:</strong> {violation.description}
                    </p>
                    <p style={styles.metaLine}>
                      <strong>Affected users:</strong> {(violation.affected_users || []).join(", ")}
                    </p>
                    <p style={styles.metaLine}>
                      <strong>WCAG tags:</strong> {(violation.wcag_tags || []).join(", ") || "Not mapped"}
                    </p>
                    {!!violation.target?.length && (
                      <p style={styles.metaLine}>
                        <strong>Selector:</strong> <code>{violation.target.join(", ")}</code>
                      </p>
                    )}
                    {!!violation.source?.file_path && (
                      <p style={styles.metaLine}>
                        <strong>Source location:</strong> {violation.source.file_path}
                        {violation.source.line_number ? `:${violation.source.line_number}` : ""}
                        {violation.source.framework ? ` • ${violation.source.framework}` : ""}
                        {typeof violation.source.confidence === "number"
                          ? ` • ${Math.round(violation.source.confidence * 100)}% confidence`
                          : ""}
                      </p>
                    )}

                    <div style={styles.detailGrid}>
                      <DetailBlock title="Why it is broken" content={violation.ai_explanation} />
                      <DetailBlock title="Who it affects" content={violation.ai_impact} />
                    </div>

                    <CodePanel title="Offending HTML" code={violation.element_html} language="html" />
                    <CodePanel title="Axe failure details" code={violation.failure_summary} muted />
                    <CodePanel title="Suggested fix" code={violation.ai_fix} language="html" />
                    <CodePanel
                      title={`${violation.patch?.language?.toUpperCase() || "CODE"} patch`}
                      code={violation.patch?.code}
                      language={violation.patch?.language}
                    />
                    <CodePanel title="Mapped source snippet" code={violation.source?.snippet} language={violation.patch?.language} />

                    <div style={styles.prMeta}>
                      <p style={styles.metaLine}>
                        <strong>Commit message:</strong> {violation.patch?.commit_message || "Not available"}
                      </p>
                      <p style={styles.metaLine}>
                        <strong>PR summary:</strong> {violation.patch?.pr_summary || "Not available"}
                      </p>
                      {!!violation.help_url && (
                        <a href={violation.help_url} target="_blank" rel="noreferrer" style={styles.link}>
                          Open WCAG / axe help
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, detail }) {
  return (
    <article style={styles.summaryCard}>
      <div style={styles.summaryTitle}>{title}</div>
      <div style={styles.summaryValue}>{value}</div>
      <div style={styles.summaryDetail}>{detail}</div>
    </article>
  );
}

function DetailBlock({ title, content }) {
  return (
    <div style={styles.detailBlock}>
      <div style={styles.detailTitle}>{title}</div>
      <p style={styles.detailText}>{content || "No detail available."}</p>
    </div>
  );
}

function CodePanel({ title, code, language, muted = false }) {
  if (!code) {
    return null;
  }

  return (
    <section style={styles.codePanel(muted)}>
      <div style={styles.codeTitle}>
        <span>{title}</span>
        {language && <span style={styles.codeLanguage}>{language}</span>}
      </div>
      <pre style={styles.codeBlock(muted)}>
        <code>{code}</code>
      </pre>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(191,219,254,0.9) 0%, rgba(239,246,255,0.95) 38%, #f8fafc 100%)",
    color: "#14213d",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  shell: {
    width: "min(1240px, 100%)",
    margin: "0 auto",
    padding: "32px 20px 64px",
    boxSizing: "border-box",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    gap: "20px",
    alignItems: "stretch",
    marginBottom: "24px",
  },
  heroCopy: {
    ...cardBase,
    padding: "32px",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(239,246,255,0.88))",
  },
  eyebrow: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: "12px",
    marginBottom: "16px",
  },
  title: {
    margin: "0 0 16px",
    fontSize: "clamp(2.4rem, 4vw, 4.3rem)",
    lineHeight: 0.95,
    letterSpacing: "-0.06em",
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "1.06rem",
    lineHeight: 1.7,
    maxWidth: "720px",
  },
  formCard: {
    ...cardBase,
    padding: "24px",
    display: "grid",
    gap: "10px",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    fontSize: "1rem",
    outline: "none",
    background: "#fff",
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: 0,
    borderRadius: "14px",
    background: "#0f172a",
    color: "#fff",
    padding: "13px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#fff",
    color: "#0f172a",
    padding: "13px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    margin: "6px 0 0",
    color: "#b91c1c",
    fontWeight: 600,
  },
  report: {
    display: "grid",
    gap: "20px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
  },
  summaryCard: {
    ...cardBase,
    padding: "18px",
  },
  summaryTitle: {
    fontSize: "0.88rem",
    color: "#475569",
    marginBottom: "10px",
    fontWeight: 700,
  },
  summaryValue: {
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-0.05em",
  },
  summaryDetail: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "0.92rem",
  },
  panel: {
    ...cardBase,
    padding: "22px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "1.35rem",
  },
  sectionSubtle: {
    margin: 0,
    color: "#64748b",
  },
  groupList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  groupCard: {
    border: "1px solid #dbe4f0",
    borderRadius: "18px",
    padding: "16px",
    background: "#fff",
  },
  groupTopline: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  groupTitle: {
    margin: "0 0 6px",
    fontSize: "1.05rem",
  },
  groupDescription: {
    margin: "0 0 12px",
    color: "#475569",
    lineHeight: 1.5,
  },
  metaLine: {
    margin: "0 0 8px",
    color: "#334155",
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
  changelogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  changelogCard: {
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #dbe4f0",
    background: "#fff",
  },
  changelogDate: {
    fontWeight: 700,
    marginBottom: "10px",
  },
  changelogNumbers: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    color: "#475569",
  },
  violationList: {
    display: "grid",
    gap: "18px",
  },
  violationCard: {
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #dbe4f0",
    background: "#fff",
  },
  violationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  violationTopline: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
  },
  violationTitle: {
    margin: 0,
    fontSize: "1.15rem",
  },
  scoreCard: {
    minWidth: "110px",
    padding: "12px",
    borderRadius: "16px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    textAlign: "center",
  },
  scoreLabel: {
    fontSize: "0.76rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1d4ed8",
    fontWeight: 700,
  },
  scoreValue: {
    fontSize: "1.7rem",
    fontWeight: 800,
    marginTop: "4px",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    margin: "16px 0",
  },
  detailBlock: {
    padding: "14px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  detailTitle: {
    fontSize: "0.85rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#0f172a",
    marginBottom: "8px",
  },
  detailText: {
    margin: 0,
    lineHeight: 1.6,
    color: "#334155",
  },
  codePanel: (muted) => ({
    marginTop: "14px",
    borderRadius: "16px",
    border: muted ? "1px solid #e2e8f0" : "1px solid #cbd5e1",
    overflow: "hidden",
  }),
  codeTitle: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    padding: "12px 14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 700,
  },
  codeLanguage: {
    color: "#64748b",
    textTransform: "uppercase",
    fontSize: "0.78rem",
    letterSpacing: "0.08em",
  },
  codeBlock: (muted) => ({
    margin: 0,
    padding: "14px",
    background: muted ? "#fff" : "#0f172a",
    color: muted ? "#334155" : "#e2e8f0",
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    fontSize: "0.92rem",
  }),
  prMeta: {
    marginTop: "14px",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 700,
  },
  countBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#f8fafc",
    border: "1px solid #dbe4f0",
    color: "#334155",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  impactBadge: (impact) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background:
      impact === "serious"
        ? "#fee2e2"
        : impact === "moderate"
          ? "#fef3c7"
          : impact === "critical"
            ? "#fecaca"
            : "#e2e8f0",
    color:
      impact === "serious" || impact === "critical"
        ? "#991b1b"
        : impact === "moderate"
          ? "#92400e"
          : "#334155",
    fontSize: "0.82rem",
    fontWeight: 700,
    textTransform: "capitalize",
  }),
  priorityBadge: (priority) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: priority === "P0" || priority === "P1" ? "#dbeafe" : "#eef2ff",
    color: priority === "P0" || priority === "P1" ? "#1d4ed8" : "#4338ca",
    fontSize: "0.82rem",
    fontWeight: 800,
  }),
};

export default App;
