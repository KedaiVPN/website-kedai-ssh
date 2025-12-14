// src/services/publicService.ts

// Service ini digunakan untuk endpoint API yang tidak memerlukan otentikasi.

export const publicService = {
  /**
   * Mengambil semua banner game topup yang aktif.
   */
  async getGameBanners(): Promise<any[]> {
    const response = await fetch(`/api/banners`);
    if (!response.ok) {
      throw new Error('Gagal mengambil data banner');
    }
    return await response.json();
  }
};
