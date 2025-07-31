import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Search, 
  Download, 
  ExternalLink, 
  FileText, 
  Link as LinkIcon, 
  Calendar, 
  User, 
  Tag,
  Trash2,
  Grid,
  List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookmarksAPI, categoriesAPI } from '../services/api';

interface BookmarkedResource {
  id: number;
  resource: {
    id: number;
    title: string;
    description: string;
    resource_type: 'file' | 'link';
    uploader: {
      first_name: string;
      last_name: string;
    };
    created_at: string;
    categories: Array<{ id: number; name: string }>;
    tags: Array<{ id: number; name: string }>;
    file_size?: number;
    url?: string;
    file_path?: string;
  };
  bookmark_date: string;
}

interface Category {
  id: number;
  name: string;
}

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedResources, setBookmarkedResources] = useState<BookmarkedResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookmarks and categories
      const [bookmarksResponse, categoriesResponse] = await Promise.all([
        bookmarksAPI.getBookmarks(),
        categoriesAPI.getCategories()
      ]);
      
      setBookmarkedResources((bookmarksResponse.data as any) || []);
      setCategories(categoriesResponse.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: number) => {
    try {
      await bookmarksAPI.removeBookmark(bookmarkId);
      
      // Update local state
      setBookmarkedResources(prev => 
        prev.filter(bookmark => bookmark.id !== bookmarkId)
      );
      
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const filteredResources = bookmarkedResources.filter(bookmark => {
    const resource = bookmark.resource;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           resource.categories.some(cat => cat.name.toLowerCase() === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = ['All', ...categories.map(cat => cat.name)];

  const handleResourceAction = (resource: BookmarkedResource['resource']) => {
    if (resource.resource_type === 'file') {
      // Download file
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/resources/${resource.id}/download`;
      const token = localStorage.getItem('access_token');
      
      if (token) {
        fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = resource.title;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        })
        .catch(error => {
          console.error('Download failed:', error);
          alert('Download failed. Please try again.');
        });
      }
    } else {
      // Open link in new tab
      if (resource.url) {
        window.open(resource.url, '_blank');
      } else {
        alert('No URL available for this resource.');
      }
    }
  };

  const BookmarkCard = ({ bookmark }: { bookmark: BookmarkedResource }) => {
    const { resource } = bookmark;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                resource.resource_type === 'file' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {resource.resource_type === 'file' ? (
                  <FileText className="h-6 w-6 text-blue-600" />
                ) : (
                  <LinkIcon className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{resource.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
              </div>
            </div>
            <button
              onClick={() => removeBookmark(bookmark.id)}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group"
              title="Remove bookmark"
            >
              <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag.name}
              </span>
            ))}
          </div>

          <div className="space-y-2 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>Uploaded by {resource.uploader.first_name} {resource.uploader.last_name}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Uploaded {formatTimeAgo(resource.created_at)}</span>
            </div>
            <div className="flex items-center">
              <BookmarkCheck className="h-4 w-4 mr-2 text-blue-600" />
              <span>Bookmarked {formatTimeAgo(bookmark.bookmark_date)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {resource.categories[0]?.name || 'Uncategorized'}
            </span>
            <div className="flex items-center space-x-2">
              {resource.file_size && (
                <span className="text-xs text-gray-500">{formatFileSize(resource.file_size)}</span>
              )}
              <button 
                onClick={() => handleResourceAction(resource)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {resource.resource_type === 'file' ? (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BookmarkListItem = ({ bookmark }: { bookmark: BookmarkedResource }) => {
    const { resource } = bookmark;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              resource.resource_type === 'file' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {resource.resource_type === 'file' ? (
                <FileText className="h-5 w-5 text-blue-600" />
              ) : (
                <LinkIcon className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{resource.title}</h3>
              <p className="text-xs text-gray-600 truncate">{resource.description}</p>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span>{resource.uploader.first_name} {resource.uploader.last_name}</span>
                <span className="mx-2">•</span>
                <span>Bookmarked {formatTimeAgo(bookmark.bookmark_date)}</span>
                <span className="mx-2">•</span>
                <span>{resource.categories[0]?.name || 'Uncategorized'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => removeBookmark(bookmark.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group"
              title="Remove bookmark"
            >
              <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
            </button>
            <button 
              onClick={() => handleResourceAction(resource)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {resource.resource_type === 'file' ? (
                <>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </>
              ) : (
                <>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
        <p className="text-gray-600">Quick access to your saved learning resources</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filter and View Controls */}
          <div className="flex items-center space-x-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          {filteredResources.length} bookmarked resource{filteredResources.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Bookmarks Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading bookmarks...</p>
        </div>
      ) : filteredResources.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredResources.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((bookmark) => (
              <BookmarkListItem key={bookmark.id} bookmark={bookmark} />
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || selectedCategory !== 'all' ? 'No bookmarks found' : 'No bookmarks yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start bookmarking resources to access them quickly later'
            }
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <button 
              onClick={() => navigate('/resources')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4 mr-2" />
              Browse Resources
            </button>
          )}
        </div>
      )}
    </div>
  );
};