import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import api from '../../lib/api';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_STYLES: Record<string, string> = {
  SUCCESS: 'border-l-2 border-green-400 bg-green-50',
  ERROR: 'border-l-2 border-red-400 bg-red-50',
  INFO: 'bg-white',
};

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count whenever auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    api.get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data.data.count))
      .catch(() => { });
  }, [isAuthenticated]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      api.get('/notifications/unread-count')
        .then((res) => setUnreadCount(res.data.data.count))
        .catch(() => { });
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  const openNotifications = async () => {
    const opening = !showNotifications;
    setShowNotifications(opening);
    if (opening) {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data);
      } catch { /* silent */ }
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowNotifications(false);
    setMobileOpen(false);
    setNotifications([]);
    setUnreadCount(0);
    navigate('/');
    toast.success('Logged out');
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });

  const navLinkClass = "text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors";
  const mobileLinkClass = "block w-full text-left text-sm text-gray-700 font-medium px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* ── Main bar ── */}
      <div className="px-4 sm:px-6 py-3 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            NGO <span className="text-orange-500">Platform</span>
          </span>
        </Link>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-1">
          {isAuthenticated && user ? (
            <>
              <Link to="/dashboard" className={navLinkClass}>Dashboard</Link>

              {user.role === 'CITIZEN' && (
                <>
                  <Link
                    to="/donate"
                    className="inline-flex items-center gap-2 text-sm bg-orange-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                  >
                    <Heart size={16} fill="currentColor" />
                    Donate
                  </Link>
                  <Link to="/my-donations" className={navLinkClass}>My Donations</Link>
                </>
              )}

              {user.role === 'NGO_ADMIN' && (
                <>
                  <Link to="/ngo/donations" className={navLinkClass}>Donations</Link>
                  <Link to="/ngo/accounts" className={navLinkClass}>Accounts</Link>
                </>
              )}

              {user.role === 'SUPER_ADMIN' && (
                <Link to="/admin" className={navLinkClass}>Admin Panel</Link>
              )}

              {user.role === 'VOLUNTEER' && (
                <Link to="/volunteer/dashboard" className={navLinkClass}>My Dashboard</Link>
              )}

              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={openNotifications}
                  className={`relative p-2 rounded-lg transition-colors ${unreadCount > 0
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  aria-label="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-600
                                     text-white text-[10px] font-bold rounded-full
                                     flex items-center justify-center px-1 animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 font-medium">
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-2xl mb-2">🔔</p>
                          <p className="text-sm text-gray-400">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? (TYPE_STYLES[n.type] ?? 'bg-orange-50') : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                              {!n.isRead && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-xs text-gray-300 mt-1">{formatTime(n.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg ml-1">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user.firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLinkClass}>Login</Link>
              <Link
                to="/register"
                className="text-sm bg-orange-500 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-600 transition-colors shadow-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile right side — bell + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={openNotifications}
                className={`relative p-2 rounded-lg transition-colors ${unreadCount > 0
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-600
                                   text-white text-[10px] font-bold rounded-full
                                   flex items-center justify-center px-1 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 font-medium">
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-2xl mb-2">🔔</p>
                        <p className="text-sm text-gray-400">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? (TYPE_STYLES[n.type] ?? 'bg-orange-50') : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                            {!n.isRead && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-gray-300 mt-1">{formatTime(n.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger button */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          {isAuthenticated && user ? (
            <>
              {/* User info strip */}
              <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">
                    {user.firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              <Link to="/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                📊 Dashboard
              </Link>

              {user.role === 'CITIZEN' && (
                <>
                  <Link to="/donate" className="flex items-center gap-2 w-full text-left text-sm text-white font-medium px-4 py-3 bg-orange-600 hover:bg-orange-700 border-b border-orange-700 transition-colors" onClick={() => setMobileOpen(false)}>
                    <Heart size={15} fill="currentColor" /> Donate
                  </Link>
                  <Link to="/my-donations" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>💝 My Donations</Link>
                  <Link to="/requests/mine" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>📋 My Requests</Link>
                </>
              )}

              {user.role === 'NGO_ADMIN' && (
                <>
                  <Link to="/ngo/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>🏢 NGO Dashboard</Link>
                  <Link to="/ngo/donations" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>💰 Donations</Link>
                  <Link to="/ngo/accounts" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>🏦 Accounts</Link>
                  <Link to="/ngo/resources" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>📦 Resource Inventory</Link>
                </>
              )}

              {user.role === 'SUPER_ADMIN' && (
                <Link to="/admin" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>🛡️ Admin Panel</Link>
              )}

              {user.role === 'VOLUNTEER' && (
                <Link to="/volunteer/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>⭐ My Dashboard</Link>
              )}

              <button
                onClick={handleLogout}
                className="block w-full text-left text-sm text-red-600 font-medium px-4 py-3 hover:bg-red-50 transition-colors"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>Login</Link>
              <div className="px-4 py-3">
                <Link
                  to="/register"
                  className="block w-full text-center bg-orange-500 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}