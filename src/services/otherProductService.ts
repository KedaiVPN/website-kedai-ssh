import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use(config => {
    const token = authService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Interface untuk data produk yang diterima dari API
export interface AvailableProduct {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    available_stock_count: number;
    sold_stock_count: number;
}

// Interface untuk data detail produk lengkap
export interface ProductDetail extends AvailableProduct {
    description: string;
}

// Interface untuk detail pembelian yang diterima setelah checkout
export interface PurchaseDetails {
    id: number;
    product_name: string;
    price_at_purchase: number;
    stock_data_email: string | null;
    stock_data_password: string | null;
    stock_data_link: string | null;
    masa_aktif: string | null;
    created_at: string;
}

// Interface untuk riwayat transaksi yang disederhanakan
export interface PurchaseHistoryItem {
    id: number;
    product_name_snapshot: string;
    price_at_purchase: number;
    created_at: string;
}

interface PurchaseResponse {
    success: boolean;
    message: string;
    data?: PurchaseDetails;
}

export const otherProductService = {
    /**
     * Mengambil semua produk yang aktif dan memiliki stok.
     */
    async getAvailableProducts(): Promise<AvailableProduct[]> {
        const response = await api.get('/other-products');
        return response.data.data;
    },

    /**
     * Memproses pembelian sebuah produk.
     * @param productId ID produk yang akan dibeli.
     */
    async purchaseProduct(productId: number): Promise<PurchaseResponse> {
        const response = await api.post('/other-products/purchase', { productId });
        return response.data;
    },

    /**
     * Mengambil riwayat pembelian "produk lainnya" untuk pengguna yang sedang login.
     */
    async getPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
        const response = await api.get('/other-products/history');
        return response.data.data;
    },

    /**
     * Mengambil detail spesifik dari satu transaksi pembelian.
     * @param transactionId ID transaksi yang akan dilihat.
     */
    async getTransactionDetails(transactionId: number): Promise<PurchaseDetails> {
        const response = await api.get(`/other-products/transaction/${transactionId}`);
        return response.data.data;
    },

    /**
     * Mengambil detail produk berdasarkan slug-nya.
     * @param slug Slug produk yang akan dicari.
     */
    async getProductBySlug(slug: string): Promise<ProductDetail> {
        const response = await api.get(`/other-products/${slug}`);
        return response.data.data;
    },
};
