import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authStorage, isAdminRole } from '../../api/authApi';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customer, setCustomer] = useState(() => authStorage.getCustomer());
  const location = useLocation();

  useEffect(() => {
    const syncAuth = () => setCustomer(authStorage.getCustomer());
    window.addEventListener('storage', syncAuth);
    window.addEventListener('naturalfood:auth-changed', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('naturalfood:auth-changed', syncAuth);
    };
  }, []);

  // Automatically close mobile sidebar drawer on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    if (isSidebarOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  // Yalnızca Admin rolüyle giriş yapmış kullanıcılar yönetim paneline erişebilir
  if (!authStorage.isAuthenticated() || !isAdminRole(customer?.role)) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <div className="admin-layout-root" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F6F2' }}>
      {/* Mobile Backdrop */}
      <div
        className={`admin-backdrop ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar with Drawer Behavior */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Right Column: Header + Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, width: '100%', maxWidth: '100vw' }}>
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} isSidebarOpen={isSidebarOpen} />
        <main className="admin-main-content" style={{ padding: '28px', flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
