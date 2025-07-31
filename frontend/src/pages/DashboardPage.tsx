import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  Upload,
  FileText,
  Link,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, resourcesAPI } from '../services/api';

interface UserStats {
  uploaded_resources: number;
  bookmarks: number;
  file_resources: number;
  link_resources: number;
}

interface RecentResource {
  id: number;
  title: string;
  resource_type: string;
  uploader: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  categories: Array<{ name: string }>;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentResources, setRecentResources] = useState<RecentResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats
        const statsResponse = await usersAPI.getUserStats();
        setUserStats(statsResponse.data);
        
        // Fetch recent resources
        const resourcesResponse = await resourcesAPI.getResources({ limit: 3 });
        setRecentResources(resourcesResponse.data.resources || []);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const stats = [
    {
      name: 'My Resources',
      value: userStats?.uploaded_resources?.toString() || '0',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: loading ? 'Loading...' : `${userStats?.file_resources || 0} files, ${userStats?.link_resources || 0} links`
    },
    {
      name: 'My Bookmarks',
      value: userStats?.bookmarks?.toString() || '0',
      icon: Bookmark,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: loading ? 'Loading...' : 'Saved resources'
    },
    {
      name: 'Total Resources',
      value: loading ? '...' : recentResources.length.toString(),
      icon: BookOpen,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: loading ? 'Loading...' : 'Platform wide'
    },
  ];



  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name}! 👋
        </h2>
        <p className="text-gray-600">
          Here's what's happening with your learning resources today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl shadow-sm`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <div className="w-2 h-5 bg-blue-500 rounded mr-3"></div>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/upload')}
              className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-500 transition-colors">
                Upload File
              </p>
            </button>
            <button 
              onClick={() => navigate('/upload')}
              className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <Link className="h-8 w-8 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-green-500 transition-colors">
                Add Link
              </p>
            </button>
            <button 
              onClick={() => navigate('/bookmarks')}
              className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <Bookmark className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-purple-500 transition-colors">
                View Bookmarks
              </p>
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <TrendingUp className="h-8 w-8 text-gray-400 group-hover:text-orange-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-orange-500 transition-colors">
                Analytics
              </p>
            </button>
          </div>
        </div>

        {/* Recent Resources */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-2 h-5 bg-green-500 rounded mr-3"></div>
              Recent Resources
            </h3>
            <button 
              onClick={() => navigate('/resources')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading recent resources...</p>
              </div>
            ) : recentResources.length > 0 ? (
              recentResources.map((resource) => (
                <div key={resource.id} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex-shrink-0">
                    {resource.resource_type === 'file' ? (
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Link className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {resource.title}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>{resource.uploader.first_name} {resource.uploader.last_name}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatTimeAgo(resource.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {resource.categories[0]?.name || 'Uncategorized'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No resources yet</p>
                <p className="text-sm text-gray-400">Upload your first resource to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};