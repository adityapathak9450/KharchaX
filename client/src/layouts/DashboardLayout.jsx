import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useSocket } from '../hooks/useSocket';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize socket for real-time notifications
  useSocket();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      setSidebarOpen(window.innerWidth >= 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${!isMobile && sidebarOpen ? 'ml-60' : 'ml-0'}`}>
        <Header
          onMenuToggle={handleMenuToggle}
          isMobile={isMobile}
        />
        
        <main className="pt-16 p-6 min-h-screen bg-canvas overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
