import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  X, 
  Plus,
  Tag,
  Folder,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resourcesAPI, categoriesAPI } from '../services/api';

type UploadType = 'file' | 'link';

interface FormData {
  title: string;
  description: string;
  categories: number[];
  tags: string[];
  url?: string;
  file?: File;
}

interface Category {
  id: number;
  name: string;
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadType, setUploadType] = useState<UploadType>('file');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categories: [],
    tags: [],
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getCategories();
      setAvailableCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (uploadType === 'file' && formData.file) {
        // Upload file
        await resourcesAPI.uploadFile(formData.file, {
          title: formData.title,
          description: formData.description,
          category_ids: formData.categories,
          tag_names: formData.tags,
        });
      } else if (uploadType === 'link' && formData.url) {
        // Create link resource
        await resourcesAPI.createResource({
          title: formData.title,
          description: formData.description,
          resource_type: 'link',
          url: formData.url,
          category_ids: formData.categories,
          tag_names: formData.tags,
        });
      }

      setUploadSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        categories: [],
        tags: [],
      });
      
      // Redirect to resources page after success
      setTimeout(() => {
        navigate('/resources');
      }, 2000);
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const isFormValid = () => {
    const hasTitle = formData.title.trim().length > 0;
    const hasContent = uploadType === 'file' ? !!formData.file : !!formData.url?.trim();
    const hasCategory = formData.categories.length > 0;
    
    return hasTitle && hasContent && hasCategory;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Resource</h1>
        <p className="text-gray-600">Share learning materials with your fellow students</p>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <span className="text-green-800">Resource uploaded successfully! Redirecting to resources...</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Upload Type Selector */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What would you like to share?</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setUploadType('file')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  uploadType === 'file'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">Upload File</h3>
                  <p className="text-sm text-gray-600 mt-1">PDF, DOCX, PPTX, images, etc.</p>
                </div>
              </button>
              <button
                onClick={() => setUploadType('link')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  uploadType === 'link'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <LinkIcon className="h-8 w-8 mx-auto mb-2" />
                <div className="text-center">
                  <h3 className="font-medium">Share Link</h3>
                  <p className="text-sm text-gray-600 mt-1">YouTube, articles, websites, etc.</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* File Upload or URL Input */}
            {uploadType === 'file' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File *
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : formData.file
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  />
                  {formData.file ? (
                    <div className="flex items-center justify-center">
                      <FileText className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-800">{formData.file.name}</p>
                        <p className="text-sm text-green-600">
                          {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-600">
                        Supports PDF, DOCX, PPTX, images up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource URL *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/resource"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title for your resource"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide a brief description of the resource content"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories * (Select at least one)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                      formData.categories.includes(category.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Folder className="h-4 w-4 mx-auto mb-1" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Form Validation Message */}
            {!isFormValid() && (
              <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="text-yellow-800 text-sm">
                  Please fill in all required fields: title, {uploadType === 'file' ? 'file' : 'URL'}, and at least one category.
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/resources')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || uploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resource
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};