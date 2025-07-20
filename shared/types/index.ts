// Shared types between frontend and backend

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR';
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string; // JSON string of Gutenberg blocks
  excerpt?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PRIVATE';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author?: User;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string; // JSON string of Gutenberg blocks
  status: 'DRAFT' | 'PUBLISHED' | 'PRIVATE';
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author?: User;
}

export interface Media {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  caption?: string;
  createdAt: Date;
  authorId: number;
  author?: User;
}

// API Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface CreatePostRequest {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'PRIVATE';
  publishedAt?: string;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: number;
}

export interface CreatePageRequest {
  title: string;
  slug: string;
  content: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'PRIVATE';
}

export interface UpdatePageRequest extends Partial<CreatePageRequest> {
  id: number;
}

// Gutenberg Block types
export interface GutenbergBlock {
  blockName: string;
  attrs: Record<string, any>;
  innerBlocks: GutenbergBlock[];
  innerHTML: string;
  innerContent: (string | null)[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
