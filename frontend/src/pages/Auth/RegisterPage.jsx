import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigate, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import { ROUTES } from "../../constants/routes";
import { register } from "../../services/auth.service";

const registerFields = [
  {
    label: "Name",
    name: "name",
    type: "text",
    placeholder: "Your name",
    autoComplete: "name",
  },
  {
    label: "Email",
    name: "email",
    type: "email",
    placeholder: "you@example.com",
    autoComplete: "email",
  },
  {
    label: "Password",
    name: "password",
    type: "password",
    placeholder: "At least 6 characters",
    autoComplete: "new-password",
    minLength: 6,
  },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem("docuthinker_token");

  if (token) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const handleChange = (event) => {
    setValues((currentValues) => ({
      ...currentValues,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed. Try a different email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="section-label">Create workspace</p>
        <h1>Register</h1>
        <AuthForm
          error={error}
          fields={registerFields}
          footer={
            <p className="muted">
              Already have an account? <Link to={ROUTES.login}>Login</Link>
            </p>
          }
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Register"
          values={values}
        />
      </section>
    </main>
  );
};

export default RegisterPage;
