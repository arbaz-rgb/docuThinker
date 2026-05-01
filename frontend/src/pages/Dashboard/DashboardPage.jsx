import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ROUTES } from "../../constants/routes";
import { deleteDocument, fetchDocuments } from "../../services/document.service";

const formatDate = (value) => {
  if (!value) {
    return "Unknown date";
  }

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getDocumentPath = (documentId, suffix = "") => `/documents/${documentId}${suffix}`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchDocuments({ page: 1, limit: 8 });
        setDocuments(data.documents || []);
        setPagination(data.pagination || null);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load documents."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const stats = useMemo(() => {
    const total = pagination?.total ?? documents.length;
    const processed = documents.filter((document) => document.status === "processed").length;
    const totalWords = documents.reduce((sum, document) => sum + (document.wordCount || 0), 0);
    const classifications = new Set(documents.map((document) => document.classification).filter(Boolean));

    return [
      { label: "Total uploads", value: String(total), detail: `${documents.length} shown` },
      { label: "Processed", value: String(processed), detail: "Ready for study" },
      { label: "Words indexed", value: totalWords.toLocaleString(), detail: "Across latest documents" },
      { label: "Doc types", value: String(classifications.size), detail: "Detected classifications" },
    ];
  }, [documents, pagination]);

  const firstDocument = documents[0];

  const closeDeleteModal = () => {
    if (!deletingDocumentId) {
      setDocumentToDelete(null);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) {
      return;
    }

    setDeletingDocumentId(documentToDelete._id);

    try {
      await deleteDocument(documentToDelete._id);
      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document._id !== documentToDelete._id)
      );
      setPagination((currentPagination) =>
        currentPagination
          ? {
              ...currentPagination,
              total: Math.max((currentPagination.total || 0) - 1, 0),
            }
          : currentPagination
      );
      setDocumentToDelete(null);
      showToast("success", "Document deleted successfully.");
    } catch (requestError) {
      showToast(
        "error",
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to delete this document."
      );
    } finally {
      setDeletingDocumentId("");
    }
  };

  const quickActions = [
    {
      title: "Upload PDF",
      description: "Add a new document for analysis.",
      path: ROUTES.upload,
      disabled: false,
    },
    {
      title: "Ask PDF",
      description: "Start a question-and-answer session.",
      path: firstDocument ? getDocumentPath(firstDocument._id, "/ask") : "",
      disabled: !firstDocument,
    },
    {
      title: "Interview Mode",
      description: "Generate interview prep from a document.",
      path: firstDocument ? getDocumentPath(firstDocument._id, "/interview") : "",
      disabled: !firstDocument,
    },
    {
      title: "Exam Mode",
      description: "Build revision material and practice questions.",
      path: firstDocument ? getDocumentPath(firstDocument._id, "/exam") : "",
      disabled: !firstDocument,
    },
  ];

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="section-label">Overview</p>
          <h2>Workspace Dashboard</h2>
          <p className="muted">
            Track uploads, review document intelligence, and jump directly into study workflows.
          </p>
        </div>
        <div className="dashboard-hero-card">
          <p className="section-label">Latest</p>
          <strong>{firstDocument ? firstDocument.title : "No documents yet"}</strong>
          <span>{firstDocument ? `${firstDocument.wordCount || 0} words indexed` : "Upload a PDF to begin."}</span>
        </div>
      </div>

      {error ? <div className="status-alert error">{error}</div> : null}
      {toast ? <div className={`dashboard-toast ${toast.type}`}>{toast.message}</div> : null}

      <div className="stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.detail}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Recent uploads</p>
              <h3>Latest documents</h3>
            </div>
            <button className="text-button" type="button" onClick={() => navigate(ROUTES.upload)}>
              Upload
            </button>
          </div>

          {isLoading ? (
            <div className="empty-state">Loading documents...</div>
          ) : documents.length > 0 ? (
            <div className="upload-list">
              {documents.map((document) => (
                <article key={document._id} className="upload-row">
                  <Link className="upload-row-main upload-row-link" to={getDocumentPath(document._id)}>
                    <div className="upload-badge">PDF</div>
                    <div className="upload-copy">
                      <strong>{document.title}</strong>
                      <span>{formatDate(document.createdAt)}</span>
                    </div>
                    <div className="upload-tags">
                      <span className="tag">{document.classification || "Unknown"}</span>
                      <span className="tag">{document.pageCount || 0} pages</span>
                    </div>
                    <div className="upload-status">{document.status}</div>
                  </Link>
                  <button
                    className="delete-document-button"
                    type="button"
                    onClick={() => setDocumentToDelete(document)}
                    disabled={deletingDocumentId === document._id}
                    aria-label={`Delete ${document.title}`}
                    title="Delete document"
                  >
                    {deletingDocumentId === document._id ? "Deleting..." : "Delete"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No documents found. Upload a PDF to start.</div>
          )}
        </section>

        <aside className="panel dashboard-actions">
          <div className="panel-header">
            <div>
              <p className="section-label">Quick actions</p>
              <h3>Jump in</h3>
            </div>
          </div>

          <div className="action-grid">
            {quickActions.map((action) =>
              action.disabled ? (
                <button key={action.title} className="action-card" type="button" disabled>
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </button>
              ) : (
                <Link key={action.title} className="action-card action-link" to={action.path}>
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </Link>
              )
            )}
          </div>
        </aside>
      </div>

      {documentToDelete ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeDeleteModal}>
          <section
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div>
              <p className="section-label">Delete document</p>
              <h3 id="delete-document-title">Are you sure you want to delete this document?</h3>
              <p className="muted">{documentToDelete.title}</p>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingDocumentId)}
              >
                Cancel
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingDocumentId)}
              >
                {deletingDocumentId ? "Deleting..." : "Delete document"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default DashboardPage;
