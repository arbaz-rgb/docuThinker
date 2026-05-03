import { NavLink } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

const navItems = [
  { label: "Dashboard", path: ROUTES.dashboard },
  { label: "Upload", path: ROUTES.upload },
  { label: "Profile", path: ROUTES.profile },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">D</span>
        <span>DocuThinker</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
