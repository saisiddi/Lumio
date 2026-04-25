export interface Issue {
  id: string;
  title: string;
  severity: "critical" | "moderate" | "minor";
  impact: string;
  description: string;
  suggestedFix: string;
  codeSnippet?: {
    current: string;
    fixed: string;
  };
  // New developer-ready fields
  file: string;
  lineNumber: number;
  elementDescription: string;
  wcagRule: string;
  affectedUsers: number;
  businessPriority: "critical" | "high" | "medium" | "low";
  isDuplicate?: boolean;
  duplicateCount?: number;
}

export interface ReportData {
  score: number;
  url: string;
  timestamp: string;
  passedChecks: number;
  totalChecks: number;
  issues: Issue[];
  aiSuggestions: string[];
}

export const mockReportData: ReportData = {
  score: 87,
  url: "https://example.com",
  timestamp: new Date().toISOString(),
  passedChecks: 42,
  totalChecks: 50,
  issues: [
    {
      id: "i1",
      title: "Missing alt text on images",
      severity: "critical",
      impact: "Screen reader users cannot understand the content of the image, leading to a loss of context and information.",
      description: "Multiple <img> tags are missing the 'alt' attribute.",
      suggestedFix: "Add descriptive 'alt' attributes to all images, or use alt=\"\" for decorative images.",
      codeSnippet: {
        current: "<img src=\"/hero-banner.jpg\" class=\"w-full\" />",
      file: "src/components/HeroSection.tsx",
      lineNumber: 47,
      elementDescription: "Hero banner image on landing page",
      wcagRule: "WCAG 2.1 Level A - 1.1.1 Non-text Content",
      affectedUsers: 1250,
      businessPriority: "critical",
      codeSnippet: {
        current: '<img src="/hero-banner.jpg" class="w-full" />',
        fixed:
          '<img src="/hero-banner.jpg" alt="Smiling team working in office" class="w-full" />',
      },
    },
    {
      id: "i2",
      title: "Low contrast ratio on primary button",
      severity: "critical",
      impact:
        "Users with low vision or color blindness may struggle to read the text.",
      description:
        "Button text has a contrast ratio of 3.2:1, which is below the minimum 4.5:1 requirement for normal text.",
      suggestedFix:
        "Increase the contrast between the text color and background color.",
      file: "src/components/ui/GlowingButton.tsx",
      lineNumber: 12,
      elementDescription: "Primary CTA button - 'Scan URL'",
      wcagRule: "WCAG 2.1 Level AA - 1.4.3 Contrast (Minimum)",
      affectedUsers: 890,
      businessPriority: "critical",
      codeSnippet: {
        current: '<button class="bg-gradient-to-r from-brand-electric/60 text-white">',
        fixed: '<button class="bg-gradient-to-r from-brand-electric text-white">',
      },
    },
    {
      id: "i3",
      title: "Missing form labels",
      severity: "moderate",
      impact:
        "Screen readers will not announce the purpose of the input field properly.",
      description:
        "An input field does not have an associated <label> or aria-label.",
      suggestedFix:
        "Wrap the input in a <label> or add an 'aria-label' attribute.",
      file: "src/components/URLAnalyzerInput.tsx",
      lineNumber: 31,
      elementDescription: "URL input field - search box",
      wcagRule: "WCAG 2.1 Level A - 1.3.1 Info and Relationships",
      affectedUsers: 520,
      businessPriority: "high",
      codeSnippet: {
        current: '<input type="url" placeholder="https://example.com" />',
        fixed:
          '<input type="url" placeholder="https://example.com" aria-label="Enter website URL to scan" />',
      },
    },
    {
      id: "i4",
      title: "Missing focus indicator on interactive elements",
      severity: "critical",
      impact:
        "Keyboard-only users cannot see where focus is currently positioned.",
      description:
        "Several interactive elements do not have visible focus outlines when navigated via keyboard.",
      suggestedFix:
        "Add focus:outline-2 focus:outline-brand-electric CSS to all interactive elements.",
      file: "src/app/globals.css",
      lineNumber: 67,
      elementDescription: "Navigation links and buttons throughout site",
      wcagRule: "WCAG 2.1 Level AA - 2.4.7 Focus Visible",
      affectedUsers: 340,
      businessPriority: "critical",
      isDuplicate: true,
      duplicateCount: 8,
      codeSnippet: {
        current: "button { background: blue; }",
        fixed:
          "button { background: blue; }\nbutton:focus { outline: 2px solid #2f72eb; outline-offset: 2px; }",
      },
    },
    {
      id: "i5",
      title: "Missing ARIA landmarks",
      severity: "moderate",
      impact:
        "Screen reader users cannot efficiently navigate the page structure.",
      description: "Main content area lacks proper landmark roles.",
      suggestedFix:
        'Add role="main" to primary content and role="navigation" to navbar.',
      file: "src/components/Navbar.tsx",
      lineNumber: 8,
      elementDescription: "Navigation bar component",
      wcagRule: "WCAG 2.1 Level A - 1.3.1 Info and Relationships",
      affectedUsers: 420,
      businessPriority: "medium",
      codeSnippet: {
        current: '<nav className="flex items-center">',
        fixed:
          '<nav className="flex items-center" role="navigation" aria-label="Main navigation">',
      },
    },
  ],
  aiSuggestions: [
    "I noticed you have 3 images missing alt text on the landing page. Quick fix: these are all above-the-fold, so they're high priority for your users.",
    "Your primary button's color contrast fails at 3.2:1 — I've generated a patch that gets you to 5.1:1 without changing your design.",
    "Consider grouping your 8 focus indicator issues into one CSS utility — I can generate a Tailwind config update that fixes all of them at once