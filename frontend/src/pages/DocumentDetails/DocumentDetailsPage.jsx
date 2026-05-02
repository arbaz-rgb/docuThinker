import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import AiResponseRenderer from "../../components/ai/AiResponseRenderer";
import { askPdfQuestion, generateExamMode, generateInterviewMode, generateSummary } from "../../services/ai.service";
import { exportSummary } from "../../services/export.service";
import { fetchDocumentDetails } from "../../services/document.service";
import { formatAiResponseText } from "../../utils/aiResponseFormatting";

const formatNumber = (value) => Number(value || 0).toLocaleString();
const getMessageTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getRouteTab = (pathname) => {
  if (pathname.endsWith("/ask")) {
    return "ask";
  }

  if (pathname.endsWith("/interview")) {
    return "interview";
  }

  if (pathname.endsWith("/exam")) {
    return "exam";
  }

  return "summary";
};

const createSeedMessages = () => [
  {
    id: "ai-1",
    role: "ai",
    text: "I'm ready. Ask a question about this PDF and I'll answer from the document content.",
    time: getMessageTime(),
  },
];

const formatReadability = (score) => {
  if (score === null || score === undefined) {
    return "N/A";
  }

  return Number.isFinite(Number(score)) ? Number(score).toFixed(1) : String(score);
};

const buildSummary = (document) => {
  if (!document) {
    return "";
  }

  const text = document.extractedText || "";
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) || [];
  const summary = sentences.filter((sentence) => sentence.length > 30).slice(0, 5).join(" ");

  return formatAiResponseText(
    [
      "→ Overview",
      `Title: ${document.title}`,
      `Pages: ${document.pageCount || 0}`,
      `Word count: ${document.wordCount || 0}`,
      "",
      "→ Revision Notes",
      summary || text.slice(0, 1000) || "No extracted text available.",
      "",
      "→ Conclusion",
      "Use this summary as a quick study reference for the selected document.",
    ].join("\n")
  );
};

const DocumentDetailsPage = () => {
  const { documentId } = useParams();
  const location = useLocation();
  const askBottomRef = useRef(null);
  const [document, setDocument] = useState(null);
  const [activeTab, setActiveTab] = useState(() => getRouteTab(location.pathname));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingFormat, setExportingFormat] = useState("");
  const [exportError, setExportError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [askInput, setAskInput] = useState("");
  const [askMessages, setAskMessages] = useState(() => createSeedMessages());
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  const [askError, setAskError] = useState("");
  const [summaryResult, setSummaryResult] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [interviewResult, setInterviewResult] = useState("");
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState("");
  const [examResult, setExamResult] = useState("");
  const [isExamLoading, setIsExamLoading] = useState(false);
  const [examError, setExamError] = useState("");

  useEffect(() => {
    setActiveTab(getRouteTab(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchDocumentDetails(documentId);
        setDocument(data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load document details."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  useEffect(() => {
    setAskInput("");
    setAskMessages(createSeedMessages());
    setAskError("");
    setSummaryResult("");
    setSummaryError("");
    setInterviewResult("");
    setInterviewError("");
    setExamResult("");
    setExamError("");
  }, [documentId]);

  useEffect(() => {
    if (activeTab === "ask") {
      askBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, askMessages]);

  const summaryCards = useMemo(
    () => [
      { label: "Pages", value: formatNumber(document?.pageCount) },
      { label: "Word count", value: formatNumber(document?.wordCount) },
      { label: "Readability", value: formatReadability(document?.readabilityScore) },
    ],
    [document]
  );

  const insightCards = useMemo(() => {
    if (!document) {
      return [];
    }

    const cards = [];

    if (document.keywords?.length) {
      cards.push(`Important keywords: ${document.keywords.slice(0, 8).join(", ")}.`);
    }

    if (document.wordCount) {
      cards.push(`Extracted ${formatNumber(document.wordCount)} words across ${formatNumber(document.pageCount)} pages.`);
    }

    if (document.status) {
      cards.push(`Processing status: ${document.status}.`);
    }

    return cards.length ? cards : ["No insights are available for this document yet."];
  }, [document]);

  const tabs = useMemo(
    () => [
      { id: "summary", label: "Summary" },
      { id: "ask", label: "Ask PDF" },
      { id: "interview", label: "Interview" },
      { id: "exam", label: "Exam" },
    ],
    []
  );

  const loadSummary = async ({ force = false } = {}) => {
    if (isSummaryLoading || (!force && summaryResult) || !document?.extractedText) {
      return;
    }

    setIsSummaryLoading(true);
    setSummaryError("");

    try {
      const data = await generateSummary(documentId);
      setSummaryResult(data.result);
    } catch (requestError) {
      setSummaryError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate the summary right now."
      );
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const loadInterviewMode = async ({ force = false } = {}) => {
    if (isInterviewLoading || (!force && interviewResult)) {
      return;
    }

    setIsInterviewLoading(true);
    setInterviewError("");

    try {
      const data = await generateInterviewMode(documentId);
      setInterviewResult(data.result);
    } catch (requestError) {
      setInterviewError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate interview mode."
      );
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const loadExamMode = async ({ force = false } = {}) => {
    if (isExamLoading || (!force && examResult)) {
      return;
    }

    setIsExamLoading(true);
    setExamError("");

    try {
      const data = await generateExamMode(documentId);
      setExamResult(data.result);
    } catch (requestError) {
      setExamError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to generate exam mode."
      );
    } finally {
      setIsExamLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "summary") {
      loadSummary();
    }

    if (activeTab === "interview") {
      loadInterviewMode();
    }

    if (activeTab === "exam") {
      loadExamMode();
    }
  }, [activeTab, documentId, document]);

  const handleExport = async (format) => {
    setExportingFormat(format);
    setExportError("");

    try {
      await exportSummary(documentId, format);
    } catch (requestError) {
      setExportError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to export the summary right now."
      );
    } finally {
      setExportingFormat("");
    }
  };

  const handleShareSummary = async () => {
    if (!document) {
      return;
    }

    setShareStatus("");

    try {
      await navigator.clipboard.writeText(buildSummary(document));
      setShareStatus("Summary copied to clipboard.");
    } catch {
      setShareStatus("Clipboard access is unavailable in this browser.");
    }
  };

  const handleAskSubmit = async (event) => {
    event.preventDefault();
    const trimmedInput = askInput.trim();

    if (!trimmedInput || isSendingQuestion) {
      return;
    }

    const now = Date.now();
    const pendingMessageId = `ai-${now}`;

    setAskMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${now}`,
        role: "user",
        text: trimmedInput,
        time: getMessageTime(),
      },
      {
        id: pendingMessageId,
        role: "ai",
        text: "Reading the document and preparing an answer...",
        time: getMessageTime(),
        pending: true,
      },
    ]);
    setAskInput("");
    setAskError("");
    setIsSendingQuestion(true);

    try {
      const data = await askPdfQuestion(documentId, trimmedInput);
      setAskMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === pendingMessageId ? { ...message, text: data.result, pending: false } : message
        )
      );
    } catch (requestError) {
      setAskError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to answer this question right now."
      );
      setAskMessages((currentMessages) => currentMessages.filter((message) => message.id !== pendingMessageId));
    } finally {
      setIsSendingQuestion(false);
    }
  };

  const renderSummaryView = () => (
    <>
      <div className="summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="summary-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="details-grid">
        <section className="panel generated-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Generated summary</p>
              <h3>AI Summary</h3>
            </div>
            <div className="exam-meta">
              <button
                className="secondary-button"
                type="button"
                onClick={() => loadSummary({ force: true })}
                disabled={isSummaryLoading || !document?.extractedText}
              >
                {isSummaryLoading ? "Generating..." : "Regenerate"}
              </button>
            </div>
          </div>

          {summaryError ? <div className="status-alert error">{summaryError}</div> : null}

          {isSummaryLoading && !summaryResult ? (
            <div className="empty-state">Generating a clean summary from the document...</div>
          ) : summaryResult ? (
            <AiResponseRenderer text={summaryResult} fallbackHeading="Overview" />
          ) : (
            <div className="empty-state">No generated summary is available yet.</div>
          )}

          <details className="raw-text-details">
            <summary>Raw extracted text</summary>
            <pre className="text-preview">{document?.extractedText || "No extracted text available."}</pre>
          </details>
        </section>

        <aside className="panel details-sidebar">
          <div className="panel-header">
            <div>
              <p className="section-label">Key insights</p>
              <h3>Highlights</h3>
            </div>
          </div>

          <div className="insight-list">
            {insightCards.map((item, index) => (
              <article key={item} className="insight-card">
                <span className="insight-index">{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </>
  );

  const renderAskView = () => (
    <section className="ask-pdf-page workspace-tab-panel">
      <div className="ask-pdf-header">
        <div>
          <p className="section-label">Ask PDF</p>
          <h2>Document Chat</h2>
          <p className="muted">Selected document: {document?.title || documentId}</p>
        </div>

        <div className="ask-pdf-meta">
          <span className="tag">Live chat</span>
          <span className="tag">Document grounded</span>
        </div>
      </div>

      <div className="chat-shell panel">
        {askError ? <div className="status-alert error">{askError}</div> : null}

        <div className="chat-window" role="log" aria-live="polite">
          {askMessages.map((message) => (
            <article key={message.id} className={`chat-message ${message.role === "user" ? "user" : "ai"}`}>
              <div className="chat-bubble">
                <div className="chat-bubble-meta">
                  <strong>{message.role === "user" ? "You" : "DocuThinker"}</strong>
                  <span>{message.pending ? "Thinking" : message.time}</span>
                </div>
                {message.role === "ai" && !message.pending ? (
                  <AiResponseRenderer text={message.text} compact />
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
            </article>
          ))}
          <div ref={askBottomRef} />
        </div>

        <form className="chat-composer" onSubmit={handleAskSubmit}>
          <label className="chat-input-wrap">
            <span className="sr-only">Ask a question</span>
            <input
              type="text"
              value={askInput}
              onChange={(event) => setAskInput(event.target.value)}
              placeholder="Ask something about this PDF..."
              disabled={isSendingQuestion}
            />
          </label>
          <button className="primary-button" type="submit" disabled={isSendingQuestion || !askInput.trim()}>
            {isSendingQuestion ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </section>
  );

  const renderInterviewView = () => (
    <section className="interview-page workspace-tab-panel">
      <div className="interview-hero panel">
        <div>
          <p className="section-label">Document grounded</p>
          <h3>Likely questions, answer points, follow-ups, and revision topics.</h3>
        </div>
        <div className="interview-hero-copy">
          <span className="tag">Interview prep</span>
          <button
            className="secondary-button"
            type="button"
            onClick={() => loadInterviewMode({ force: true })}
            disabled={isInterviewLoading}
          >
            {isInterviewLoading ? "Generating..." : "Regenerate"}
          </button>
        </div>
      </div>

      {interviewError ? <div className="status-alert error">{interviewError}</div> : null}

      <section className="panel generated-panel">
        {isInterviewLoading && !interviewResult ? (
          <div className="empty-state">Generating interview preparation from the document...</div>
        ) : (
          <AiResponseRenderer text={interviewResult} fallbackHeading="Likely Interview Questions" />
        )}
      </section>
    </section>
  );

  const renderExamView = () => (
    <section className="exam-page workspace-tab-panel">
      <section className="panel exam-panel generated-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Generated pack</p>
            <h3>Exam preparation</h3>
          </div>
          <div className="exam-meta">
            <span className="tag">MCQs</span>
            <span className="tag">Short answers</span>
            <span className="tag">Long answers</span>
            <button
              className="secondary-button"
              type="button"
              onClick={() => loadExamMode({ force: true })}
              disabled={isExamLoading}
            >
              {isExamLoading ? "Generating..." : "Regenerate"}
            </button>
          </div>
        </div>

        {examError ? <div className="status-alert error">{examError}</div> : null}

        {isExamLoading && !examResult ? (
          <div className="empty-state">Generating exam questions and revision notes from the document...</div>
        ) : (
          <pre className="exam-output">{examResult}</pre>
        )}
      </section>
    </section>
  );

  if (isLoading) {
    return (
      <section className="details-page">
        <div className="empty-state">Loading document details...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="details-page">
        <div className="status-alert error">{error}</div>
      </section>
    );
  }

  return (
    <section className="details-page">
      <div className="details-header">
        <div>
          <p className="section-label">Document</p>
          <h2>{document?.title || "Details"}</h2>
          <p className="muted">{document?.originalName || documentId}</p>
        </div>

      </div>

      <div className="document-action-header" aria-label="Document actions">
        <div className="workspace-tabs" role="tablist" aria-label="Document workspace tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`workspace-tab-button ${activeTab === tab.id ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="export-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={Boolean(exportingFormat)}
          >
            {exportingFormat === "pdf" ? "Exporting..." : "Export PDF"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => handleExport("txt")}
            disabled={Boolean(exportingFormat)}
          >
            {exportingFormat === "txt" ? "Exporting..." : "Export TXT"}
          </button>
          <button className="primary-button" type="button" onClick={handleShareSummary}>
            Share summary
          </button>
        </div>
      </div>

      {exportError ? <div className="status-alert error">{exportError}</div> : null}
      {shareStatus ? <div className="status-alert success">{shareStatus}</div> : null}

      <div className="workspace-tab-content">
        {activeTab === "summary" ? renderSummaryView() : null}
        {activeTab === "ask" ? renderAskView() : null}
        {activeTab === "interview" ? renderInterviewView() : null}
        {activeTab === "exam" ? renderExamView() : null}
      </div>
    </section>
  );
};

export default DocumentDetailsPage;
