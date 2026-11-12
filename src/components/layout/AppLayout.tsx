import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import adminService from '../../services/adminService';
import { ToastProvider } from '../../context/ToastContext';
import PayrollAIFloat from '../../modules/payroll/PayrollAIFloat';

interface AppLayoutProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ isAuthenticated, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Read LetGetIn session data
  const [trialSession, setTrialSession] = useState<{
    orgName?: string;
    status?: string;
    trialExpiresAt?: string | null;
    isExpired?: boolean;
    daysLeft?: number;
    hoursLeft?: number;
  } | null>(null);

  useEffect(() => {
    // Initialise branding theme variables
    adminService.getBranding().then((b) => adminService.applyBrandingToDOM(b));
  }, []);

  // Close mobile drawer on route change & check trial expiry
  useEffect(() => {
    setIsMobileOpen(false);

    const raw = localStorage.getItem('letgetin_huremaso_session');
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session.status === 'trial_active' && session.trialExpiresAt) {
          const expiryTime = new Date(session.trialExpiresAt).getTime();
          const now = Date.now();
          if (expiryTime <= now) {
            onLogout();
            window.location.href = '/login?expired=true';
            return;
          }
          const diffMs = expiryTime - now;
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
          setTrialSession({
            orgName: session.orgName,
            status: session.status,
            trialExpiresAt: session.trialExpiresAt,
            isExpired: false,
            daysLeft,
            hoursLeft,
          });
        } else if (session.status === 'subscription_active') {
          setTrialSession({
            orgName: session.orgName,
            status: 'subscription_active',
          });
        }
      } catch (e) {
        console.error('Failed to parse letgetin session:', e);
      }
    }
  }, [location.pathname, location.search, onLogout]);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Header 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          onToggleMobile={() => setIsMobileOpen(prev => !prev)}
          onLogout={onLogout} 
        />
        <Sidebar isOpen={sidebarOpen} isMobileOpen={isMobileOpen} onClose={closeMobileSidebar} onLogout={onLogout} />
        <main className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'pl-0 md:pl-72' : 'pl-0 md:pl-20'}`}>
          {/* LetGetIn Trial Status Notice Bar */}
          {trialSession?.status === 'trial_active' && (
            <div className="bg-gradient-to-r from-[#061f3d] via-[#092d59] to-[#0473b8] text-white px-4 py-2.5 text-xs shadow-sm flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">LetGetIn 7-Day Free Trial:</span>
                <span>
                  {trialSession.daysLeft && trialSession.daysLeft > 1
                    ? `${trialSession.daysLeft} days remaining`
                    : `${trialSession.hoursLeft || 1} hours remaining`}
                </span>
                {trialSession.orgName && (
                  <span className="hidden sm:inline text-slate-300">
                    • Organization: <strong>{trialSession.orgName}</strong>
                  </span>
                )}
              </div>
              <a
                href="http://localhost:3000/recruiter/huremaso"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 transition-all text-cyan-200"
              >
                Manage Subscription on LetGetIn <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        {/* Payroll AI Floating Assistant — visible on all payroll pages */}
        {location.pathname.startsWith('/payroll') && <PayrollAIFloat />}
      </div>
    </ToastProvider>
  );
};
export default AppLayout;
