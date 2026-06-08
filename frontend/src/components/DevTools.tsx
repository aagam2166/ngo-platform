import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { RootState } from '../store';

const MOCK_USERS = {
  CITIZEN: {
    id: 'dev-citizen-001',
    email: 'citizen@dev.local',
    firstName: 'Dev',
    lastName: 'Citizen',
    role: 'CITIZEN',
  },
  VOLUNTEER: {
    id: 'dev-volunteer-001',
    email: 'volunteer@dev.local',
    firstName: 'Dev',
    lastName: 'Volunteer',
    role: 'VOLUNTEER',
  },
  NGO_ADMIN: {
    id: 'dev-ngo-001',
    email: 'ngo@dev.local',
    firstName: 'Dev',
    lastName: 'NGO Admin',
    role: 'NGO_ADMIN',
  },
  SUPER_ADMIN: {
    id: 'dev-admin-001',
    email: 'admin@dev.local',
    firstName: 'Dev',
    lastName: 'Super Admin',
    role: 'SUPER_ADMIN',
  },
};

const MOCK_TOKEN = 'dev-token-' + Math.random().toString(36).substring(2, 15);

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);

  const switchRole = (role: keyof typeof MOCK_USERS) => {
    const mockUser = MOCK_USERS[role];
    dispatch(
      setCredentials({
        user: mockUser,
        token: MOCK_TOKEN,
      })
    );
  };

  return (
    <>
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* Floating Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
              isOpen
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-purple-500 hover:bg-purple-600'
            } text-white font-bold text-lg`}
            title="Dev Tools"
          >
            ⚙️
          </button>

          {/* Dev Tools Panel */}
          {isOpen && (
            <div className="absolute bottom-16 right-0 w-72 bg-white rounded-xl shadow-2xl border border-purple-200 p-4 space-y-3 max-h-96 overflow-y-auto">
              {/* Header */}
              <div className="border-b border-purple-100 pb-2 mb-2">
                <p className="text-xs font-bold text-purple-900">
                  🛠️ DEVELOPER TOOLS - ROLE SWITCHER
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Current Role: <span className="font-semibold text-purple-900">{user?.role || 'Not Auth'}</span>
                </p>
              </div>

              {/* Role Buttons */}
              <div className="space-y-2">
                {Object.entries(MOCK_USERS).map(([roleKey, mockUser]) => (
                  <button
                    key={roleKey}
                    onClick={() => switchRole(roleKey as keyof typeof MOCK_USERS)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                      user?.role === mockUser.role
                        ? 'bg-purple-600 text-white border border-purple-700 shadow-md'
                        : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span className="font-bold">{roleKey}</span>
                    <p className="text-xs opacity-75 mt-0.5">{mockUser.email}</p>
                  </button>
                ))}
              </div>

              {/* User Info Box */}
              {user && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 rounded-lg p-3 mt-3 text-xs">
                  <p className="text-purple-900 font-bold mb-2">👤 Logged In As:</p>
                  <p className="text-purple-800 font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-purple-700 text-xs">{user.email}</p>
                  <p className="text-purple-600 mt-2 font-mono text-[10px] break-all bg-white bg-opacity-50 p-1 rounded">
                    ID: {user.id}
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <p className="font-bold text-blue-900 mb-2">💡 How to Use:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Click any role button above</li>
                  <li>Redux state updates instantly</li>
                  <li>No API calls needed</li>
                  <li>Navigate to test different role pages</li>
                  <li>Refresh page to reset</li>
                </ol>
              </div>

              {/* Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                <p className="font-bold text-yellow-900 mb-1">⚠️ Dev Only:</p>
                <p className="text-yellow-800">
                  This tool only appears in development mode. It won't show in production.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg text-xs transition-colors"
              >
                Close Panel
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
