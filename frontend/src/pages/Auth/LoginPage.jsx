import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import { ROUTES } from "../../constants/routes";
import { useAppData } from "../../context/AppDataContext.jsx";
import { getApiErrorMessage } from "../../services/api";
import { login } from "../../services/auth.service";

const loginFields = [
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
    placeholder: "Password",
    autoComplete: "current-password",
    minLength: 6,
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadInitialData, resetAppData } = useAppData();
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem("docuthinker_token");
  const redirectTo = location.state?.from?.pathname || ROUTES.dashboard;

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
      resetAppData();
      await login({
        email: values.email.trim(),
        password: values.password,
      });
      await loadInitialData({ force: true });
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Login failed. Check your email and password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Login to your workspace"
      subtitle="Continue summarizing, asking, and revising from your documents."
    >
      <AuthForm
        error={error}
        fields={loginFields}
        footer={
          <p className="muted auth-footer-copy">
            New here? <Link to={ROUTES.register}>Create an account</Link>
          </p>
        }
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Login"
        values={values}
      />
    </AuthLayout>
  );
};

export default LoginPage;
