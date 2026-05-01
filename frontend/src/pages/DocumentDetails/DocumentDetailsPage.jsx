import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { exportSummary } from "../../services/export.service";
import { fetchDocumentDetails } from "../../services/document.service";
import { formatAiResponseText } from "../../utils/aiResponseFormatting";

const formatNumber = (value) => Number(value || 0).toLocaleString();

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
      `Classification: ${document.classification || "Unknown"}`,
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
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingFormat, setExportingFormat] = useState("");
  const [exportError, setExportError] = useState("");
  const [shareStatus, setShareStatus] = useState("");

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

  const summaryCards = useMemo(
    () => [
      { label: "Classification", value: document?.classification || "Unknown" },
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

    if (document.classification) {
      cards.push(`Detected document type: ${document.classification}.`);
    }

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

        <div className="export-actions">
          <Link className="secondary-button" to={`/documents/${documentId}/ask`}>
            Ask PDF
          </Link>
          <Link className="secondary-button" to={`/documents/${documentId}/interview`}>
            Interview
          </Link>
          <Link className="secondary-button" to={`/documents/${documentId}/exam`}>
            Exam
          </Link>
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

      <div className="summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="summary-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="details-grid">
        <section className="panel text-preview-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Extracted text</p>
              <h3>Preview</h3>
            </div>
          </div>

          <pre className="text-preview">{document?.extractedText || "No extracted text available."}</pre>
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
    </section>
  );
};

export default DocumentDetailsPage;
