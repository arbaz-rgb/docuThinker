import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { generateInterviewMode } from "../../services/ai.service";

const InterviewModePage = () => {
  const { documentId } = useParams();
  const [result, setResult] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [model, setModel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInterviewMode = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await generateInterviewMode(documentId);
      setResult(data.result);
      setDocumentTitle(data.document?.title || "");
      setModel(data.model || "");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate interview mode."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterviewMode();
  }, [documentId]);

  return (
    <section className="interview-page">
      <div className="interview-header">
        <div>
          <p className="section-label">Practice</p>
          <h2>Interview Mode</h2>
          <p className="muted">Selected document: {documentTitle || documentId}</p>
        </div>
        <button className="secondary-button" type="button" onClick={loadInterviewMode} disabled={isLoading}>
          {isLoading ? "Generating..." : "Regenerate"}
        </button>
      </div>

      <div className="interview-hero panel">
        <div>
          <p className="section-label">Document grounded</p>
          <h3>Likely questions, answer points, follow-ups, and revision topics.</h3>
        </div>
        <div className="interview-hero-copy">
          <span className="tag">Interview prep</span>
          {model ? <span className="tag">{model}</span> : null}
        </div>
      </div>

      {error ? <div className="status-alert error">{error}</div> : null}

      <section className="panel generated-panel">
        {isLoading ? (
          <div className="empty-state">Generating interview preparation from the document...</div>
        ) : (
          <pre className="generated-output">{result}</pre>
        )}
      </section>
    </section>
  );
};

export default InterviewModePage;
