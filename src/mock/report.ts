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
        fixed: "<img src=\"/hero-banner.jpg\" alt=\"Smiling team working in office\" class=\"w-full\" />"
      }
    },
    {
      id: "i2",
      title: "Low contrast ratio",
      severity: "critical",
      impact: "Users with low vision or color blindness may struggle to read the text.",
      description: "Text element has a contrast ratio of 3.2:1, which is below the minimum 4.5:1 requirement for normal text.",
      suggestedFix: "Increase the contrast between the text color and background color.",
      codeSnippet: {
        current: "<p class=\"text-gray-400 bg-white\">Subtle description</p>",
        fixed: "<p class=\"text-gray-700 bg-white\">Subtle description</p>"
      }
    },
    {
      id: "i3",
      title: "Missing form labels",
      severity: "moderate",
      impact: "Screen readers will not announce the purpose of the input field properly.",
      description: "An input field does not have an associated <label> or aria-label.",
      suggestedFix: "Wrap the input in a <label> or add an 'aria-label' attribute.",
      codeSnippet: {
        current: "<input type=\"text\" placeholder=\"Search...\" />",
        fixed: "<input type=\"text\" placeholder=\"Search...\" aria-label=\"Search site content\" />"
      }
    },
    {
      id: "i4",
      title: "Keyboard trap",
      severity: "critical",
      impact: "Keyboard-only users become stuck in a component and cannot navigate the rest of the page.",
      description: "A custom modal dialog does not trap focus correctly, or prevents escaping via the Esc key.",
      suggestedFix: "Implement proper focus management for the modal.",
    }
  ],
  aiSuggestions: [
    "I noticed you have 3 images missing alt text. I've generated context-aware descriptions for them.",
    "Your primary button color (#8B5CF6) needs a slightly darker shade to pass AAA contrast on white backgrounds.",
    "Consider adding 'aria-expanded' to your mobile menu toggle for better screen reader support."
  ]
};
