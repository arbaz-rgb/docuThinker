import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout.jsx";
import { ROUTES } from "../constants/routes";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import DocumentDetailsPage from "../pages/DocumentDetails/DocumentDetailsPage.jsx";
import LandingPage from "../pages/Landing/LandingPage.jsx";
import ProfilePage from "../pages/Profile/ProfilePage.jsx";
import UploadPage from "../pages/Upload/UploadPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path={ROUTES.landing} element={<LandingPage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.upload} element={<UploadPage />} />
          <Route path={ROUTES.documents} element={<DashboardPage />} />
          <Route path={ROUTES.documentDetails} element={<DocumentDetailsPage />} />
          <Route path={ROUTES.askPdf} element={<DocumentDetailsPage />} />
          <Route path={ROUTES.interviewMode} element={<DocumentDetailsPage />} />
          <Route path={ROUTES.examMode} element={<DocumentDetailsPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
};

export default AppRoutes;
