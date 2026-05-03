import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={`app-shell${isSidebarOpen ? " sidebar-open" : ""}`}>
      <Sidebar onNavigate={closeSidebar} />
      <button
        className="sidebar-backdrop"
        type="button"
        aria-label="Close navigation"
        onClick={closeSidebar}
      />
      <div className="app-main">
        <Navbar onMenuClick={() => setIsSidebarOpen((isOpen) => !isOpen)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
