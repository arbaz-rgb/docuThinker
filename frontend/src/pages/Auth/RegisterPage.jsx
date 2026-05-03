import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigate, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import { ROUTES } from "../../constants/routes";
import { useAppData } from "../../context/AppDataContext.jsx";
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
  const { loadInitialData, resetAppData } = useAppData();
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
      resetAppData();
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      await loadInitialData({ force: true });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed. Try a different email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Create workspace"
      title="Start using DocuThinker"
      subtitle="Set up your account and turn documents into study-ready intelligence."
    >
      <AuthForm
        error={error}
        fields={registerFields}
        footer={
          <p className="muted auth-footer-copy">
            Already have an account? <Link to={ROUTES.login}>Login</Link>
          </p>
        }
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Register"
        values={values}
      />
    </AuthLayout>
  );
};

export default RegisterPage;
