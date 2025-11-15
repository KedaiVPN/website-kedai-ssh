import axios from 'axios';
import { adminAuthService } from './adminAuthService';

const API_URL = '/api/articles';

// =================================================================================
// == Tipe Data
// =================================================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  updated_at: string;
  author_name: string;
}

export interface ArticleFull extends ArticleSummary {
    content: string;
    featured_image_url?: string;
    meta_description?: string;
    excerpt?: string;
    published_at?: string;
    categories: string; // Comes as comma-separated string from API
    tags: string; // Comes as comma-separated string from API
}

export interface ArticleFormData {
    title: string;
    content: string;
    status: 'draft' | 'published';
    featured_image_url?: string;
    meta_description?: string;
    excerpt?: string;
    categories: number[]; // Array of category IDs
    tags: number[]; // Array of tag IDs
}

export interface ArticleForEdit extends Omit<ArticleFormData, 'categories' | 'tags'> {
    id: number;
    categories: number[];
    tags: number[];
}


// =================================================================================
// == Fungsi Service
// =================================================================================

const getAuthHeaders = () => {
  const token = adminAuthService.getToken();
  if (!token) {
    throw new Error('Admin token tidak ditemukan');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// --- Kategori ---
const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(`${API_URL}/categories`, getAuthHeaders());
  return response.data;
};

const createCategory = async (name: string): Promise<Category> => {
    const response = await axios.post(`${API_URL}/categories`, { name }, getAuthHeaders());
    return response.data;
};

const deleteCategory = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/categories/${id}`, getAuthHeaders());
};

// --- Tag ---
const getTags = async (): Promise<Tag[]> => {
    const response = await axios.get(`${API_URL}/tags`, getAuthHeaders());
    return response.data;
};

const createTag = async (name: string): Promise<Tag> => {
    const response = await axios.post(`${API_URL}/tags`, { name }, getAuthHeaders());
    return response.data;
};

const deleteTag = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/tags/${id}`, getAuthHeaders());
};

// --- Artikel ---
const getArticles = async (): Promise<ArticleSummary[]> => {
  const response = await axios.get(API_URL, getAuthHeaders());
  return response.data;
};

const createArticle = async (data: ArticleFormData): Promise<{ id: number; message: string }> => {
    const response = await axios.post(API_URL, data, getAuthHeaders());
    return response.data;
};

const getArticleForEdit = async (id: number): Promise<ArticleForEdit> => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

const updateArticle = async (id: number, data: ArticleFormData): Promise<{ id: number; message: string }> => {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return response.data;
};

const deleteArticle = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
};

// --- Upload Gambar ---
const uploadImage = async (imageFile: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(`${API_URL}/upload-image`, formData, {
        ...getAuthHeaders(),
        headers: {
            ...getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};


export const articleService = {
  getCategories,
  createCategory,
  deleteCategory,
  getTags,
  createTag,
  deleteTag,
  getArticles,
  createArticle,
  getArticleForEdit,
  updateArticle,
  deleteArticle,
  uploadImage,
};
