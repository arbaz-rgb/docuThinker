import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useTheme } from "../../context/ThemeContext.jsx";
import { clearAuthSession, getAuthUser } from "../../services/auth.service";

const Navbar = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="navbar">
      <div>
        <p className="navbar-eyebrow">Workspace</p>
        <h1>DocuThinker</h1>
      </div>

      <div className="navbar-actions">
        <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? "L" : "D"}
        </button>
        <div className="user-chip">{user?.name || "User"}</div>
        <button className="text-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
