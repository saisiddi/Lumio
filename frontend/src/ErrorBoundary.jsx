import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Lumio frontend crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.page}>
          <div style={styles.card}>
            <div style={styles.eyebrow}>Lumio</div>
            <h1 style={styles.title}>Frontend failed to render</h1>
            <p style={styles.text}>
              The app hit a runtime error before it could finish loading. The error
              message is shown below so it does not fail as a blank white page.
            </p>
            <pre style={styles.code}>
              <code>{this.state.errorMessage || "Unknown frontend error"}</code>
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f8fafc",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  card: {
    width: "min(760px, 100%)",
    padding: "24px",
    borderRadius: "18px",
    border: "1px solid #fecaca",
    background: "#fff",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  },
  eyebrow: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: 700,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "16px",
  },
  title: {
    margin: "0 0 12px",
    color: "#111827",
  },
  text: {
    margin: "0 0 16px",
    color: "#475569",
    lineHeight: 1.6,
  },
  code: {
    margin: 0,
    padding: "14px",
    borderRadius: "14px",
    background: "#111827",
    color: "#e5e7eb",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
  },
};

export default ErrorBoundary;
