import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useAppData } from "../../context/AppDataContext.jsx";
import { clearAuthSession, getAuthUser } from "../../services/auth.service";
import LogoMark from "../common/LogoMark.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";

const Navbar = () => {
  const navigate = useNavigate();
  const { resetAppData, user: cachedUser } = useAppData();
  const user = cachedUser || getAuthUser();

  const handleLogout = () => {
    clearAuthSession();
    resetAppData();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <LogoMark className="navbar-logo" />
        <div>
          <p className="navbar-eyebrow">Workspace</p>
          <h1>DocuThinker</h1>
        </div>
      </div>

      <div className="navbar-actions">
        <ThemeToggle />
        <div className="user-chip">{user?.name || "User"}</div>
        <button className="text-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
