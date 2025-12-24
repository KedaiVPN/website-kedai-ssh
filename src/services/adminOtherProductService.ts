import axios from 'axios';
import { adminAuthService } from './adminAuthService';

// Konfigurasi instance axios yang sama dengan adminService
const adminApi = axios.create({
    baseURL: '/api/admin',
});

adminApi.interceptors.request.use(config => {
    const token = adminAuthService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


// Tipe data untuk produk dan stok
export interface OtherProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_active: boolean;
    available_stock_count?: number;
}

export interface ProductStock {
    id: number;
    product_id: number;
    stock_data: any;
    status: 'tersedia' | 'terjual';
    sold_at: string | null;
}


// Service object
// Tipe data tambahan untuk Banner
export interface OtherProductBanner {
    id: number;
    image_url: string;
    product_id: number;
    product_name: string;
    product_slug: string;
    created_at: string;
}


export const adminOtherProductService = {
    // ================== PRODUCT METHODS ==================
    async getProducts(): Promise<OtherProduct[]> {
        const response = await adminApi.get('/other-products');
        return response.data;
    },

    async addProduct(productData: FormData): Promise<OtherProduct> {
        const response = await adminApi.post('/other-products', productData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async updateProduct(id: number, productData: FormData): Promise<OtherProduct> {
        // Menggunakan POST dengan query string _method=PUT karena method-override gagal membaca body dari multipart/form-data
        const response = await adminApi.post(`/other-products/${id}?_method=PUT`, productData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async deleteProduct(id: number): Promise<void> {
        await adminApi.delete(`/other-products/${id}`);
    },

    // ================== STOCK METHODS ==================
    async getStock(productId: number): Promise<ProductStock[]> {
        const response = await adminApi.get(`/other-products/${productId}/stock`);
        return response.data;
    },

    async addStock(productId: number, stockData: { stock_data: any }[]): Promise<void> {
        await adminApi.post(`/other-products/${productId}/stock`, { stocks: stockData });
    },

    async deleteStock(stockId: number): Promise<void> {
        await adminApi.delete(`/other-products/stock/${stockId}`);
    },

    // ================== BANNER METHODS ==================
    async getBanners(): Promise<OtherProductBanner[]> {
        const response = await adminApi.get('/other-products/banners');
        return response.data;
    },

    async addBanner(bannerData: FormData): Promise<OtherProductBanner> {
        const response = await adminApi.post('/other-products/banners', bannerData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async deleteBanner(id: number): Promise<void> {
        await adminApi.delete(`/other-products/banners/${id}`);
    },
};
