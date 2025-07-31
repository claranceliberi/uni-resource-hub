import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Bookmark, 
  Plus, 
  LayoutDashboard, 
  Search,
  Upload,
  Menu,
  X,
  Bell,
  ChevronRight,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/resources?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Resources', icon: BookOpen, path: '/resources' },
    { name: 'Upload', icon: Upload, path: '/upload' },
    { name: 'Bookmarks', icon: Bookmark, path: '/bookmarks' },
    { name: 'Categories', icon: Users, path: '/categories' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Close mobile sidebar after navigation
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    const navItem = navLinks.find(link => link.path === currentPath);
    return navItem ? navItem.name : 'Dashboard';
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed to left edge, full height */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:flex lg:flex-col
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">UniResource</span>
            </div>
            <button 
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <button 
                    onClick={() => handleNavigation(link.path)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200
                      ${isActivePath(link.path)
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <link.icon className={`h-5 w-5 mr-3 ${
                        isActivePath(link.path) ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <span className="font-medium">{link.name}</span>
                    </div>
                    {isActivePath(link.path) && (
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="px-4 py-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center mb-4">
              <button
                onClick={() => handleNavigation('/profile')}
                className="flex items-center w-full hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <User className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <button
              onClick={logout}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Header Bar - Full width, properly aligned */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left section - Mobile menu + Title */}
            <div className="flex items-center min-w-0">
              <button 
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-3 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500">Welcome back to UniResource</p>
              </div>
            </div>
            
            {/* Center section - Search bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </form>
            </div>

            {/* Right section - Notifications + Upload button */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => alert('Notifications feature coming soon!')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                title="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={() => handleNavigation('/upload')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Upload Resource</span>
                <span className="sm:hidden">Upload</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};