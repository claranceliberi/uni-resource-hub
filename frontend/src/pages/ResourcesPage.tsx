import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  FileText,
  Link as LinkIcon,
  Calendar,
  User,
  Tag,
  ChevronDown
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { resourcesAPI, categoriesAPI, bookmarksAPI } from '../services/api';

interface Resource {
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
}

interface Category {
  id: number;
  name: string;
}

export const ResourcesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<number>>(new Set());
  const [totalResources, setTotalResources] = useState(0);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchResources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categoriesResponse = await categoriesAPI.getCategories();
      setCategories(categoriesResponse.data);
      
      // Fetch initial resources
      await fetchResources();
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const params: any = { limit: 20, offset: 0 };
      
      if (searchQuery) params.query = searchQuery;
      if (selectedCategory !== 'all') {
        const category = categories.find(cat => cat.name.toLowerCase() === selectedCategory);
        if (category) params.category_ids = [category.id];
      }
      if (selectedType !== 'all') {
        params.resource_type = selectedType === 'files' ? 'file' : 'link';
      }
      
      const response = await resourcesAPI.getResources(params);
      setResources(response.data.resources || []);
      setTotalResources(response.data.total || 0);
      
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const toggleBookmark = async (resourceId: number) => {
    try {
      await bookmarksAPI.toggleBookmark(resourceId);
      
      // Update local state
      setBookmarkedResources(prev => {
        const newSet = new Set(prev);
        if (newSet.has(resourceId)) {
          newSet.delete(resourceId);
        } else {
          newSet.add(resourceId);
        }
        return newSet;
      });
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
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

  const categoryOptions = ['All', ...categories.map(cat => cat.name)];
  const resourceTypes = ['All', 'Files', 'Links'];

  const handleResourceAction = (resource: Resource) => {
    if (resource.resource_type === 'file') {
      // Download file
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/resources/${resource.id}/download`;
      const token = localStorage.getItem('access_token');
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', resource.title);
      
      // Add authorization header by opening in new tab with token
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

  const ResourceCard = ({ resource }: { resource: Resource }) => (
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
            onClick={() => toggleBookmark(resource.id)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {bookmarkedResources.has(resource.id) ? (
              <BookmarkCheck className="h-5 w-5 text-blue-600" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-400" />
            )}
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

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            <span>{resource.uploader.first_name} {resource.uploader.last_name}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatTimeAgo(resource.created_at)}</span>
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

  const ResourceListItem = ({ resource }: { resource: Resource }) => (
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
              <span>{formatTimeAgo(resource.created_at)}</span>
              <span className="mx-2">•</span>
              <span>{resource.categories[0]?.name || 'Uncategorized'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => toggleBookmark(resource.id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {bookmarkedResources.has(resource.id) ? (
              <BookmarkCheck className="h-4 w-4 text-blue-600" />
            ) : (
              <Bookmark className="h-4 w-4 text-gray-400" />
            )}
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources</h1>
        <p className="text-gray-600">Browse and search through all available learning resources</p>
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
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

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

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {resourceTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          Showing {resources.length} of {totalResources} resources
        </p>
      </div>

      {/* Resources Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading resources...</p>
        </div>
      ) : resources.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <ResourceListItem key={resource.id} resource={resource} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};