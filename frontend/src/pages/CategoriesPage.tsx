import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  BookOpen,
  FileText,
  Users,
  ChevronRight,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI, resourcesAPI } from '../services/api';

interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  resource_count?: number;
}

interface CategoryFormData {
  name: string;
  description: string;
}

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getCategories();
      
      // Get resource counts for each category
      const categoriesWithCounts = await Promise.all(
        response.data.map(async (category: any) => {
          try {
            const resourcesResponse = await resourcesAPI.getResources({ 
              limit: 1, 
              // category_ids: [category.id] // TODO: Fix API to support category filtering 
            });
            return {
              ...category,
              resource_count: resourcesResponse.data.total || 0
            };
          } catch (error) {
            return { ...category, resource_count: 0 };
          }
        })
      );
      
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) return;
    
    try {
      setSaving(true);
      await categoriesAPI.createCategory(formData);
      await fetchCategories(); // Refresh the list
      closeModal();
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description
    });
    setShowCreateModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) return;
    
    try {
      setSaving(true);
      await categoriesAPI.updateCategory(editingCategory.id, formData);
      await fetchCategories(); // Refresh the list
      closeModal();
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await categoriesAPI.deleteCategory(category.id);
      await fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Cannot delete category. It may contain resources or have dependencies.');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalResources = categories.reduce((sum, cat) => sum + (cat.resource_count || 0), 0);
  const avgResourcesPerCategory = categories.length > 0 ? Math.round(totalResources / categories.length) : 0;

  const CategoryCard = ({ category }: { category: Category }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Folder className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEditCategory(category)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Edit category"
            >
              <Edit className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => handleDeleteCategory(category)}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete category"
            >
              <Trash2 className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            <span>{category.resource_count || 0} resources</span>
          </div>
          <span>Created {formatTimeAgo(category.created_at)}</span>
        </div>

        <button 
          onClick={() => navigate(`/resources?category=${category.name.toLowerCase()}`)}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          View Resources
          <ChevronRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">Organize your learning resources by subject and topic</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Folder className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Resources</p>
              <p className="text-2xl font-bold text-gray-900">{totalResources}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg per Category</p>
              <p className="text-2xl font-bold text-gray-900">{avgResourcesPerCategory}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Create/Edit Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                disabled={!formData.name.trim() || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {editingCategory ? 'Update' : 'Create'} Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};