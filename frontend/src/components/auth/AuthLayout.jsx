import { useTheme } from "../../context/ThemeContext.jsx";

const featureHighlights = ["Summarize", "Ask PDF", "Interview", "Exam"];

const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main className="auth-page auth-shell">
      <button className="auth-theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle theme">
        <span>{isDark ? "Light" : "Dark"}</span>
      </button>

      <section className="auth-hero-panel" aria-label="DocuThinker overview">
        <div className="auth-brand">
          <span className="auth-brand-mark">D</span>
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
