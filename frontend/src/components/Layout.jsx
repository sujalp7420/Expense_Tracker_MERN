import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="app-body">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="app-main-content">
          <div className="main-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
