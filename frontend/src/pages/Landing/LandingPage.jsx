import { Link, Navigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

const LandingPage = () => {
  const token = localStorage.getItem("docuthinker_token");

  if (token) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="section-label">DocuThinker</p>
        <h1>Read, ask, and revise from PDFs.</h1>
        <p className="muted">
          Upload documents, generate AI summaries, ask questions, and prepare for interviews or exams.
        </p>
        <div className="button-row">
          <Link className="primary-button" to={ROUTES.login}>
            Login
          </Link>
          <Link className="secondary-button" to={ROUTES.register}>
            Register
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
