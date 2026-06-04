import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/notifications/unread-count')
        .then(res => setUnreadCount(res.data.data.count))
        .catch(() => { });
    }
  }, [isAuthenticated]);

  const openNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    }
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">N</span>
        </div>
        <span className="text-lg font-bold text-gray-900">
          NGO <span className="text-orange-500">Platform</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            <Link
              to="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user.firstName}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={openNotifications}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    <button
                      onClick={markAllRead}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-orange-50' : ''
                            }`}
                        >
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm bg-orange-500 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}