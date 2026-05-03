import LogoMark from "../common/LogoMark.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";

const featureHighlights = ["Summarize", "Ask PDF", "Interview", "Exam"];

const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
  return (
    <main className="auth-page auth-shell">
      <ThemeToggle className="auth-theme-toggle" />

      <section className="auth-hero-panel" aria-label="DocuThinker overview">
        <div className="auth-brand">
          <LogoMark className="auth-brand-mark" />
          <span>DocuThinker</span>
        </div>

        <div className="auth-hero-copy">
          <p className="section-label">AI document workspace</p>
          <h1>AI-powered document intelligence for focused study.</h1>
          <p>
            Generate clean summaries, ask grounded questions, prepare interview answers, and turn
            uploaded files into exam-ready insights.
          </p>
        </div>

        <div className="auth-feature-grid" aria-label="DocuThinker features">
          {featureHighlights.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
      </section>

      <section className="auth-card-panel">
        <div className="auth-card-heading">
          <p className="section-label">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
};

export default AuthLayout;
