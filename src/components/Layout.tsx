import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Bell, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, users, setCurrentUser, notifications, markNotificationRead, markAllNotificationsRead } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isAdminPage = location.pathname.startsWith('/admin');

  // Filter notifications for current user
  const userNotifications = notifications.filter(n => n.to === currentUser.name);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Debug logging
  React.useEffect(() => {
    console.log('[Layout] Current user:', currentUser.name);
    console.log('[Layout] All notifications:', notifications);
    console.log('[Layout] User notifications:', userNotifications);
    console.log('[Layout] Unread count:', unreadCount);
  }, [currentUser.name, notifications, userNotifications, unreadCount]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markNotificationRead(notification.id);
    setShowNotifications(false);
    navigate(notification.link);
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 flex-1 mx-8">
              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/' || location.pathname.startsWith('/request/') || location.pathname.startsWith('/create-request/')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Requests
              </Link>
              <Link
                to="/uns-config"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/uns-config'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Manual UNS Structure Input
              </Link>
            </div>

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

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllNotificationsRead();
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                      {userNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {userNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                  notification.type === 'request_assigned' ? 'bg-blue-100' :
                                  notification.type === 'status_changed' ? 'bg-yellow-100' :
                                  notification.type === 'new_comment' ? 'bg-green-100' :
                                  notification.type === 'request_submitted' ? 'bg-purple-100' :
                                  'bg-gray-100'
                                }`}>
                                  <span className={`text-xs font-medium ${
                                    notification.type === 'request_assigned' ? 'text-blue-600' :
                                    notification.type === 'status_changed' ? 'text-yellow-600' :
                                    notification.type === 'new_comment' ? 'text-green-600' :
                                    notification.type === 'request_submitted' ? 'text-purple-600' :
                                    'text-gray-600'
                                  }`}>
                                    {notification.from.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 font-medium">
                                    {notification.requestName}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatNotificationTime(notification.timestamp)}
                                  </p>
                                </div>

                                {/* Unread indicator */}
                                {!notification.read && (
                                  <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
