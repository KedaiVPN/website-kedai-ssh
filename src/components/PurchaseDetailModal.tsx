import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

// Menentukan tipe data untuk detail pembelian
export interface PurchaseDetails {
    product_name_snapshot: string;
    price_at_purchase: number;
    stock_data_email?: string | null;
    stock_data_password?: string | null;
    stock_data_link?: string | null;
    masa_aktif?: string | null;
    created_at: string;
}

interface PurchaseDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    details: PurchaseDetails | null;
}

const PurchaseDetailModal = ({ isOpen, onClose, details }: PurchaseDetailModalProps) => {
    if (!details) return null;

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${fieldName} berhasil disalin!`);
    };

    // Helper untuk merender field input dengan tombol salin
    const renderCopyableField = (label: string, value: string | null | undefined) => {
        if (!value) return null;

        return (
            <div className="space-y-2">
                <Label htmlFor={label}>{label}</Label>
                <div className="flex items-center space-x-2">
                    <Input id={label} value={value} readOnly className="font-mono" />
                    <Button type="button" size="icon" variant="ghost" onClick={() => copyToClipboard(value, label)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pembelian Berhasil!</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p>Berikut adalah detail produk yang telah Anda beli:</p>
                    <div className="p-4 bg-muted rounded-md space-y-4">
                        {renderCopyableField('Email', details.stock_data_email)}
                        {renderCopyableField('Password', details.stock_data_password)}
                        {renderCopyableField('Link', details.stock_data_link)}

                        {details.masa_aktif && (
                             <div className="space-y-2">
                                <Label>Masa Aktif</Label>
                                <Input value={details.masa_aktif} readOnly />
                            </div>
                        )}
                    </div>
                     <div className="text-sm text-muted-foreground">
                        <p><strong>Produk:</strong> {details.product_name_snapshot}</p>
                        <p><strong>Harga:</strong> Rp {details.price_at_purchase.toLocaleString()}</p>
                        <p><strong>Tanggal:</strong> {new Date(details.created_at).toLocaleString('id-ID')}</p>
                    </div>
                     <p className="text-xs text-center text-red-500">Harap simpan detail ini di tempat yang aman. Anda dapat melihat kembali detail ini di halaman riwayat transaksi.</p>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PurchaseDetailModal;
