import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  GraduationCap, 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  User, 
  LogOut,
  Bell,
  Settings,
  Search,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications] = useState([
    { id: 1, message: 'New student registered', time: '2 minutes ago', type: 'info' },
    { id: 2, message: 'Attendance report generated', time: '1 hour ago', type: 'success' },
    { id: 3, message: 'System maintenance scheduled', time: '3 hours ago', type: 'warning' }
  ]);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef();
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      // Close search results when clicking outside
      if (searchQuery && !event.target.closest('.search-container')) {
        // setShowSearchResults(false); // This line was removed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  // Don't render until authentication is ready - MOVED AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Overview & Analytics' },
    { name: 'Students', href: '/students', icon: Users, description: 'Manage Student Database' },
    { name: 'Classes', href: '/classes', icon: BookOpen, description: 'Course Management' },
    { name: 'Attendance', href: '/attendance', icon: Calendar, description: 'Track Student Attendance' },
    { name: 'Reports', href: '/reports', icon: TrendingUp, description: 'Analytics & Insights' }
  ];

  const quickActions = [
    {
      name: 'Add Student',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      action: () => {
        navigate('/students');
        setSidebarOpen(false);
      }
    },
    {
      name: 'New Class',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      action: () => {
        navigate('/classes');
        setSidebarOpen(false);
      }
    },
    {
      name: 'Take Attendance',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      action: () => {
        navigate('/attendance');
        setSidebarOpen(false);
      }
    },
    {
      name: 'View Reports',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      action: () => {
        navigate('/dashboard');
        setSidebarOpen(false);
        toast.success('Viewing dashboard analytics');
      }
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => location.pathname === href;

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchLoading(true);
      // Simulate search delay
      setTimeout(() => {
        toast.success(`Searching for: ${searchQuery}`);
        // setShowSearchResults(false); // This line was removed
        setSearchLoading(false);
      }, 1000);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // setShowSearchResults(e.target.value.length > 0); // This line was removed
    if (e.target.value.length === 0) {
      // setShowSearchResults(false); // This line was removed
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={closeSidebar} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              {/* Mobile header */}
              <div className="flex h-20 items-center justify-between px-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <span className="ml-3 text-xl font-bold text-white">Attendance Pro</span>
                </div>
                <button
                  onClick={closeSidebar}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Mobile content - Scrollable */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* User Profile */}
                <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.name || 'Teacher'}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation - Scrollable */}
                <div className="flex-1 overflow-y-auto sidebar-scrollbar">
                  <nav className="px-4 py-6 space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            navigate(item.href);
                            closeSidebar();
                          }}
                          className={`group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                          }`}
                        >
                          <Icon className={`mr-3 h-5 w-5 transition-transform duration-300 ${
                            isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          <div className="text-left">
                            <div className="font-medium">{item.name}</div>
                            <div className={`text-xs ${isActive(item.href) ? 'text-white/80' : 'text-gray-500'}`}>
                              {item.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Quick Actions */}
                  <div className="px-4 py-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.name}
                          onClick={() => {
                            action.action();
                            closeSidebar();
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${action.color} mr-3`}>
                            <action.icon className="h-4 w-4 text-white" />
                          </div>
                          {action.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <div className="px-4 py-4 border-t border-gray-200 flex-shrink-0">
                  <button
                    onClick={() => {
                      handleLogout();
                      closeSidebar();
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col h-full bg-white shadow-2xl border-r border-gray-200">
          {/* Logo Section */}
          <div className="flex h-20 items-center px-6 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
            <div className="p-2 bg-white/20 rounded-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-white">Attendance Pro</span>
          </div>

          {/* User Profile */}
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name || 'Teacher'}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Navigation - Scrollable */}
            <div className="flex-1 overflow-y-auto sidebar-scrollbar">
              <nav className="space-y-2 px-4 py-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className={`group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 transition-transform duration-300 ${
                        isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      <div className="text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className={`text-xs ${isActive(item.href) ? 'text-white/80' : 'text-gray-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="px-4 py-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.name}
                      onClick={action.action}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${action.color} mr-3`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      {action.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="px-4 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 shadow-sm">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md mx-4 search-container">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, classes, or attendance..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={searchLoading}
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500">
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </form>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <button 
                onClick={() => toast.success('Settings page coming soon!')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="h-6 w-6" />
              </button>

              {/* Help */}
              <button 
                onClick={() => toast.success('Help documentation coming soon!')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HelpCircle className="h-6 w-6" />
              </button>

              {/* User menu with logout */}
              <div className="flex items-center gap-x-3">
                <div className="flex items-center gap-x-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
