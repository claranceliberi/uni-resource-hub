// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  student_id: string;
  account_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Resource types
export interface Resource {
  id: number;
  title: string;
  description: string;
  resource_type: 'file' | 'link';
  file_path?: string;
  external_url?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  categories: Category[];
  tags: Tag[];
  uploader: User;
}

export interface ResourceCreate {
  title: string;
  description: string;
  resource_type: 'file' | 'link';
  file_path?: string;
  external_url?: string;
  category_ids: number[];
  tag_names: string[];
}

// Category types
export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  color?: string;
}

// Tag types
export interface Tag {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// Bookmark types
export interface Bookmark {
  id: number;
  user_id: number;
  resource_id: number;
  created_at: string;
  resource: Resource;
}

// Authentication types
export interface Token {
  access_token: string;
  token_type: string;
}

// API Response types
export interface APIError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Search and filter types
export interface ResourceFilter {
  search?: string;
  category_ids?: number[];
  tag_names?: string[];
  resource_type?: 'file' | 'link';
  uploaded_by?: number;
  page?: number;
  size?: number;
}
