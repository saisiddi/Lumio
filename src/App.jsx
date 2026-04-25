import { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleScan = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post("http://localhost:8000/scan", {
        url: url.trim(),
      });
      setResult(response.data);
    } catch (_err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Lumio Scanner</h1>

        <div style={styles.controls}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL (https://example.com)"
            style={styles.input}
          />
          <button onClick={handleScan} disabled={loading} style={styles.button}>
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <section style={styles.results}>
            <h2 style={styles.sectionTitle}>Results</h2>
            <p>
              <strong>Total Violations:</strong> {result.total_violations}
            </p>

            <div style={styles.countsBox}>
              <h3 style={styles.subTitle}>Severity Counts</h3>
              <ul style={styles.list}>
                {Object.entries(result.severity_counts || {}).map(
                  ([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h3 style={styles.subTitle}>Violations</h3>
              {(result.violations || []).map((v, index) => (
                <article key={`${v.id}-${index}`} style={styles.violationCard}>
                  <p>
                    <strong>ID:</strong> {v.id}
                  </p>
                  <p>
                    <strong>Impact:</strong> {v.impact || "N/A"}
                  </p>
                  <p>
                    <strong>Description:</strong> {v.description}
                  </p>
                  <p>
                    <strong>AI Explanation:</strong> {v.ai_explanation}
                  </p>
                  <p>
                    <strong>AI Impact:</strong> {v.ai_impact}
                  </p>
                  <div>
                    <strong>AI Fix:</strong>
                    <pre style={styles.codeBlock}>
                      <code>{v.ai_fix}</code>
                    </pre>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    background: "#f5f7fb",
  },
  card: {
    width: "100%",
    maxWidth: "900px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
  },
  title: {
    marginTop: 0,
    marginBottom: "16px",
    textAlign: "center",
  },
  controls: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "14px",
  },
  input: {
    flex: 1,
    maxWidth: "620px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    color: "#b91c1c",
    textAlign: "center",
  },
  results: {
    marginTop: "16px",
  },
  sectionTitle: {
    marginBottom: "10px",
  },
  subTitle: {
    marginBottom: "6px",
  },
  countsBox: {
    marginBottom: "16px",
    padding: "10px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fafafa",
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
  },
  violationCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "10px",
    background: "#fff",
  },
  codeBlock: {
    marginTop: "6px",
    padding: "10px",
    background: "#0f172a",
    color: "#e2e8f0",
    borderRadius: "8px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
  },
};

export default App;
