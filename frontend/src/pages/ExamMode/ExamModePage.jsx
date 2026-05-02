import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { generateExamMode } from "../../services/ai.service";

const ExamModePage = () => {
  const { documentId } = useParams();
  const [result, setResult] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExamMode = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await generateExamMode(documentId);
      setResult(data.result);
      setDocumentTitle(data.document?.title || "");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate exam mode."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExamMode();
  }, [documentId]);

  return (
    <section className="exam-page">
      <div className="exam-header">
        <div>
          <p className="section-label">Study</p>
          <h2>Exam Mode</h2>
          <p className="muted">Selected document: {documentTitle || documentId}</p>
        </div>
        <div className="exam-meta">
          <span className="tag">MCQs</span>
          <span className="tag">Short answers</span>
          <span className="tag">Long answers</span>
        </div>
      </div>

      <section className="panel exam-panel generated-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Generated pack</p>
            <h3>Exam preparation</h3>
          </div>
          <button className="secondary-button" type="button" onClick={loadExamMode} disabled={isLoading}>
            {isLoading ? "Generating..." : "Regenerate"}
          </button>
        </div>

        {error ? <div className="status-alert error">{error}</div> : null}

        {isLoading ? (
          <div className="empty-state">Generating exam questions and revision notes from the document...</div>
        ) : (
          <pre className="exam-output">{result}</pre>
        )}
      </section>
    </section>
  );
};

export default ExamModePage;
