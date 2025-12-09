import axios from 'axios';

const API_URL = '/api/admin/game-brands';

// Setup an axios instance with authentication
const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const gameImageAdminService = {
  getUniqueBrands: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`${API_URL}/unique`);
    return response.data;
  },

  getAllBrandImages: async (): Promise<{ brand_name: string; image_url: string }[]> => {
    const response = await apiClient.get<{ brand_name: string; image_url: string }[]>(`${API_URL}/images`);
    return response.data;
  },

  uploadBrandImage: async (brand: string, image: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('brand', brand);
    formData.append('image', image);

    const response = await apiClient.post<{ imageUrl: string }>(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteBrandImage: async (brandName: string): Promise<void> => {
    await apiClient.delete(`${API_URL}/images/${encodeURIComponent(brandName)}`);
  },
};
