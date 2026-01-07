import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, users, setCurrentUser } = useAppContext();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">IT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  IT/OT Collaboration Tool
                </h1>
                <p className="text-xs text-gray-500">Machine Integration Data Collection</p>
              </div>
            </Link>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* User Switcher (for demo) */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Demo User:</span>
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const user = users.find((u) => u.id === e.target.value);
                    if (user) setCurrentUser(user);
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Settings */}
              {(currentUser.role === 'Admin' || currentUser.role === 'IT') && (
                <Link
                  to={isAdminPage ? '/' : '/admin/templates'}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Admin Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              )}

              {/* Current User Display */}
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-300">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {currentUser.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{currentUser.name}</div>
                  <div className="text-gray-500">{currentUser.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
