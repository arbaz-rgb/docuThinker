import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";
import { ROUTES } from "../../constants/routes";
import { useAppData } from "../../context/AppDataContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const formatDate = (value, fallback = "Not available") => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value, fallback = "Not available") => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "DT";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const ProfilePage = () => {
  const { theme } = useTheme();
  const {
    areDocumentsLoaded,
    areDocumentsLoading,
    documents,
    isUserLoaded,
    isUserLoading,
    loadDocuments,
    loadUser,
    pagination,
    user,
  } = useAppData();
  const [error, setError] = useState("");

  useEffect(() => {
    if (isUserLoaded || isUserLoading) {
      return;
    }

    setError("");
    loadUser().catch((requestError) => {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load the latest profile details."
      );
    });
  }, [isUserLoaded, isUserLoading, loadUser]);

  useEffect(() => {
    if (areDocumentsLoaded || areDocumentsLoading) {
      return;
    }

    setError("");
    loadDocuments().catch((requestError) => {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load account document stats."
      );
    });
  }, [areDocumentsLoaded, areDocumentsLoading, loadDocuments]);

  const profile = {
    name: user?.name || "DocuThinker User",
    email: user?.email || "No email available",
    joinedAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };

  const processedDocuments = documents.filter((document) => document.status === "processed");
  const lastDocumentActivity = documents.reduce((latest, document) => {
    const activityDate = new Date(document.updatedAt || document.createdAt || 0);

    if (Number.isNaN(activityDate.getTime())) {
      return latest;
    }

    return !latest || activityDate > latest ? activityDate : latest;
  }, null);

  const overviewStats = useMemo(
    () => [
      {
        label: "Documents uploaded",
        value: String(pagination?.total ?? documents.length),
        detail: `${documents.length} recent files loaded`,
      },
      {
        label: "Summaries generated",
        value: String(processedDocuments.length),
        detail: "Processed documents ready for study",
      },
      {
        label: "Questions asked",
        value: "Session",
        detail: "Ask PDF chats are not persisted yet",
      },
      {
        label: "Last active",
        value: lastDocumentActivity ? formatDate(lastDocumentActivity) : "Now",
        detail: lastDocumentActivity ? "Based on latest document activity" : "Current workspace session",
      },
    ],
    [documents.length, lastDocumentActivity, pagination?.total, processedDocuments.length]
  );

  const accountRows = [
    { label: "Full Name", value: profile.name },
    { label: "Email", value: profile.email },
    { label: "Account Type", value: "Standard Workspace" },
    { label: "Joined Date", value: formatDate(profile.joinedAt, "Member date unavailable") },
    { label: "Last Login", value: "Current session" },
  ];

  return (
    <section className="profile-page">
      <div className="profile-header-card">
        <div className="profile-avatar" aria-hidden="true">
          {getInitials(profile.name)}
        </div>
        <div className="profile-identity">
          <p className="section-label">Account center</p>
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
          <div className="profile-meta-row">
            <span>Member since {formatDate(profile.joinedAt, "this session")}</span>
            <span>AI-powered study workspace account</span>
          </div>
        </div>
        <Link className="primary-button profile-upload-link" to={ROUTES.upload}>
          Upload document
        </Link>
      </div>

      {error ? <div className="status-alert error">{error}</div> : null}

      <div className="profile-stats-grid">
        {overviewStats.map((stat) => (
          <article key={stat.label} className="stat-card profile-stat-card">
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.detail}</span>
          </article>
        ))}
      </div>

      <div className="profile-layout">
        <section className="panel profile-info-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Profile details</p>
              <h3>Account information</h3>
            </div>
          </div>

          <div className="profile-info-list">
            {accountRows.map((row) => (
              <div key={row.label} className="profile-info-row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <aside className="panel profile-settings-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Settings</p>
              <h3>Workspace preferences</h3>
            </div>
          </div>

          <div className="profile-setting-list">
            <div className="profile-setting-row">
              <div>
                <strong>Theme</strong>
                <span>Current mode: {theme}</span>
              </div>
              <ThemeToggle />
            </div>

            <div className="profile-setting-row">
              <div>
                <strong>Security</strong>
                <span>JWT authentication is active for this workspace.</span>
              </div>
              <span className="profile-status-pill">Protected</span>
            </div>

            <div className="profile-setting-row">
              <div>
                <strong>Data</strong>
                <span>Your documents and AI workflows stay linked to this account.</span>
              </div>
              <Link className="text-button" to={ROUTES.dashboard}>
                View files
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <section className="panel profile-activity-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Activity</p>
            <h3>Recent account activity</h3>
          </div>
        </div>

        <div className="profile-activity-list">
          <div className="profile-activity-item">
            <span>Latest document activity</span>
            <strong>{formatDateTime(lastDocumentActivity, "No document activity yet")}</strong>
          </div>
          <div className="profile-activity-item">
            <span>Profile updated</span>
            <strong>{formatDateTime(profile.updatedAt, "Profile details synced from account")}</strong>
          </div>
          <div className="profile-activity-item">
            <span>Workspace status</span>
            <strong>Ready for document analysis</strong>
          </div>
        </div>
      </section>
    </section>
  );
};

export default ProfilePage;
