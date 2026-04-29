import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";

const ProtectedRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem("docuthinker_token");

  if (!token) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
