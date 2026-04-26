import jsPDF from "jspdf";

interface Issue {
  id?: string;
  title: string;
  severity: string;
  suggestedFix: string;
  impact: string;
  wcagRule: string;
  businessPriority: string;
  file?: string;
  lineNumber?: number;
  codeSnippet?: { current?: string; fixed?: string };
  isDuplicate?: boolean;
  duplicateCount?: number;
}

interface ReportData {
  url?: string;
  score?: number;
  timestamp?: string;
  issues?: Issue[];
  passedChecks?: number;
}

// ─── Colors ────────────────────────────────────────────────────────────
const C = {
  brand: [37, 99, 235] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  midnight: [2, 8, 23] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  text: [51, 65, 85] as [number, number, number],
  heading: [15, 23, 42] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  redBg: [254, 226, 226] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  amberBg: [254, 243, 199] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  blueBg: [219, 234, 254] as [number, number, number],
  green: [5, 150, 105] as [number, number, number],
  codeBg: [24, 24, 30] as [number, number, number],
  codeRed: [252, 165, 165] as [number, number, number],
  codeGreen: [110, 231, 183] as [number, number, number],
};

const SEVERITY_MAP: Record<string, { color: [number, number, number]; bg: [number, number, number]; label: string }> = {
  critical: { color: C.red, bg: C.redBg, label: "CRITICAL" },
  moderate: { color: C.amber, bg: C.amberBg, label: "MODERATE" },
  minor: { color: C.blue, bg: C.blueBg, label: "MINOR" },
};

// ─── PDF Helper Class ──────────────────────────────────────────────────
class PDFBuilder {
  doc: jsPDF;
  y: number;
  margin: number;
  pageW: number;
  pageH: number;
  contentW: number;

  constructor() {
    this.doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.y = 0;
    this.margin = 18;
    this.pageW = 210;
    this.pageH = 297;
    this.contentW = this.pageW - this.margin * 2;
  }

  // Check remaining space — add new page if needed
  ensureSpace(needed: number) {
    if (this.y + needed > this.pageH - 20) {
      this.doc.addPage();
      this.y = 12;
      // Blue accent bar at top of continuation pages
      this.doc.setFillColor(...C.brand);
      this.doc.rect(0, 0, this.pageW, 1.5, "F");
      // Page number
      this.doc.setFontSize(7);
      this.doc.setTextColor(...C.muted);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(
        `Page ${this.doc.getNumberOfPages()}`,
        this.pageW - this.margin,
        this.pageH - 8,
        { align: "right" }
      );
      this.y = 16;
    }
  }

  // Print text and return new Y position
  wrapText(text: string, x: number, maxW: number, fontSize: number, color: [number, number, number], style: string = "normal", lineH: number = 4.5): number {
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);
    this.doc.setFont("helvetica", style);
    const lines: string[] = this.doc.splitTextToSize(text, maxW);
    lines.forEach((line: string, i: number) => {
      if (this.y > this.pageH - 15) {
        this.ensureSpace(20);
      }
      this.doc.text(line, x, this.y);
      if (i < lines.length - 1) this.y += lineH;
    });
    this.y += lineH;
    return this.y;
  }

  // Draw a rounded rectangle
  roundedBox(x: number, w: number, h: number, fill: [number, number, number], border?: [number, number, number], radius = 2) {
    this.doc.setFillColor(...fill);
    this.doc.roundedRect(x, this.y, w, h, radius, radius, "F");
    if (border) {
      this.doc.setDrawColor(...border);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(x, this.y, w, h, radius, radius, "S");
    }
  }

  // Draw a badge (small rounded pill with text)
  badge(x: number, text: string, bg: [number, number, number], fg: [number, number, number], w = 22) {
    this.doc.setFillColor(...bg);
    this.doc.roundedRect(x, this.y, w, 6, 2, 2, "F");
    this.doc.setTextColor(...fg);
    this.doc.setFontSize(6.5);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(text, x + w / 2, this.y + 4, { align: "center" });
  }

  // Horizontal divider
  divider() {
    this.y += 3;
    this.doc.setDrawColor(...C.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);
    this.y += 6;
  }

  // Section label (small blue heading)
  sectionLabel(text: string) {
    this.doc.setTextColor(...C.brand);
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(text, this.margin + 1, this.y);
    this.y += 5;
  }

  // Code block
  codeBlock(code: string, headerText: string, headerBg: [number, number, number], codeColor: [number, number, number]) {
    const lines: string[] = this.doc.splitTextToSize(code, this.contentW - 10);
    const blockH = lines.length * 4 + 6;
    const totalH = 7 + blockH;

    this.ensureSpace(totalH + 4);

    // Header bar
    this.doc.setFillColor(...headerBg);
    this.doc.roundedRect(this.margin, this.y, this.contentW, 6, 1.5, 1.5, "F");
    this.doc.setTextColor(...C.white);
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(headerText, this.margin + 4, this.y + 4);
    this.y += 7;

    // Code body
    this.doc.setFillColor(...C.codeBg);
    this.doc.roundedRect(this.margin, this.y, this.contentW, blockH, 1.5, 1.5, "F");
    this.doc.setTextColor(...codeColor);
    this.doc.setFontSize(7.5);
    this.doc.setFont("courier", "normal");
    lines.forEach((line: string, i: number) => {
      this.doc.text(line, this.margin + 5, this.y + 5 + i * 4);
    });
    this.y += blockH + 4;
  }
}

// ─── Main Export Function ──────────────────────────────────────────────
export function generateAccessibilityPDF(reportData: ReportData, scannedUrl: string) {
  const pdf = new PDFBuilder();
  const { doc } = pdf;
  const issues = reportData.issues || [];
  const score = reportData.score ?? 0;
  const url = reportData.url || scannedUrl;
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const moderateCount = issues.filter((i) => i.severity === "moderate").length;
  const minorCount = issues.filter((i) => i.severity === "minor").length;
  const dateStr = reportData.timestamp
    ? new Date(reportData.timestamp).toLocaleString()
    : new Date().toLocaleString();

  // ════════════════════════════════════════════════════════════════════
  // PAGE 1: COVER
  // ════════════════════════════════════════════════════════════════════

  // Dark header block
  doc.setFillColor(...C.midnight);
  doc.rect(0, 0, pdf.pageW, 58, "F");
  doc.setFillColor(...C.brand);
  doc.rect(0, 58, pdf.pageW, 2, "F");

  // Title
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Accessibility Scan Report", pdf.margin, 28);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 175, 200);
  doc.text("Powered by Lumio AI  •  WCAG Compliance Analysis", pdf.margin, 38);
  doc.text(dateStr, pdf.margin, 46);

  // ── URL box ──
  pdf.y = 70;
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(pdf.margin, pdf.y, pdf.contentW, 12, 3, 3, "FD");
  doc.setTextColor(...C.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("SCANNED URL", pdf.margin + 5, pdf.y + 4.5);
  doc.setTextColor(...C.brand);
  doc.setFontSize(10);
  doc.text(url, pdf.margin + 5, pdf.y + 10);
  pdf.y += 20;

  // ── Score cards (4 boxes in a row) ──
  const boxW = (pdf.contentW - 12) / 4;
  const boxH = 24;

  const cards = [
    { label: "Score", value: `${score}`, color: score >= 90 ? C.green : score >= 70 ? C.amber : C.red, bg: C.white },
    { label: "Critical", value: `${criticalCount}`, color: C.red, bg: C.redBg },
    { label: "Moderate", value: `${moderateCount}`, color: C.amber, bg: C.amberBg },
    { label: "Minor", value: `${minorCount}`, color: C.blue, bg: C.blueBg },
  ];

  cards.forEach((card, i) => {
    const x = pdf.margin + i * (boxW + 4);
    doc.setFillColor(...card.bg);
    doc.setDrawColor(...C.border);
    doc.roundedRect(x, pdf.y, boxW, boxH, 3, 3, "FD");
    doc.setTextColor(...card.color);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + boxW / 2, pdf.y + 12, { align: "center" });
    doc.setTextColor(...C.muted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + boxW / 2, pdf.y + 19, { align: "center" });
  });
  pdf.y += boxH + 10;

  // ── Summary paragraph ──
  pdf.wrapText(
    `This report identified ${issues.length} accessibility issue(s) on ${url}. Each issue below includes a clear explanation, who is affected, and the exact code fix.`,
    pdf.margin,
    pdf.contentW,
    9,
    C.text,
    "normal",
    4.5
  );

  pdf.y += 2;
  pdf.divider();

  // ── Issues & Fixes heading ──
  doc.setTextColor(...C.heading);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Issues & Fixes", pdf.margin, pdf.y);
  pdf.y += 10;

  // ════════════════════════════════════════════════════════════════════
  // EACH ISSUE
  // ════════════════════════════════════════════════════════════════════
  issues.forEach((issue, idx) => {
    const sev = SEVERITY_MAP[issue.severity] || SEVERITY_MAP.minor;

    // Need at least 70mm for a new issue card
    pdf.ensureSpace(70);

    // ── Issue card background ──
    doc.setFillColor(...C.bg);
    doc.setDrawColor(...C.border);
    // We'll draw a left-accent border
    doc.setFillColor(...sev.color);
    doc.rect(pdf.margin, pdf.y, 1.5, 6, "F");

    // ── Badges row ──
    const badgeY = pdf.y;

    // Number badge
    pdf.badge(pdf.margin + 4, `#${idx + 1} of ${issues.length}`, C.dark, C.white, 22);

    // Severity badge
    pdf.badge(pdf.margin + 28, sev.label, sev.color, C.white, 20);

    // WCAG badge
    if (issue.wcagRule) {
      pdf.badge(pdf.margin + 50, issue.wcagRule, C.bg, C.text, 18);
    }

    // Priority
    if (issue.businessPriority) {
      doc.setTextColor(...C.muted);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(`${issue.businessPriority} priority`, pdf.margin + 72, pdf.y + 4);
    }

    pdf.y += 11;

    // ── Title ──
    pdf.wrapText(issue.title, pdf.margin, pdf.contentW, 11, C.heading, "bold", 5.5);
    pdf.y += 1;

    // ── Description ──
    pdf.wrapText(issue.suggestedFix, pdf.margin, pdf.contentW, 8.5, C.text, "normal", 4.2);
    pdf.y += 4;

    // ── Who is affected ──
    if (issue.impact) {
      pdf.ensureSpace(20);
      pdf.sectionLabel("👥  WHO IS AFFECTED");
      pdf.wrapText(issue.impact, pdf.margin + 1, pdf.contentW - 2, 8, C.text, "normal", 4);
      pdf.y += 4;
    }

    // ── How to fix ──
    pdf.ensureSpace(15);
    pdf.sectionLabel("🔧  HOW TO FIX");

    let step = 1;

    // Step: Open file
    if (issue.file && issue.file !== "Unknown file") {
      const lineInfo = issue.lineNumber && issue.lineNumber > 0 ? ` at line ${issue.lineNumber}` : "";
      pdf.wrapText(`${step}. Open file: ${issue.file}${lineInfo}`, pdf.margin + 2, pdf.contentW - 4, 8.5, C.heading, "normal", 4.2);
      pdf.y += 1;
      step++;
    }

    // Step: Find code
    pdf.wrapText(`${step}. Find this code in your file and replace it:`, pdf.margin + 2, pdf.contentW - 4, 8.5, C.heading, "normal", 4.2);
    pdf.y += 3;
    step++;

    // ── Code: BEFORE ──
    if (issue.codeSnippet?.current) {
      pdf.codeBlock(
        issue.codeSnippet.current,
        "✕  BEFORE (broken)",
        C.red,
        C.codeRed
      );
    }

    // ── Code: AFTER ──
    if (issue.codeSnippet?.fixed) {
      pdf.codeBlock(
        issue.codeSnippet.fixed,
        "✓  AFTER (copy this fix)",
        C.green,
        C.codeGreen
      );
    }

    // ── Final step ──
    pdf.ensureSpace(10);
    pdf.wrapText(
      `${step}. Save the file and refresh your browser to verify the fix.`,
      pdf.margin + 2,
      pdf.contentW - 4,
      8.5,
      C.heading,
      "normal",
      4.2
    );

    // ── Card divider ──
    pdf.y += 2;
    pdf.divider();
    pdf.y += 2;
  });

  // ════════════════════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════════════════════
  pdf.ensureSpace(25);
  pdf.y += 4;
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.border);
  doc.roundedRect(pdf.margin, pdf.y, pdf.contentW, 16, 3, 3, "FD");
  doc.setTextColor(...C.muted);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Generated by Lumio AI — Accessibility Intelligence Platform", pdf.margin + 5, pdf.y + 6);
  doc.text(
    `${dateStr}  |  ${issues.length} issues  |  Score: ${score}/100`,
    pdf.margin + 5,
    pdf.y + 12
  );

  // ── Page numbers on all pages ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${p} of ${totalPages}`, pdf.pageW - pdf.margin, pdf.pageH - 8, { align: "right" });
    doc.text("Lumio AI", pdf.margin, pdf.pageH - 8);
  }

  // ── Download ──
  const filename = `lumio-accessibility-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
