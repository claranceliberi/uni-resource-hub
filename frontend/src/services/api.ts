import axios, { AxiosResponse } from 'axios';
import {
  User,
  UserCreate,
  UserLogin,
  Token,
  Resource,
  ResourceCreate,
  Category,
  CategoryCreate,
  Tag,
  Bookmark,
  PaginatedResponse,
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://https://liberiste.vercel.app/.onrender.com/api/v1'
    : 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials: UserLogin): Promise<AxiosResponse<Token>> =>
    api.post('/auth/token', credentials, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      transformRequest: [(data) => {
        const params = new URLSearchParams();
        params.append('username', data.email);
        params.append('password', data.password);
        return params;
      }],
    }),

  register: async (userData: UserCreate): Promise<AxiosResponse<User>> =>
    api.post('/auth/register', userData),

  getCurrentUser: async (): Promise<AxiosResponse<User>> =>
    api.get('/auth/me'),

  refreshToken: async (): Promise<AxiosResponse<Token>> =>
    api.post('/auth/refresh'),
};

// Users API
export const usersAPI = {
  getUsers: async (page = 1, size = 20): Promise<AxiosResponse<PaginatedResponse<User>>> =>
    api.get(`/users?page=${page}&size=${size}`),

  getUser: async (userId: number): Promise<AxiosResponse<User>> =>
    api.get(`/users/${userId}`),

  updateUser: async (userId: number, userData: Partial<User>): Promise<AxiosResponse<User>> =>
    api.put(`/users/${userId}`, userData),

  deleteUser: async (userId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/users/${userId}`),

  getUserStats: async (): Promise<AxiosResponse<any>> =>
    api.get('/users/me/stats'),

  updateProfile: async (userData: Partial<User>): Promise<AxiosResponse<User>> =>
    api.put('/users/me', userData),

  changePassword: async (currentPassword: string, newPassword: string): Promise<AxiosResponse<any>> =>
    api.post('/users/me/change-password', { current_password: currentPassword, new_password: newPassword }),

  getUserRecentActivity: async (): Promise<AxiosResponse<any>> =>
    api.get('/users/me/recent-activity'),
};

// Resources API
export const resourcesAPI = {
  getResources: async (params?: { limit?: number; offset?: number; query?: string }): Promise<AxiosResponse<any>> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.query) searchParams.append('query', params.query);
    
    return api.get(`/resources?${searchParams.toString()}`);
  },

  getResource: async (resourceId: number): Promise<AxiosResponse<Resource>> =>
    api.get(`/resources/${resourceId}`),

  createResource: async (resourceData: any): Promise<AxiosResponse<Resource>> =>
    api.post('/resources', resourceData),

  updateResource: async (resourceId: number, resourceData: Partial<ResourceCreate>): Promise<AxiosResponse<Resource>> =>
    api.put(`/resources/${resourceId}`, resourceData),

  deleteResource: async (resourceId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/resources/${resourceId}`),

  uploadFile: async (file: File, metadata: Omit<ResourceCreate, 'file_path' | 'resource_type'>): Promise<AxiosResponse<Resource>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('category_ids', JSON.stringify(metadata.category_ids));
    formData.append('tag_names', JSON.stringify(metadata.tag_names));

    return api.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  downloadFile: async (resourceId: number): Promise<AxiosResponse<Blob>> =>
    api.get(`/resources/${resourceId}/download`, {
      responseType: 'blob',
    }),
};

// Categories API
export const categoriesAPI = {
  getCategories: async (): Promise<AxiosResponse<Category[]>> =>
    api.get('/categories'),

  getCategory: async (categoryId: number): Promise<AxiosResponse<Category>> =>
    api.get(`/categories/${categoryId}`),

  createCategory: async (categoryData: CategoryCreate): Promise<AxiosResponse<Category>> =>
    api.post('/categories', categoryData),

  updateCategory: async (categoryId: number, categoryData: Partial<CategoryCreate>): Promise<AxiosResponse<Category>> =>
    api.put(`/categories/${categoryId}`, categoryData),

  deleteCategory: async (categoryId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/categories/${categoryId}`),
};

// Tags API
export const tagsAPI = {
  getTags: async (): Promise<AxiosResponse<Tag[]>> =>
    api.get('/tags'),

  getTag: async (tagId: number): Promise<AxiosResponse<Tag>> =>
    api.get(`/tags/${tagId}`),

  createTag: async (tagName: string): Promise<AxiosResponse<Tag>> =>
    api.post('/tags', { name: tagName }),

  updateTag: async (tagId: number, tagName: string): Promise<AxiosResponse<Tag>> =>
    api.put(`/tags/${tagId}`, { name: tagName }),

  deleteTag: async (tagId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/tags/${tagId}`),
};

// Bookmarks API
export const bookmarksAPI = {
  getBookmarks: async (page = 1, size = 20): Promise<AxiosResponse<PaginatedResponse<Bookmark>>> =>
    api.get(`/bookmarks?page=${page}&size=${size}`),

  addBookmark: async (resourceId: number): Promise<AxiosResponse<Bookmark>> =>
    api.post('/bookmarks', { resource_id: resourceId }),

  removeBookmark: async (bookmarkId: number): Promise<AxiosResponse<void>> =>
    api.delete(`/bookmarks/${bookmarkId}`),

  isBookmarked: async (resourceId: number): Promise<AxiosResponse<{ bookmarked: boolean }>> =>
    api.get(`/bookmarks/check/${resourceId}`),

  toggleBookmark: async (resourceId: number): Promise<AxiosResponse<any>> =>
    api.post(`/bookmarks/toggle/${resourceId}`),
};

export default api;
