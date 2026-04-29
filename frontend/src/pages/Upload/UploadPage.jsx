import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadPdf } from "../../services/upload.service";

const formatSize = (size) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const UploadPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        size: formatSize(file.size),
        status: statusMap[file.name] || "Ready",
        progress: progressMap[file.name] || 0,
      })),
    [progressMap, selectedFiles, statusMap]
  );

  const handleFiles = (files) => {
    const pdfFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setError("Select at least one PDF file.");
      return;
    }

    setError("");
    setSelectedFiles(pdfFiles);
    setProgressMap(
      pdfFiles.reduce((accumulator, file) => {
        accumulator[file.name] = 0;
        return accumulator;
      }, {})
    );
    setStatusMap(
      pdfFiles.reduce((accumulator, file) => {
        accumulator[file.name] = "Ready";
        return accumulator;
      }, {})
    );
  };

  const handleInputChange = (event) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setProgressMap({});
    setStatusMap({});
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || isUploading) {
      return;
    }

    setIsUploading(true);
    setError("");
    const uploadedDocuments = [];

    for (const file of selectedFiles) {
      setStatusMap((current) => ({ ...current, [file.name]: "Uploading" }));

      try {
        const document = await uploadPdf(file, {
          onUploadProgress: (event) => {
            if (!event.total) {
              return;
            }

            setProgressMap((current) => ({
              ...current,
              [file.name]: Math.round((event.loaded * 100) / event.total),
            }));
          },
        });

        uploadedDocuments.push(document);
        setProgressMap((current) => ({ ...current, [file.name]: 100 }));
        setStatusMap((current) => ({ ...current, [file.name]: "Complete" }));
      } catch (requestError) {
        setStatusMap((current) => ({ ...current, [file.name]: "Failed" }));
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            `Unable to upload ${file.name}.`
        );
        break;
      }
    }

    setIsUploading(false);

    if (uploadedDocuments.length === selectedFiles.length && uploadedDocuments[0]?._id) {
      navigate(`/documents/${uploadedDocuments[0]._id}`);
    }
  };

  const averageProgress = selectedFiles.length
    ? Math.round(Object.values(progressMap).reduce((a, b) => a + b, 0) / selectedFiles.length)
    : 0;

  return (
    <section className="upload-page">
      <div className="upload-header">
        <div>
          <p className="section-label">Upload</p>
          <h2>Add PDFs</h2>
          <p className="muted">Drop files in, preview them, and upload them for document analysis.</p>
        </div>
        <button className="text-button" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          Browse files
        </button>
      </div>

      {error ? <div className="status-alert error">{error}</div> : null}

      <div className="upload-layout">
        <section
          className={`upload-dropzone${isDragging ? " dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            accept="application/pdf"
            multiple
            onChange={handleInputChange}
            type="file"
            hidden
          />

          <div className="dropzone-icon">PDF</div>
          <div className="dropzone-copy">
            <strong>Drag and drop PDFs here</strong>
            <span>or browse from your device to add files to the queue.</span>
          </div>
          <button className="primary-button" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            Select files
          </button>
        </section>

        <aside className="upload-sidebar panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Queue</p>
              <h3>File preview</h3>
            </div>
          </div>

          {previews.length > 0 ? (
            <div className="preview-list">
              {previews.map((file) => (
                <article key={file.id} className="preview-item">
                  <div className="preview-meta">
                    <div className="upload-badge">PDF</div>
                    <div className="upload-copy">
                      <strong>{file.name}</strong>
                      <span>{file.size}</span>
                    </div>
                  </div>
                  <div className="progress-track" aria-label={`Upload progress for ${file.name}`}>
                    <div className="progress-fill" style={{ width: `${file.progress}%` }} />
                  </div>
                  <div className="progress-row">
                    <span>{file.status}</span>
                    <strong>{file.progress}%</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">Selected files will show up here before upload.</div>
          )}
        </aside>
      </div>

      <section className="panel upload-footer">
        <div className="upload-progress-summary">
          <p className="section-label">Upload progress</p>
          <strong>{averageProgress}%</strong>
          <span>{selectedFiles.length || 0} files ready</span>
        </div>

        <div className="upload-footer-actions">
          <button className="secondary-button" type="button" onClick={handleClear} disabled={isUploading}>
            Clear
          </button>
          <button className="primary-button" type="button" onClick={handleUpload} disabled={!selectedFiles.length || isUploading}>
            {isUploading ? "Uploading..." : "Start upload"}
          </button>
        </div>
      </section>
    </section>
  );
};

export default UploadPage;
