import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import { CreditCard, Save } from 'lucide-react';

const PaymentGatewayManager = () => {
  const [activeGateway, setActiveGateway] = useState<string>('TRIPAY');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGatewayConfig();
  }, []);

  const fetchGatewayConfig = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getPaymentGatewayConfig();
      if (response && response.gateway) {
        setActiveGateway(response.gateway);
      }
    } catch (error) {
      console.error('Failed to fetch payment gateway config:', error);
      toast.error('Gagal memuat konfigurasi payment gateway');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminService.updatePaymentGatewayConfig(activeGateway);
      toast.success('Konfigurasi payment gateway berhasil disimpan');
    } catch (error) {
      console.error('Failed to update payment gateway:', error);
      toast.error('Gagal menyimpan konfigurasi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pengaturan Payment Gateway
        </CardTitle>
        <CardDescription>
          Pilih payment gateway yang aktif untuk transaksi topup user.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="gateway">Active Gateway</Label>
            <div className="flex gap-4">
                <Select value={activeGateway} onValueChange={setActiveGateway} disabled={isLoading}>
                <SelectTrigger id="gateway" className="w-[200px]">
                    <SelectValue placeholder="Pilih Gateway" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="TRIPAY">Tripay (Default)</SelectItem>
                    <SelectItem value="MIDTRANS">Midtrans</SelectItem>
                </SelectContent>
                </Select>
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
                Pastikan API Key untuk gateway yang dipilih sudah dikonfigurasi di file .env server.
            </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentGatewayManager;
